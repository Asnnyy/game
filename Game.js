import { Player } from "./Player.js";
import { intersects } from "./collision.js";

export class Game {
  constructor(canvas, input, onState) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.input = input; this.onState = onState;
    this.width = 960; this.height = 540;
    this.best = this.readBest();
    this.state = "ready";
    this.lastTime = 0; this.raf = null;
    this.stars = Array.from({length: 75}, (_, i) => ({
      x: (i * 137.7) % 960, y: (i * 71.3) % 370, r: (i % 3) * .45 + .5, phase: i * .8
    }));
    this.resetWorld();
    this.render();
  }
  readBest() { try { return Number(localStorage.getItem("witchPlatformerBest") || 0); } catch { return 0; } }
  saveBest() { try { localStorage.setItem("witchPlatformerBest", String(this.best)); } catch {} }
  resetWorld() {
    this.player = new Player(48, 425);
    this.platforms = [
      {x:0,y:492,w:960,h:48,ground:true},
      {x:130,y:414,w:145,h:18},
      {x:330,y:342,w:140,h:18},
      {x:525,y:275,w:145,h:18},
      {x:715,y:350,w:125,h:18},
      {x:790,y:435,w:105,h:18}
    ];
    this.items = [
      {type:"book", x:190, y:370, w:25, h:29, got:false},
      {type:"cat", x:385, y:296, w:31, h:30, got:false},
      {type:"book", x:585, y:229, w:25, h:29, got:false}
    ];
    this.ghosts = [
      {x:300,y:435,w:34,h:40,baseY:435,phase:0,speed:1.3,range:44},
      {x:625,y:432,w:34,h:40,baseY:432,phase:2,speed:1.7,range:55},
      {x:745,y:295,w:34,h:40,baseY:295,phase:1,speed:1.5,range:36}
    ];
    this.score = 0; this.health = 3; this.elapsed = 0; this.hitCooldown = 0;
    this.portal = {x:885,y:425,w:42,h:67};
    this.finish = false;
  }
  start() {
    if (this.state === "running") return;
    if (this.state === "won" || this.state === "lost") this.resetWorld();
    this.state = "running"; this.lastTime = 0;
    this.onState(this.getStatus());
    if (this.raf === null) this.raf = requestAnimationFrame(t => this.loop(t));
  }
  togglePause() {
    if (this.state === "running") { this.state = "paused"; this.input.clear(); this.onState(this.getStatus()); this.render(); }
    else if (this.state === "paused") this.start();
  }
  restart() {
    this.state = "ready"; this.input.clear(); this.resetWorld();
    this.onState(this.getStatus()); this.render();
  }
  loop(timestamp) {
    this.raf = null;
    if (this.state !== "running") return;
    const dt = this.lastTime ? Math.min((timestamp - this.lastTime) / 1000, 0.033) : 0;
    this.lastTime = timestamp;
    if (this.input.pause) { this.togglePause(); return; }
    this.update(dt); this.render();
    this.onState(this.getStatus());
    if (this.state === "running") this.raf = requestAnimationFrame(t => this.loop(t));
  }
  update(dt) {
    if (!dt) return;
    this.elapsed += dt;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    this.player.update(dt, this.input, this.platforms);
    this.ghosts.forEach(g => {
      g.phase += dt * g.speed;
      g.x += Math.sin(g.phase) * 24 * dt;
      g.y = g.baseY + Math.sin(g.phase * 1.35) * g.range * .18;
    });
    for (const item of this.items) {
      if (!item.got && intersects(this.player.bounds, item)) {
        item.got = true; this.score += 1;
      }
    }
    if (this.hitCooldown <= 0 && this.player.invulnerable <= 0) {
      for (const ghost of this.ghosts) {
        if (intersects(this.player.bounds, ghost)) {
          this.health -= 1; this.hitCooldown = .8; this.player.invulnerable = 1.2;
          this.player.vx = this.player.x < ghost.x ? -270 : 270;
          this.player.vy = -260;
          break;
        }
      }
    }
    // Фиолетовая ядовитая трясина внизу — опасная зона.
    if (this.player.y > 560) this.health = 0;
    if (this.health <= 0) { this.state = "lost"; this.onState(this.getStatus()); return; }
    if (this.score === this.items.length && intersects(this.player.bounds, this.portal)) {
      this.state = "won";
      if (this.score > this.best) { this.best = this.score; this.saveBest(); }
      this.onState(this.getStatus());
    }
  }
  getStatus() {
    return {state:this.state, score:this.score, total:this.items.length, health:this.health, best:this.best};
  }
  render() {
    const c = this.ctx;
    c.clearRect(0,0,this.width,this.height);
    const bg = c.createLinearGradient(0,0,0,540); bg.addColorStop(0,"#17162f"); bg.addColorStop(1,"#302143");
    c.fillStyle = bg; c.fillRect(0,0,960,540);
    // Луна
    c.save(); c.shadowColor="#d7c6ff"; c.shadowBlur=30; c.fillStyle="#e9ddff"; c.beginPath(); c.arc(790,78,37,0,Math.PI*2); c.fill();
    c.globalCompositeOperation="destination-out"; c.beginPath(); c.arc(805,65,34,0,Math.PI*2); c.fill(); c.restore();
    // Звёзды
    this.stars.forEach(s => { c.globalAlpha=.45 + .45*Math.sin(this.elapsed*1.4+s.phase); c.fillStyle="#f6edff"; c.beginPath(); c.arc(s.x,s.y,s.r,0,Math.PI*2); c.fill(); });
    c.globalAlpha=1;
    // Далёкие башни и деревья
    for (let i=0;i<8;i++) {
      const x=i*145-20, h=80+(i*43)%90;
      c.fillStyle="#211e3c"; c.beginPath(); c.moveTo(x,492); c.lineTo(x+28,492-h); c.lineTo(x+59,492); c.fill();
      c.fillStyle="#292344"; c.fillRect(x+16,492-h+25,24,h-25);
      c.fillStyle="#b5a1e9"; c.globalAlpha=.5; c.fillRect(x+24,492-h+45,5,10); c.globalAlpha=1;
    }
    // Опасная трясина
    c.fillStyle="#3d2552"; c.fillRect(0,484,960,10);
    c.strokeStyle="#c35ba7"; c.lineWidth=2;
    for (let x=0;x<960;x+=35) { c.beginPath(); c.moveTo(x,489); c.quadraticCurveTo(x+12,481+Math.sin(this.elapsed*2+x)*3,x+25,489); c.stroke(); }
    // Платформы
    this.platforms.forEach((p,i) => {
      c.fillStyle=p.ground?"#44334f":"#554269"; c.fillRect(p.x,p.y,p.w,p.h);
      c.fillStyle="#9b83b5"; c.fillRect(p.x,p.y,p.w,4);
      c.fillStyle="#342942"; for(let x=p.x+12;x<p.x+p.w-8;x+=28) c.fillRect(x,p.y+8,12,3);
      if (!p.ground) { c.fillStyle="#8c719f"; c.fillRect(p.x+8,p.y-5,16,5); c.fillRect(p.x+p.w-28,p.y-5,16,5); }
    });
    this.drawPortal(c);
    this.items.forEach(item => { if (!item.got) item.type==="book" ? this.drawBook(c,item) : this.drawCat(c,item); });
    this.ghosts.forEach(g => this.drawGhost(c,g));
    this.drawWitch(c,this.player);
    // Игровая подсказка в самом поле
    c.fillStyle="#e8dcff"; c.font="600 12px Manrope, sans-serif"; c.fillText("ЛУННЫЙ ЛЕС",22,28);
    if (this.state==="paused") this.drawStateMessage("ПАУЗА","Нажми «Продолжить», чтобы вернуться");
  }
  drawPortal(c) {
    const p=this.portal;
    c.save(); c.shadowColor="#b99cff"; c.shadowBlur=25;
    c.strokeStyle="#d8c4ff"; c.lineWidth=4; c.beginPath(); c.ellipse(p.x+p.w/2,p.y+p.h/2,p.w/2,p.h/2,0,0,Math.PI*2); c.stroke();
    c.fillStyle="#9f79d9"; c.globalAlpha=.25; c.beginPath(); c.ellipse(p.x+p.w/2,p.y+p.h/2,p.w/2-4,p.h/2-4,0,0,Math.PI*2); c.fill();
    c.restore();
    c.fillStyle="#d9c9ff"; c.font="10px Manrope"; c.fillText("ВЫХОД",p.x-1,p.y-9);
  }
  drawBook(c,b) {
    const bob=Math.sin(this.elapsed*3+b.x)*3;
    c.save(); c.translate(b.x,b.y+bob); c.shadowColor="#f2bc76"; c.shadowBlur=12;
    c.fillStyle="#e3a96c"; c.beginPath(); c.roundRect(1,2,b.w-2,b.h-4,3); c.fill();
    c.fillStyle="#7a426f"; c.fillRect(5,4,3,b.h-8);
    c.strokeStyle="#fff0ca"; c.lineWidth=1; c.strokeRect(7,5,b.w-12,b.h-10);
    c.fillStyle="#fff0ca"; c.beginPath(); c.arc(15,13,2,0,Math.PI*2); c.fill();
    c.restore();
  }
  drawCat(c,cat) {
    const bob=Math.sin(this.elapsed*3+cat.x)*3;
    c.save(); c.translate(cat.x,cat.y+bob); c.shadowColor="#a7f2dc"; c.shadowBlur=12;
    c.fillStyle="#b9d9ce"; c.beginPath(); c.ellipse(15,19,13,10,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.moveTo(3,13); c.lineTo(4,1); c.lineTo(12,8); c.moveTo(19,8); c.lineTo(27,1); c.lineTo(27,14); c.fill();
    c.fillStyle="#29223c"; c.beginPath(); c.arc(10,15,1.5,0,Math.PI*2); c.arc(20,15,1.5,0,Math.PI*2); c.fill();
    c.strokeStyle="#29223c"; c.lineWidth=1; c.beginPath(); c.moveTo(13,20); c.lineTo(16,22); c.lineTo(19,20); c.stroke();
    c.restore();
  }
  drawGhost(c,g) {
    const c2=c; c2.save(); c2.globalAlpha=.92; c2.shadowColor="#f38fc8"; c2.shadowBlur=15; c2.fillStyle="#d8b6e8";
    c2.beginPath(); c2.moveTo(g.x,g.y+g.h); c2.lineTo(g.x,g.y+13); c2.quadraticCurveTo(g.x+2,g.y,g.x+g.w/2,g.y); c2.quadraticCurveTo(g.x+g.w,g.y,g.x+g.w,g.y+13); c2.lineTo(g.x+g.w,g.y+g.h);
    c2.lineTo(g.x+g.w-8,g.y+g.h-7); c2.lineTo(g.x+g.w-17,g.y+g.h); c2.lineTo(g.x+g.w-25,g.y+g.h-7); c2.closePath(); c2.fill();
    c2.shadowBlur=0; c2.fillStyle="#473052"; c2.beginPath(); c2.ellipse(g.x+11,g.y+16,3,5,0,0,Math.PI*2); c2.ellipse(g.x+24,g.y+16,3,5,0,0,Math.PI*2); c2.fill();
    c2.strokeStyle="#473052"; c2.lineWidth=1.5; c2.beginPath(); c2.arc(g.x+17,g.y+25,4,0,Math.PI); c2.stroke(); c2.restore();
  }
  drawWitch(c,p) {
    if (p.invulnerable>0 && Math.floor(this.elapsed*16)%2===0) return;
    c.save(); c.translate(p.x+p.w/2,p.y+p.h/2); c.scale(p.facing,1);
    // Метла
    c.strokeStyle="#b98554"; c.lineWidth=4; c.beginPath(); c.moveTo(-25,12); c.lineTo(25,2); c.stroke();
    c.fillStyle="#d5a56e"; c.beginPath(); c.moveTo(22,1); c.lineTo(35,-4); c.lineTo(31,7); c.lineTo(23,7); c.fill();
    // Плащ
    c.fillStyle="#7560a7"; c.beginPath(); c.moveTo(-8,-2); c.lineTo(8,-2); c.lineTo(16,12); c.lineTo(-13,12); c.closePath(); c.fill();
    // Лицо и волосы
    c.fillStyle="#f2c8b7"; c.beginPath(); c.arc(0,-8,10,0,Math.PI*2); c.fill();
    c.fillStyle="#33213f"; c.beginPath(); c.arc(0,-12,11,Math.PI,Math.PI*2); c.lineTo(10,-4); c.lineTo(5,-7); c.lineTo(-8,-4); c.closePath(); c.fill();
    c.fillStyle="#33213f"; c.beginPath(); c.moveTo(-11,-15); c.lineTo(0,-35); c.lineTo(11,-15); c.closePath(); c.fill();
    c.fillStyle="#a58ae0"; c.beginPath(); c.ellipse(0,-15,11,3,0,0,Math.PI*2); c.fill();
    c.fillStyle="#32213e"; c.beginPath(); c.arc(3,-8,1.3,0,Math.PI*2); c.fill();
    // Маленький плащ развевается
    c.fillStyle="#b8a0f3"; c.globalAlpha=.65; c.beginPath(); c.moveTo(-8,0); c.lineTo(-18,6); c.lineTo(-9,7); c.fill();
    c.restore();
  }
  drawStateMessage(title,subtitle) {
    const c=this.ctx; c.fillStyle="#110f25b8"; c.fillRect(0,0,960,540);
    c.textAlign="center"; c.fillStyle="#f8f1ff"; c.font="700 38px 'Playfair Display', Georgia"; c.fillText(title,480,250);
    c.fillStyle="#cfc4e8"; c.font="14px Manrope"; c.fillText(subtitle,480,282); c.textAlign="left";
  }
}
