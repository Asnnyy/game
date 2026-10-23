export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.touch = new Set();
    this.canvas = canvas;
    this.blocked = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Spacebar"]);
    window.addEventListener("keydown", (event) => {
      if (this.blocked.has(event.key)) event.preventDefault();
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Spacebar", "a", "A", "d", "D", "w", "W", "Shift", "Escape"].includes(event.key)) {
        this.keys.add(event.key.toLowerCase());
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("blur", () => this.clear());
    document.querySelectorAll("[data-key]").forEach((button) => {
      const key = button.dataset.key;
      const down = (event) => { event.preventDefault(); this.touch.add(key); };
      const up = (event) => { event.preventDefault(); this.touch.delete(key); };
      button.addEventListener("pointerdown", down);
      ["pointerup", "pointercancel", "pointerleave"].forEach(type => button.addEventListener(type, up));
    });
  }
  get left() { return this.keys.has("arrowleft") || this.keys.has("a") || this.touch.has("left"); }
  get right() { return this.keys.has("arrowright") || this.keys.has("d") || this.touch.has("right"); }
  get jump() { return this.keys.has(" ") || this.keys.has("spacebar") || this.keys.has("w") || this.keys.has("arrowup") || this.touch.has("jump"); }
  get fly() { return this.keys.has("shift") || this.touch.has("fly"); }
  get pause() { return this.keys.has("escape"); }
  clear() { this.keys.clear(); this.touch.clear(); }
}
