export class Player {
  constructor(x, y) {
    this.startX = x; this.startY = y;
    this.w = 42; this.h = 34;
    this.reset();
  }
  reset() {
    this.x = this.startX; this.y = this.startY;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.jumpWasDown = false;
    this.invulnerable = 0;
    this.facing = 1;
  }
  update(dt, input, platforms) {
    const acceleration = 1500;
    const maxSpeed = 265;
    if (input.left) { this.vx -= acceleration * dt; this.facing = -1; }
    if (input.right) { this.vx += acceleration * dt; this.facing = 1; }
    if (!input.left && !input.right) this.vx *= Math.pow(0.0008, dt);
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    const jumpDown = input.jump;
    if (jumpDown && !this.jumpWasDown && this.onGround) {
      this.vy = -490;
      this.onGround = false;
    }
    this.jumpWasDown = jumpDown;

    // Удержание Shift даёт ведьме короткий управляемый полёт на метле.
    if (input.fly) {
      this.vy -= 1250 * dt;
      this.vy = Math.max(this.vy, -310);
    } else {
      this.vy += 1250 * dt;
    }
    this.vy = Math.min(this.vy, 680);

    const oldX = this.x, oldY = this.y;
    this.x += this.vx * dt;
    this.resolveHorizontal(platforms, oldX);
    this.y += this.vy * dt;
    this.onGround = false;
    this.resolveVertical(platforms, oldY);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.x = Math.max(0, Math.min(960 - this.w, this.x));
  }
  resolveHorizontal(platforms, oldX) {
    for (const p of platforms) {
      if (this.x < p.x + p.w && this.x + this.w > p.x && this.y < p.y + p.h && this.y + this.h > p.y) {
        if (this.vx > 0) this.x = p.x - this.w;
        else if (this.vx < 0) this.x = p.x + p.w;
        this.vx = 0;
      }
    }
  }
  resolveVertical(platforms, oldY) {
    for (const p of platforms) {
      if (this.x < p.x + p.w && this.x + this.w > p.x && this.y < p.y + p.h && this.y + this.h > p.y) {
        if (this.vy > 0 && oldY + this.h <= p.y + 5) {
          this.y = p.y - this.h; this.vy = 0; this.onGround = true;
        } else if (this.vy < 0 && oldY >= p.y + p.h - 4) {
          this.y = p.y + p.h; this.vy = 0;
        }
      }
    }
  }
  get bounds() { return { x: this.x + 6, y: this.y + 4, w: this.w - 12, h: this.h - 7 }; }
}
