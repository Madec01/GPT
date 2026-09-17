import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../js/abysse/simulation.js';

const level = (patch={}) => ({bounds:{width:180,height:80},spawn:{x:15,y:20},dock:{x:15,y:20,r:7},objects:[{id:'cargo',x:60,y:20}],objectives:{cargo:1},...patch});
const run = (sim,seconds,input={}) => {for(let t=0;t<seconds;t+=1/60)sim.update(1/60,input);};

test('inertia accelerates smoothly, diagonal movement normalized, releasing brakes',()=>{
  const a=new Simulation(level()),b=new Simulation(level());
  a.update(1/60,{x:1});assert.ok(a.player.vx>0&&a.player.vx<1);
  run(a,1,{x:1});run(b,1,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(b.player.vx,b.player.vy)-a.player.vx)<.2);
  const old=a.player.vx;run(a,1);assert.ok(a.player.vx<old*.1);
});
test('sonar has rising-edge action, energy cost and reveals objects',()=>{
  const s=new Simulation(level());s.update(1/60,{sonar:true});
  assert.equal(s.stats.sonar,1);assert.equal(s.entities[0].revealed,true);assert.ok(s.player.energy<83);
  run(s,5,{sonar:true});assert.equal(s.stats.sonar,1);
  s.update(1/60,{});s.update(1/60,{sonar:true});assert.equal(s.stats.sonar,2);
});
test('cut unlocks cargo and consumes energy before tethering',()=>{
  const s=new Simulation(level({objects:[{id:'cargo',x:19,y:20,locked:true,cutTime:2}]}));
  s.update(1/60,{interact:true});assert.equal(s.player.tether,null);
  run(s,2.1,{cut:true});assert.equal(s.entities[0].locked,false);
  s.update(1/60,{interact:true});assert.ok(s.drainEvents().some(e=>e.type==='attached'));
});
test('cargo is physically pulled home and mission wins only after delivery',()=>{
  const s=new Simulation(level({spawn:{x:57,y:20}}));
  s.update(1/60,{interact:true});assert.equal(s.player.tether,'cargo');
  run(s,5,{x:-1});assert.equal(s.status,'won');assert.equal(s.delivered,1);assert.deepEqual(s.player.cargo,['cargo']);
});
test('blocked cargo breaks tether without teleporting through a wall',()=>{
  const s=new Simulation(level({spawn:{x:57,y:20},obstacles:[{x:45,y:15,w:2,h:10}]}));
  s.update(1/60,{interact:true});s.player.x=30;
  s.update(1/60,{});assert.equal(s.player.tether,null);assert.equal(s.entities[0].x,60);
  assert.equal(s.stats.brokenTethers,1);
});
test('beacon prerequisites enforce sequence and sonar activates nearby relay',()=>{
  const s=new Simulation(level({objects:[{id:'a',type:'beacon',x:17,y:20},{id:'b',type:'beacon',x:20,y:20,requires:['a']}],objectives:{beacons:['a','b']}}));
  s.activate(s.entities[1]);assert.equal(s.entities[1].active,false);
  s.update(1/60,{sonar:true});assert.equal(s.status,'won');assert.ok(s.entities.every(o=>o.active));
});
test('obstacle collisions separate geometry and damage only significant impacts',()=>{
  const s=new Simulation(level({spawn:{x:40,y:20},obstacles:[{x:50,y:10,w:5,h:30}]}));
  run(s,2,{x:1});assert.ok(s.player.x<=48.3+.001);assert.ok(s.player.hull<100);assert.ok(s.player.hull>80);
});
test('predator telegraphs before a dodgeable fixed-direction charge',()=>{
  const s=new Simulation(level({spawn:{x:70,y:40},creatures:[{x:85,y:40}]}));
  s.update(1/60,{});assert.equal(s.creatures[0].state,'windup');assert.equal(s.player.hull,100);
  run(s,1,{y:-1,boost:true});assert.equal(s.creatures[0].state,'charge');
  run(s,1.2,{y:-1});assert.equal(s.player.hull,100);
});
test('darkness and refuge prevent visual detection, sonar still draws investigation',()=>{
  const s=new Simulation(level({spawn:{x:70,y:40},creatures:[{x:85,y:40}],refuges:[{x:70,y:40,r:8}]}));
  s.update(1/60,{light:false});assert.equal(s.creatures[0].state,'patrol');
  s.update(1/60,{sonar:true,light:false});assert.equal(s.creatures[0].state,'investigate');
});
test('failure, test mode and immutable source level',()=>{
  const original=level();const snapshot=JSON.stringify(original);const s=new Simulation(original);
  s.hurt(100,'test');s.player.x=80;s.update(1/60,{});assert.equal(s.status,'lost');
  assert.equal(JSON.stringify(original),snapshot);
  const t=new Simulation(level(),{testMode:true});t.hurt(100,'test');assert.equal(t.player.hull,100);
});
test('currents change drift and large suspended frames are clamped',()=>{
  const s=new Simulation(level({current:[{x:0,y:0,w:180,h:80,dx:8,dy:0}]}));
  s.update(20,{});assert.equal(s.time,.1);assert.ok(s.player.vx>0);assert.ok(s.player.x<16);
});
test('optional salvage never substitutes for required mission cargo',()=>{
  const s=new Simulation(level({objects:[{id:'secret',x:18,y:20,required:false},{id:'mission',x:80,y:20,required:true}]}));
  s.update(1/60,{interact:true});assert.equal(s.delivered,1);assert.equal(s.requiredDelivered,0);assert.equal(s.status,'playing');
});
test('tools are introduced by level and cannot be used prematurely',()=>{
  const s=new Simulation(level({tools:['tow'],objects:[{id:'locked',x:18,y:20,locked:true}]}));
  run(s,5,{cut:true,sonar:true});assert.equal(s.entities[0].locked,true);assert.equal(s.stats.sonar,0);
});
test('solid rock blocks predator sight even when player light is on',()=>{
  const s=new Simulation(level({spawn:{x:70,y:40},obstacles:[{x:76,y:30,w:3,h:20}],creatures:[{x:85,y:40}]}));
  s.update(1/60,{light:true});assert.equal(s.creatures[0].state,'patrol');
});
