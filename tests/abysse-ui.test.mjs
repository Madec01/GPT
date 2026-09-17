import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {loadSave, writeSave, recordDive} from '../js/abysse/storage.js';
import {Soundscape} from '../js/abysse/audio.js';
import {Simulation} from '../js/abysse/simulation.js';
import {LEVELS, ENDINGS} from '../js/abysse/levels.js';

function harness() {
  const nodes=new Map();
  class Element {
    constructor(id){this.id=id;this.hidden=false;this.style={};this.dataset={};this.handlers={};this.owned=[];this.classList={add(){},remove(){},toggle(){}};}
    set innerHTML(html){for(const id of this.owned)nodes.delete(id);this.owned=[];this.html=html;for(const m of html.matchAll(/id="([^"]+)"([^>]*)/g)){const e=new Element(m[1]);e.checked=/\bchecked\b/.test(m[2]);e.value=m[2].match(/value="([^"]+)"/)?.[1]||'';nodes.set(e.id,e);this.owned.push(e.id);}}
    get innerHTML(){return this.html;}
    addEventListener(type,fn){this.handlers[type]=fn;}
    click(){return this.handlers.click?.()??this.onclick?.();}
    querySelector(){return null;}
    querySelectorAll(){return [];}
    setAttribute(){} focus(){} append(){}
    getContext(){return new Proxy({},{get:()=>()=>{}});}
  }
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const m of index.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Element(m[1]));
  const initial={unlocked:0,records:{},ending:null,options:{music:.6,effects:.75,quality:'high',reducedMotion:false,testMode:false}};
  const context={document:{getElementById:id=>nodes.get(id)||null,body:new Element('body'),createElement:()=>new Element('created'),querySelectorAll:()=>[],addEventListener(){},activeElement:null},window:{addEventListener(){}},requestAnimationFrame(){},performance:{now:()=>0},fetch:async()=>({ok:true,json:async()=>[]}),console,
    LEVELS,ENDINGS,Simulation,loadSave:()=>initial,writeSave:()=>true,recordDive,
    AbyssRenderer:class{setLevel(){}resize(){}render(){}setOptions(){}},
    Soundscape:class{unlock(){}effect(){}play(){}motion(){}update(){}suspend(flag){this.suspended=flag;}}};
  vm.createContext(context);
  let source=readFileSync(new URL('../js/abysse/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/boot\(\);\s*$/,'');
  source+='\nrenderer=new AbyssRenderer();globalThis.api={handleKey,tick,launch,pause,options,result,finalChoice,ending,credits,save,sound,getState:()=>({simulation,mode,paused}),setSector:(s)=>sector=s};';
  vm.runInContext(source,context);
  return {api:context.api,get:id=>nodes.get(id)};
}

test('pause options preserves dive identity and returns to a resumable pause',()=>{
  const {api,get}=harness();api.launch();const sim=api.getState().simulation;
  api.pause();get('pause-options').click();get('quality').value='eco';get('test-mode').checked=true;get('options-close').click();
  assert.equal(api.getState().simulation,sim);assert.equal(api.getState().paused,true);assert.ok(get('resume'));
  assert.equal(sim.testMode,false);assert.equal(api.save.options.testMode,true);
  get('resume').click();assert.equal(api.getState().paused,false);assert.equal(api.sound.suspended,false);
});

test('test dive cannot save records after switching test option off mid-dive',()=>{
  const {api}=harness();api.save.options.testMode=true;api.launch();api.save.options.testMode=false;
  api.getState().simulation.status='won';api.result();assert.deepEqual(api.save.records,{});assert.equal(api.save.unlocked,0);
});

test('normal dive still records when test option is enabled for next dive',()=>{
  const {api}=harness();api.launch();api.save.options.testMode=true;api.getState().simulation.status='won';api.result();
  assert.equal(api.save.unlocked,1);assert.ok(api.save.records[0]);assert.equal(api.save.options.testMode,true);
});

test('retry discards terminal state and closes result modal',()=>{
  const {api,get}=harness();api.launch();const previous=api.getState().simulation;previous.status='lost';api.result();get('retry').click();
  assert.notEqual(api.getState().simulation,previous);assert.equal(api.getState().simulation.status,'playing');assert.equal(api.getState().paused,false);assert.equal(get('modal').hidden,true);
});

test('credits reached from epilogue return to epilogue, not a frozen completed dive',async()=>{
  const {api,get}=harness();api.setSector(4);api.launch();api.getState().simulation.status='won';api.result();api.ending('shelter',true);
  get('ending-credits').click();await new Promise(resolve=>setImmediate(resolve));get('credits-close').click();
  assert.equal(get('modal').hidden,false);assert.ok(get('ending-home'));assert.match(get('modal').innerHTML,/Le jardin secret/);assert.equal(api.save.ending,'shelter');
});

test('test mode final choice cannot overwrite saved ending',()=>{
  const {api}=harness();api.save.ending='open';api.save.options.testMode=true;api.setSector(4);api.launch();api.save.options.testMode=false;api.ending('shelter',true);assert.equal(api.save.ending,'open');
});

test('damaged records, options and ending are sanitized on loading',()=>{
  globalThis.localStorage={getItem:()=>JSON.stringify({unlocked:99,ending:'invalid',records:{0:{score:'bad',time:3,cargo:1},1:{score:850,time:75,cargo:1}},options:{music:4,effects:-1,testMode:'false'}})};
  const save=loadSave();assert.equal(save.unlocked,4);assert.equal(save.ending,null);assert.equal(save.options.music,1);assert.equal(save.options.effects,0);assert.equal(save.options.testMode,false);assert.deepEqual(Object.keys(save.records),['1']);
});

test('blocked storage retains progress for the session and reports failure',()=>{
  globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  const save=loadSave();assert.equal(recordDive(save,0,{score:500,time:60,cargo:1}),false);assert.equal(save.unlocked,1);assert.equal(writeSave(save),false);
  save.options.testMode=true;assert.equal(recordDive(save,1,{score:1000,time:1,cargo:1}),false);assert.equal(save.unlocked,1);
});

test('audio switches tracks, suspends engine and samples, and mutes existing voices',async()=>{
  class AudioMock{constructor(src){this.src=src;this.paused=true;this.volume=1;this.plays=0;}play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}}
  globalThis.Audio=AudioMock;
  const s=new Soundscape({music:.6,effects:.75});s.configure({music:{menu:'menu.ogg',dive:'dive.ogg'},effects:{cut:'cut.ogg'},loops:{engine:'engine.ogg'}});
  s.play('menu');s.unlock();assert.equal(s.tracks.get('menu').paused,false);s.play('dive');assert.equal(s.tracks.get('menu').paused,true);
  s.motion(10,true,.1);assert.equal(s.engine.paused,false);assert.equal(s.effects.get('cut').length,1);
  s.motion(10,true,.1);assert.equal(s.effects.get('cut').length,1);
  s.motion(10,true,.5);assert.equal(s.effects.get('cut').length,2);
  s.update({music:0,effects:0});assert.equal(s.engine.volume,0);assert.ok(s.effects.get('cut').every(a=>a.volume===0));
  s.suspend(true);assert.equal(s.engine.paused,true);assert.ok(s.effects.get('cut').every(a=>a.paused));
  s.suspend(false);assert.equal(s.tracks.get('dive').paused,false);s.motion(0);assert.equal(s.engine.paused,true);
  s.tracks.get('dive').pause();s.tracks.get('dive').play=()=>Promise.reject(Error('autoplay blocked'));assert.doesNotThrow(()=>s.play('dive'));await Promise.resolve();
});


test('short sonar and winch taps survive keyup before the next frame',()=>{
  const {api}=harness();api.setSector(4);api.launch();
  const event=code=>({code,repeat:false,preventDefault(){}});
  api.handleKey(event('Space'),true);api.handleKey(event('Space'),false);
  api.tick(16);assert.equal(api.getState().simulation.stats.sonar,1);
  api.tick(32);assert.equal(api.getState().simulation.stats.sonar,1);
  api.setSector(0);api.launch();const sim=api.getState().simulation;
  const cargo=sim.entities.find(e=>e.type==='cargo'&&!e.locked);
  sim.player.x=cargo.x;sim.player.y=cargo.y;
  api.handleKey(event('KeyE'),true);api.handleKey(event('KeyE'),false);
  api.tick(16);assert.equal(sim.tether?.id,cargo.id);
});

test('pause discards a queued sonar press before simulation resumes',()=>{
  const {api,get}=harness();api.setSector(4);api.launch();
  api.handleKey({code:'Space',repeat:false,preventDefault(){}},true);
  api.pause();get('resume').click();api.tick(16);
  assert.equal(api.getState().simulation.stats.sonar,0);
});
