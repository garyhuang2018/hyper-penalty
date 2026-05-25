// 球实体
import { GAME_CONFIG } from '../config/game.config.js';

export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = GAME_CONFIG.BALL.RADIUS;
    this.friction = GAME_CONFIG.BALL.FRICTION;
    this.isHeld = false;      // 是否被球员持有
    this.isFlame = false;     // 是否是火焰球
    this.holder = null;       // 持有者的引用
  }

  // 更新球的位置
  update() {
    if (this.isHeld && this.holder) {
      // 跟随持有者
      const offsetX = Math.cos(this.holder.direction) * (this.holder.radius + this.radius + 2);
      const offsetY = Math.sin(this.holder.direction) * (this.holder.radius + this.radius + 2);
      this.x = this.holder.x + offsetX;
      this.y = this.holder.y + offsetY;
      this.vx = 0;
      this.vy = 0;
    } else {
      // 应用摩擦力
      this.vx *= this.friction;
      this.vy *= this.friction;

      // 速度过小时停止
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      if (Math.abs(this.vy) < 0.1) this.vy = 0;

      // 更新位置
      this.x += this.vx;
      this.y += this.vy;

      // 场地边界碰撞
      this._constrainToField();
    }
  }

  // 射门
  shoot(power, direction, isFlame = false) {
    this.isHeld = false;
    this.holder = null;
    this.vx = Math.cos(direction) * power;
    this.vy = Math.sin(direction) * power;
    this.isFlame = isFlame;
  }

  // 被持有
  hold(player) {
    this.isHeld = true;
    this.holder = player;
    this.isFlame = false;
  }

  // 释放
  release() {
    this.isHeld = false;
    this.holder = null;
  }

  // 场地边界约束
  _constrainToField() {
    const field = GAME_CONFIG.FIELD;
    const minX = field.OFFSET_X + this.radius;
    const maxX = field.OFFSET_X + field.WIDTH - this.radius;
    const minY = field.OFFSET_Y + this.radius;
    const maxY = field.OFFSET_Y + field.HEIGHT - this.radius;

    if (this.x < minX) {
      this.x = minX;
      this.vx *= -0.7;
    }
    if (this.x > maxX) {
      this.x = maxX;
      this.vx *= -0.7;
    }
    if (this.y < minY) {
      this.y = minY;
      this.vy *= -0.7;
    }
    if (this.y > maxY) {
      this.y = maxY;
      this.vy *= -0.7;
    }
  }

  // 检测与球员的距离
  distanceTo(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 是否静止
  isMoving() {
    return Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5;
  }
}
