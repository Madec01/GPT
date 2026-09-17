import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {load,save,record,unlocked} from '../js/storage.js';
import {Soundtrack} from '../js/audio.js';

function appHarness() {
  const nodes=new Map();
  class Element {
    constructor(id){this.id=id;this.open=false;this.childNodes=[];this.style={};this.classList={add(){},remove(){},toggle(){}};}
    set innerHTML(html){this.html=html;this.childNodes=[{html}];for(const match of html.matchAll(/id="([^"]+)"([^>]*)/g)){const element=new Element(match[1]);element.checked=/\bchecked\b/.test(match[2]);nodes.set(match[1],element);}}
    get innerHTML(){return this.html;}
    replaceChildren(...children){this.childNodes=children;}
    showModal(){this.open=true;} close(){this.open=false;} focus(){} setAttribute(){} addEventListener(){}
    querySelector(){return new Element('child');} querySelectorAll(){return [];}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
  const context={document:{getElementById:get,body:new Element('body'),querySelectorAll:()=>[],querySelector:()=>new Element('query'),addEventListener(){}},window:{addEventListener(){},scrollTo(){}},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},queueMicrotask,
    LEVELS:[],load:()=>({results:{},options:{music:.3,sfx:.6,testMode:false}}),save:()=>true,record(){},unlocked:()=>1,
    Soundtrack:class{apply(){}scene(){}unlock(){}effect(){}suspend(){}},console};
  vm.createContext(context);
  let source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/init\(\);\s*$/,'');
  source+='\nglobalThis.api={options,getState:()=>({modalKind,paused,screen,sim}),prepare:(kind)=>{screen="game";modalKind=kind;paused=kind==="pause";sim={state:kind==="briefing"?"ready":"running"};document.getElementById("modal").open=Boolean(kind);}};';
  vm.runInContext(source,context);
  return {api:context.api,get};
}
for(const kind of ['briefing','pause','result'])test(`Options restores ${kind} without losing its buttons`,()=>{
  const {api,get}=appHarness();api.prepare(kind);const button={onclick:()=>42};get('modal-content').childNodes=[button];api.options();get('options-done').onclick();assert.equal(api.getState().modalKind,kind);assert.equal(get('modal').open,true);assert.equal(get('modal-content').childNodes[0],button);assert.equal(button.onclick(),42);assert.equal(api.getState().paused,kind==='pause');if(kind==='briefing')assert.equal(api.getState().sim.state,'ready');
});
test('Options opened during play returns to unpaused play',()=>{const {api,get}=appHarness();api.prepare('');api.options();get('options-done').onclick();assert.equal(get('modal').open,false);assert.equal(api.getState().paused,false);assert.equal(api.getState().sim.state,'running');});
test('changing test mode abandons the current attempt and returns to selection',()=>{const {api,get}=appHarness();api.prepare('briefing');api.options();get('test-mode').checked=true;get('options-done').onclick();assert.equal(api.getState().sim,null);assert.equal(api.getState().screen,'missions');assert.equal(get('modal').open,false);});
test('damaged saved values cannot produce invalid stars, volume or boolean modes',()=>{
  globalThis.localStorage={getItem:()=>JSON.stringify({version:1,options:{testMode:'false',music:5,sfx:'loud'},results:{'1':{stars:2.7,time:12},'1.5':{stars:3,time:0},'01':{stars:3,time:0}}})};const data=load();assert.equal(data.options.testMode,false);assert.equal(data.options.music,1);assert.equal(data.options.sfx,.65);assert.equal(data.results[1].stars,2);assert.deepEqual(Object.keys(data.results),['1']);
});
test('storage failure preserves session records; test mode cannot update them',()=>{globalThis.localStorage={getItem(){throw Error();},setItem(){throw Error();}};const data=load();assert.equal(record(data,1,{stars:2,elapsed:30}),false);assert.equal(unlocked(data),2);assert.equal(save(data),false);data.options.testMode=true;record(data,2,{stars:3,elapsed:2});assert.equal(data.results[2],undefined);assert.equal(unlocked(data),9);});
test('audio handles playback rejection, switches scenes and suspends effect voices',async()=>{
  class AudioMock {constructor(src){this.src=src;this.volume=1;this.paused=true;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}cloneNode(){return new AudioMock(this.src);}}
  globalThis.Audio=AudioMock;const sound=new Soundtrack({music:.3,sfx:.7,muted:false});sound.unlock();assert.equal(sound.music.menu.paused,false);sound.scene('game');assert.equal(sound.music.menu.paused,true);assert.equal(sound.music.game.paused,false);sound.effect('click');assert.equal(sound.voices.size,1);sound.suspend(true);assert.equal(sound.voices.size,0);sound.effect('click');assert.equal(sound.voices.size,0);sound.suspend(false);sound.music.game.play=()=>Promise.reject(Error('blocked'));sound.playMusic();await Promise.resolve();sound.music.game.play=()=>{throw Error('unavailable');};assert.doesNotThrow(()=>sound.playMusic());
});
