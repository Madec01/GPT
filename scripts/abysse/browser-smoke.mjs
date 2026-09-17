/** Public UI browser checks. No simulation access, teleports or storage writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {chromium,firefox} from 'playwright';

const root=fileURLToPath(new URL('../../',import.meta.url));
const name=process.env.SMOKE_BROWSER||'chrome';
assert(['chrome','firefox','msedge'].includes(name));
const output=path.join(root,'test-results','abysse',name);
const origin='http://127.0.0.1:8000';
const audioManifest=JSON.parse(await fs.readFile(path.join(root,'assets/abysse/audio.json'),'utf8'));
const issues=[], warnings=[], checkpoints=[];
let browser,context,page,server,failure,deadline,serverLog='',audioReport=[],webgl;
const started=Date.now();
const mark=text=>{checkpoints.push(text);console.log(`[${name}] ${text}`);};
const shot=async label=>{
 await page.screenshot({path:path.join(output,`${label}.png`),fullPage:true});
 // Small, non-sensitive previews let reviewers inspect CI rendering without
 // downloading the full trace; originals remain in the workflow artifacts.
 if(name==='chrome'&&['01-menu','05-first-dive','08-final-sector-sonar'].includes(label)){
  const preview=await page.screenshot({type:'jpeg',quality:55});
  console.log(`QA_PREVIEW ${label} ${preview.toString('base64')}`);
 }
};
const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('abysse-expedition-v1')||'null'));
async function startServer(){
 server=spawn(process.env.PYTHON||'python3',['-m','http.server','8000','--bind','127.0.0.1'],{cwd:root,stdio:['ignore','pipe','pipe']});
 let error;server.on('error',e=>{error=e;});
 server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
 for(let i=0;i<80;i++){
  if(error)throw error;if(server.exitCode!==null)throw new Error(serverLog);
  try{if((await fetch(origin,{signal:AbortSignal.timeout(600)})).ok)return;}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 throw new Error('Static server did not start');
}
async function pressUntilDepth(key,target){
 await page.keyboard.down(key);
 try{await page.waitForFunction(target=>Number(document.querySelector('#depth').textContent)>=target,target,{timeout:25000});}
 finally{await page.keyboard.up(key);}
}
async function smoke(){
 await fs.mkdir(output,{recursive:true});await startServer();
 browser=await(name==='firefox'?firefox:chromium).launch({headless:process.env.QA_HEADED!=='1',...(name==='firefox'?{
  firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true},
 }:{channel:name,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']})});
 context=await browser.newContext({viewport:{width:1440,height:900},locale:'fr-FR'});
 await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 // Observe real media playback without changing its arguments, promise or state.
 await context.addInitScript(()=>{
  window.__qaMedia=[];
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
   if(!window.__qaMedia.includes(this))window.__qaMedia.push(this);
   return play.apply(this,args);
  };
 });
 page=await context.newPage();page.setDefaultTimeout(25000);
 page.on('pageerror',e=>issues.push(`JavaScript: ${e.stack||e.message}`));
 page.on('console',m=>{if(m.type()==='error')issues.push(`Console: ${m.text()}`);else if(m.type()==='warning')warnings.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)issues.push(`HTTP ${r.status()}: ${r.url()}`);});
 page.on('requestfailed',r=>{const reason=r.failure()?.errorText||'';if(!/ABORTED|NS_BINDING_ABORTED/.test(reason))issues.push(`Request: ${r.url()} ${reason}`);});
 await page.goto(origin,{waitUntil:'load',timeout:90000});
 await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 await page.locator('#play').waitFor({state:'visible'});
 webgl=await page.evaluate(()=>{const canvas=document.querySelector('#ocean'),gl=canvas.getContext('webgl2');return gl?{lost:gl.isContextLost(),renderer:gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION),width:canvas.width,height:canvas.height}:null;});
 assert(webgl&&!webgl.lost&&webgl.width>0,'Real WebGL2 context must be active');
 await shot('01-menu');mark('Menu and real WebGL2 renderer loaded');
 await page.locator('#credits').click();
 await page.locator('#credits-close').waitFor({state:'visible'});
 assert.match(await page.locator('#modal').textContent(),/SIL OFL|CC0|Creative Commons/);
 await shot('02-credits');await page.locator('#credits-close').click();
 await page.locator('#options').click();
 await page.locator('#music-volume').focus();await page.keyboard.press('Home');
 for(let i=0;i<35;i++)await page.keyboard.press('ArrowRight');
 const volume=await page.locator('#music-volume').inputValue();
 await page.locator('#reduced').check();await shot('03-options');
 await page.locator('#options-close').click();
 assert.equal((await save()).options.music,Number(volume)/100);
 mark('Credits, volume and accessibility options work through UI');
 await page.locator('#play').click();await page.locator('#launch').waitFor();
 assert.match(await page.locator('#screen').textContent(),/La lisière/);
 await shot('04-briefing');await page.locator('#launch').click();
 await page.locator('#hud').waitFor({state:'visible'});
 await page.waitForFunction(()=>window.__qaMedia.some(a=>a.loop&&!a.paused&&a.currentTime>.1),null,{timeout:20000});
 const initialDepth=Number(await page.locator('#depth').textContent());
 await pressUntilDepth('ArrowDown',initialDepth+12);
 assert(Number(await page.locator('#depth').textContent())>=initialDepth+12);
 await shot('05-first-dive');
 await page.locator('#pause-button').click();await page.locator('#resume').waitFor();
 const frozen=await page.locator('#depth').textContent();
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(500);await page.keyboard.up('ArrowDown');
 assert.equal(await page.locator('#depth').textContent(),frozen,'Pause must freeze physics');
 await shot('06-pause');await page.locator('#pause-options').click();
 assert.equal(await page.locator('#music-volume').inputValue(),volume);
 await page.locator('#options-close').click();await page.locator('#resume').click();
 await page.locator('#pause-button').click();await page.locator('#restart').click();
 await page.waitForFunction(depth=>Number(document.querySelector('#depth').textContent)===depth,initialDepth);
 mark('Keyboard movement, real music, pause, resume and restart verified');
 await page.locator('#pause-button').click();await page.locator('#quit').click();
 await page.reload({waitUntil:'load'});await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 await page.locator('#options').click();
 assert.equal(await page.locator('#music-volume').inputValue(),volume);
 assert(await page.locator('#reduced').isChecked());
 await page.locator('#test-mode').check();await page.locator('#options-close').click();
 const records=JSON.stringify((await save()).records);
 await page.locator('#sectors').click();
 assert.equal(await page.locator('[data-sector]').count(),5);
 assert.equal(await page.locator('[data-sector]:not([disabled])').count(),5);
 await shot('07-test-sector-selection');
 await page.locator('[data-sector="4"]').click();
 assert.match(await page.locator('#screen').textContent(),/MODE TEST/);
 await page.locator('#launch').click();await page.locator('#test-badge').waitFor({state:'visible'});
 assert.match(await page.locator('#sector-label').textContent(),/cœur de Nacre/);
 await page.keyboard.press('KeyL');
 await page.waitForFunction(()=>document.querySelector('#light-state').textContent==='ÉTEINT');
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>document.querySelector('#sonar-state').textContent!=='PRÊT');
 const finalDepth=Number(await page.locator('#depth').textContent());
 await pressUntilDepth('ArrowDown',finalDepth+12);
 await page.keyboard.press('KeyL');
 await page.waitForFunction(src=>window.__qaMedia.some(a=>a.loop&&!a.paused&&a.currentTime>.1&&(a.currentSrc||a.src).endsWith(src)),audioManifest.music.deep);
 await shot('08-final-sector-sonar');
 audioReport=await page.evaluate(()=>window.__qaMedia.map(a=>({src:a.currentSrc||a.src,loop:a.loop,paused:a.paused,currentTime:a.currentTime,duration:Number.isFinite(a.duration)?a.duration:null,readyState:a.readyState,error:a.error?.message||null})));
 assert(audioReport.some(a=>a.loop&&!a.paused&&a.currentTime>0&&a.src.endsWith(audioManifest.music.deep)),'Recorded deep-sector music actually plays');
 assert(audioReport.every(a=>!a.error),'No media decoding errors');
 await page.locator('#pause-button').click();
 assert.equal(JSON.stringify((await save()).records),records,'Test dive must leave records unchanged');
 mark('Persistent settings, all five test sectors, final-sector movement, light and sonar verified');
 assert.equal(issues.length,0,issues.join('\n'));
 mark('No JavaScript errors, HTTP failures or broken asset requests');
}
try{await Promise.race([smoke(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('QA timeout after 240 seconds')),240000);})]);}
catch(e){failure=e;console.error(e.stack||e);process.exitCode=1;if(page&&!page.isClosed())await shot('failure').catch(()=>{});}
finally{
 clearTimeout(deadline);
 console.log('QA_RESULT '+JSON.stringify({browser:name,passed:!failure,checkpoints,webgl,issues,warnings,failure:failure?.message||null}));
 if(context)await context.tracing.stop({path:path.join(output,'trace.zip')}).catch(()=>{});
 if(browser)await browser.close().catch(()=>{});if(server)server.kill('SIGTERM');
 await fs.mkdir(output,{recursive:true});
 await fs.writeFile(path.join(output,'server.log'),serverLog);
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({browser:name,passed:!failure,elapsedSeconds:(Date.now()-started)/1000,checkpoints,webgl,audioReport,issues,warnings,failure:failure?.stack||null},null,2));
}
