// 游戏循环 - 固定时间步长 60 FPS
export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.FIXED_TIME_STEP = 1000 / 60; // 约 16.67ms
    this.animationFrameId = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  _loop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // 固定时间步更新
    while (this.accumulator >= this.FIXED_TIME_STEP) {
      this.update(this.FIXED_TIME_STEP);
      this.accumulator -= this.FIXED_TIME_STEP;
    }

    // 渲染
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this._loop());
  }

  // 获取当前 FPS（调试用）
  getFPS() {
    return Math.round(1000 / this.FIXED_TIME_STEP);
  }
}
