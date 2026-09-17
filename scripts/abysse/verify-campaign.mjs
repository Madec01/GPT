import assert from 'node:assert/strict';
import { LEVELS } from '../../js/abysse/levels.js';
import { Simulation } from '../../js/abysse/simulation.js';

// A conservative navigator tests physical routes and objectives, not player skill.
// Coordinates are never teleported, health is never restored by the test.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function pilot(sim,dest,cut=false){
  const p=sim.player;
  const threat=sim.creatures.find(c=>['windup','charge'].includes(c.state)&&Math.hypot(c.x-p.x,c.y-p.y)<31);
  if(threat){
    if(sim.avoidId!==threat.id){
      const target=threat.target||p,dx=target.x-threat.x,dy=target.y-threat.y,len=Math.hypot(dx,dy)||1;
      const options=[{x:-dy/len,y:dx/len},{x:dy/len,y:-dx/len}];
      const score=v=>{
        const x=p.x+v.x*10,y=p.y+v.y*10;
        const blocked=x<3||y<3||x>sim.level.bounds.width-3||y>sim.level.bounds.height-3||sim.level.obstacles.some(o=>x>o.x-3&&x<o.x+o.w+3&&y>o.y-3&&y<o.y+o.h+3);
        return (blocked?1000:0)+Math.hypot(x-dest.x,y-dest.y);
      };
      sim.avoidDirection=options.sort((a,b)=>score(a)-score(b))[0];sim.avoidId=threat.id;
    }
    return {...sim.avoidDirection,boost:!sim.player.tether,light:false};
  }
  sim.avoidId=null;
  return {x:clamp((dest.x-p.x)*.45-p.vx*.10,-.55,.55),y:clamp((dest.y-p.y)*.45-p.vy*.10,-.55,.55),light:false,cut};
}
function path(level,start,end) {
  const size=3, margin=6, w=Math.ceil(level.bounds.width/size), h=Math.ceil(level.bounds.height/size);
  const key=(x,y)=>y*w+x, point=k=>({x:(k%w)*size,y:Math.floor(k/w)*size});
  const valid=(x,y)=>x>margin&&y>margin&&x<level.bounds.width-margin&&y<level.bounds.height-margin&&!level.obstacles.some(o=>o.r?Math.hypot(x-o.x,y-o.y)<o.r+margin:x>o.x-margin&&x<o.x+o.w+margin&&y>o.y-margin&&y<o.y+o.h+margin);
  const src=key(Math.round(start.x/size),Math.round(start.y/size));
  const target=key(Math.round(end.x/size),Math.round(end.y/size));
  const queue=[src], previous=new Map([[src,null]]);
  for(let i=0;i<queue.length;i++){
    const current=queue[i]; if(current===target)break;
    const p=point(current);
    for(const [dx,dy]of [[size,0],[-size,0],[0,size],[0,-size]]){
      const x=p.x+dx,y=p.y+dy,k=key(Math.round(x/size),Math.round(y/size));
      if(valid(x,y)&&!previous.has(k)){previous.set(k,current);queue.push(k);}
    }
  }
  assert(previous.has(target),`No safe route to ${JSON.stringify(end)} in ${level.id}`);
  const result=[];for(let k=target;k!==null;k=previous.get(k))result.push(point(k));
  result.reverse();
  const turns=result.filter((p,i)=>i===0||i===result.length-1||
    (p.x-result[i-1].x)!==(result[i+1].x-p.x)||(p.y-result[i-1].y)!==(result[i+1].y-p.y));
  turns.push(end);return turns;
}
function travel(sim,target){
  const route=path(sim.level,sim.player,target);
  for(const dest of route){
    let frames=0;
    while(Math.hypot(sim.player.x-dest.x,sim.player.y-dest.y)>1.2&&sim.status==='playing'){
      const p=sim.player;
      sim.update(1/60,pilot(sim,dest));
      if(++frames>1800)throw new Error(`${sim.level.id}: route stuck ${JSON.stringify(dest)} at ${p.x},${p.y}`);
    }
    assert.notEqual(sim.status,'lost',`${sim.level.id}: navigator died`);
  }
}
const results=[];
for(const level of LEVELS){
  const sim=new Simulation(level);
  for(const id of level.objectives.beacons){
    const beacon=sim.entities.find(o=>o.id===id);travel(sim,beacon);
    sim.update(1/60,{interact:true,light:false});sim.update(1/60,{light:false});
    assert(beacon.active,`${level.id}: beacon ${id} inactive`);
  }
  for(const cargo of sim.entities.filter(o=>o.type==='cargo'&&o.required)){
    travel(sim,cargo);
    if(cargo.locked){for(let f=0;f<60*90&&cargo.locked&&sim.status==='playing';f++)sim.update(1/60,pilot(sim,cargo,true));assert(!cargo.locked,`${level.id}: cutting failed`);}
    travel(sim,cargo);
    sim.update(1/60,{interact:true,light:false});sim.update(1/60,{light:false});
    assert.equal(sim.player.tether,cargo.id, `${level.id} failed attach: status=${sim.status} hull=${sim.player.hull} pos=${sim.player.x},${sim.player.y} cargo=${cargo.x},${cargo.y}`);
    travel(sim,level.dock);
    for(let f=0;f<120&&sim.status==='playing';f++)sim.update(1/60,{light:false});
    assert(cargo.recovered,`${level.id}: cargo not delivered`);
  }
  if(sim.status==='playing')travel(sim,level.dock);
  assert.equal(sim.status,'won',`${level.id} not won`);
  results.push({sector:level.id,seconds:Math.round(sim.time),hull:Math.round(sim.player.hull),damage:sim.stats.damage,brokenTethers:sim.stats.brokenTethers});
}
console.log(JSON.stringify(results,null,2));
