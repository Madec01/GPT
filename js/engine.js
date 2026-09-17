/** Fixed-step stealth simulation. Level coordinates are cells; runtime coordinates are pixels. */
export const GAMEPLAY = Object.freeze({ decoyRange: 180, visionRange: 170, sneakVisionRange: 125, visionHalfAngle: Math.PI * 65 / 360 });

export class Simulation {
  constructor(level, onEvent = () => {}) {
    this.level = level; this.onEvent = onEvent; this.state = 'ready'; this.time = 0;
    this.decoyRange = GAMEPLAY.decoyRange; this.guardVisionRange = GAMEPLAY.visionRange;
    this.cell = 48; this.tiles = level.tiles; this.height = this.tiles.length; this.width = this.tiles[0].length;
    const world = p => ({ x: p.x * 48 + 24, y: p.y * 48 + 24 });
    this.player = { ...world(level.player), r: 11, speed: 125, angle: 0 };
    this.exit = world(level.exit);
    this.loot = level.loot.map((item, i) => ({ ...item, ...world(item), id: i, collected: false }));
    this.guards = (level.guards || []).map((g, i) => ({ ...g, ...world(g.path[0]), id: i,
      path: g.path.map(world), index: 1 % g.path.length, speed: g.speed || 65, angle: g.angle || 0,
      investigatingUntil: 0, investigation: [], seesPlayer: false }));
    this.lasers = (level.lasers || []).map(l => ({ ...l, a: world(l.a), b: world(l.b), active: false, cooldown: 0 }));
    this.charges = { decoy: 2, emp: 1, ...level.charges };
    this.detection = 0; this.alerts = 0; this.abilities = 0; this.empUntil = 0; this.decoys = [];
    this.targetPath = []; this.reason = ''; this._spotted = false;
  }
  emit(type, details = {}) { this.onEvent({ type, ...details }); }
  start() { if (this.state === 'ready') this.state = 'running'; }
  walkable(x, y) { return y >= 0 && y < this.height && x >= 0 && x < this.width && this.tiles[y][x] !== '#'; }
  free(x, y, radius = 11) {
    for (const dx of [-radius, radius]) for (const dy of [-radius, radius])
      if (!this.walkable(Math.floor((x + dx) / 48), Math.floor((y + dy) / 48))) return false;
    return true;
  }
  /** Cardinal BFS keeps guards and point-and-click movement out of solid walls. */
  pathfind(from, to) {
    const sx = Math.floor(from.x / 48), sy = Math.floor(from.y / 48);
    const tx = Math.floor(to.x / 48), ty = Math.floor(to.y / 48);
    if (!this.walkable(tx, ty)) return [];
    const start = `${sx},${sy}`, end = `${tx},${ty}`, queue = [[sx, sy]], previous = new Map([[start, null]]);
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i], key = `${x},${y}`;
      if (key === end) break;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy, next = `${nx},${ny}`;
        if (this.walkable(nx, ny) && !previous.has(next)) { previous.set(next, key); queue.push([nx, ny]); }
      }
    }
    if (!previous.has(end)) return [];
    const path = []; let key = end;
    while (key !== start) { const [x,y] = key.split(',').map(Number); path.unshift({ x:x*48+24, y:y*48+24 }); key = previous.get(key); }
    // Align to the cell centre before turning, avoiding diagonal clipping around corners.
    if (path.length && Math.hypot(from.x-(sx*48+24),from.y-(sy*48+24)) > 1) path.unshift({x:sx*48+24,y:sy*48+24});
    if (this.free(to.x, to.y)) path.push({x:to.x,y:to.y});
    return path;
  }
  setTarget(x, y) { this.targetPath = this.pathfind(this.player, { x, y }); return this.targetPath.length > 0; }
  lineOfSight(a, b) {
    const length = Math.hypot(b.x-a.x,b.y-a.y), n = Math.ceil(length/6);
    for (let i=1;i<=n;i++) if (!this.walkable(Math.floor((a.x+(b.x-a.x)*i/n)/48),Math.floor((a.y+(b.y-a.y)*i/n)/48))) return false;
    return true;
  }
  decoy(target) {
    if (this.state !== 'running' || this.charges.decoy <= 0) return false;
    let point = target && Number.isFinite(target.x) && Number.isFinite(target.y)
      ? {x:target.x,y:target.y}
      : {x:this.player.x+Math.cos(this.player.angle)*120,y:this.player.y+Math.sin(this.player.angle)*120};
    const throwDistance = Math.hypot(point.x-this.player.x,point.y-this.player.y);
    if (throwDistance > this.decoyRange) {
      point = {x:this.player.x+(point.x-this.player.x)/throwDistance*this.decoyRange,
        y:this.player.y+(point.y-this.player.y)/throwDistance*this.decoyRange};
    }
    if (!this.free(point.x,point.y) || !this.lineOfSight(this.player,point)) {
      point = {x:this.player.x,y:this.player.y};
      for(let distance=12;distance<=120;distance+=12) {
        const test={x:this.player.x+Math.cos(this.player.angle)*distance,y:this.player.y+Math.sin(this.player.angle)*distance};
        if (!this.free(test.x,test.y)) break; point=test;
      }
    }
    this.charges.decoy--; this.abilities++;
    const decoy = {...point,until:this.time+5}; this.decoys.push(decoy);
    for (const guard of this.guards) if (Math.hypot(guard.x-point.x,guard.y-point.y)<=240) {
      guard.investigation=this.pathfind(guard,point); guard.investigatingUntil=this.time+5; guard.returnPath=null;
    }
    this.emit('decoy',{decoy}); return true;
  }
  emp() {
    if (this.state !== 'running' || this.charges.emp<=0) return false;
    this.charges.emp--; this.abilities++; this.empUntil=this.time+6;
    for(const laser of this.lasers) laser.active=false;
    this.emit('emp'); return true;
  }
  update(dt, input = {}) {
    if(this.state!=='running'||!Number.isFinite(dt)||dt<=0) return;
    if(input.decoy) this.decoy(); if(input.emp) this.emp();
    let remaining=dt;
    while(remaining>1e-9&&this.state==='running') {const step=Math.min(remaining,1/60);this.step(step,input);remaining-=step;}
  }
  moveToward(entity, target, speed, dt) {
    const dx=target.x-entity.x,dy=target.y-entity.y,distance=Math.hypot(dx,dy);
    if(distance<1) return true;
    const move=Math.min(distance,speed*dt); entity.angle=Math.atan2(dy,dx);
    entity.x+=dx/distance*move;entity.y+=dy/distance*move; return distance<=move+0.01;
  }
  step(dt,input) {
    this.time+=dt; const p=this.player;
    this.guardVisionRange=input.sneak?GAMEPLAY.sneakVisionRange:GAMEPLAY.visionRange;
    p.sneaking=Boolean(input.sneak);
    let dx=Number(input.x)||0,dy=Number(input.y)||0;
    if(dx||dy) this.targetPath=[];
    else if(this.targetPath.length) {
      const point=this.targetPath[0],distance=Math.hypot(point.x-p.x,point.y-p.y);
      if(distance<2) this.targetPath.shift();
      else {dx=(point.x-p.x)/distance;dy=(point.y-p.y)/distance;}
    }
    const magnitude=Math.hypot(dx,dy),speed=p.speed*(input.sneak?0.48:1);
    if(magnitude>0) {
      dx/=Math.max(1,magnitude);dy/=Math.max(1,magnitude);p.angle=Math.atan2(dy,dx);
      let distance=speed*dt;
      if(this.targetPath.length) distance=Math.min(distance,Math.hypot(this.targetPath[0].x-p.x,this.targetPath[0].y-p.y));
      if(this.free(p.x+dx*distance,p.y)) p.x+=dx*distance;
      if(this.free(p.x,p.y+dy*distance)) p.y+=dy*distance;
    }
    let visible=false,close=false;
    for(const guard of this.guards) {
      if(guard.investigatingUntil>this.time) {
        if(guard.investigation.length&&this.moveToward(guard,guard.investigation[0],guard.speed*1.1,dt)) guard.investigation.shift();
      } else {
        if(!guard.returnPath) guard.returnPath=this.pathfind(guard,guard.path[guard.index]);
        if(guard.returnPath.length) {
          if(this.moveToward(guard,guard.returnPath[0],guard.speed,dt)) guard.returnPath.shift();
        } else {guard.index=(guard.index+1)%guard.path.length;guard.returnPath=null;}
      }
      const distance=Math.hypot(p.x-guard.x,p.y-guard.y);
      const delta=Math.atan2(Math.sin(Math.atan2(p.y-guard.y,p.x-guard.x)-guard.angle),Math.cos(Math.atan2(p.y-guard.y,p.x-guard.x)-guard.angle));
      guard.visionRange=this.guardVisionRange;
      guard.seesPlayer=distance<guard.visionRange&&(Math.abs(delta)<GAMEPLAY.visionHalfAngle||distance<23)&&this.lineOfSight(guard,p);
      if(guard.seesPlayer) {visible=true;if(distance<23) close=true;}
    }
    if(visible&&!this._spotted) {this.alerts++;this.emit('alert',{reason:'guard'});}
    this._spotted=visible;
    if(visible) this.detection=Math.min(1,this.detection+dt*(close?3:1.25));
    let laserContact=false;
    for(const laser of this.lasers) {
      laser.active=this.time>=this.empUntil&&((this.time+(laser.phase||0))%5)<3;
      if(!laser.active) continue;
      const vx=laser.b.x-laser.a.x,vy=laser.b.y-laser.a.y;
      const t=Math.max(0,Math.min(1,((p.x-laser.a.x)*vx+(p.y-laser.a.y)*vy)/(vx*vx+vy*vy||1)));
      if(Math.hypot(p.x-(laser.a.x+vx*t),p.y-(laser.a.y+vy*t))<p.r+3) {
        laserContact=true;
        if(this.time<laser.cooldown) continue;
        laser.cooldown=this.time+1;this.detection=Math.min(1,this.detection+0.6);this.alerts++;this.emit('alert',{reason:'laser',laser});
      }
    }
    if(!visible&&!laserContact) this.detection=Math.max(0,this.detection-dt/1.2);
    this.decoys=this.decoys.filter(decoy=>decoy.until>this.time);
    if(this.detection>=1) {this.state='lost';this.reason='Les gardiens vous ont repéré. Changez de chemin ou utilisez un leurre.';this.emit('lose',{reason:this.reason});return;}
    for(const item of this.loot) if(!item.collected&&Math.hypot(p.x-item.x,p.y-item.y)<22) {item.collected=true;this.emit('pickup',{item,loot:item});}
    if(this.loot.every(item=>item.collected)&&Math.hypot(p.x-this.exit.x,p.y-this.exit.y)<26) {this.state='won';this.emit('win');}
  }
  stats() {
    const par=typeof this.level.par==='number'?this.level.par:120;
    return {elapsed:this.time,loot:this.loot.filter(item=>item.collected).length,total:this.loot.length,
      stars:this.state==='won'?1+(this.time<=par?1:0)+(this.alerts===0?1:0):0,alerts:this.alerts,abilities:this.abilities};
  }
}
