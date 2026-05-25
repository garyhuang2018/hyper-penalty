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
    this.isLofted = false;    // 是否在空中（挑球过顶）
    this.loftHeight = 0;      // 空中高度
    this.holder = null;       // 持有者的引用
    this.animFrame = 0;       // 动画帧
    this.animTimer = 0;        // 动画计时器
  }

  // 更新球的位置
  update() {
    if (this.isHeld && this.holder) {
      // 跟随持有者
      const baseOffsetX = Math.cos(this.holder.direction) * (this.holder.radius + this.radius + 2);
      const baseOffsetY = Math.sin(this.holder.direction) * (this.holder.radius + this.radius + 2);

      // 应用带球弧线偏移（垂直于移动方向）
      const perpX = -Math.sin(this.holder.direction);
      const perpY = Math.cos(this.holder.direction);
      const dribbleOffset = this.holder.dribbleOffset || 0;

      this.x = this.holder.x + baseOffsetX + perpX * dribbleOffset;
      this.y = this.holder.y + baseOffsetY + perpY * dribbleOffset;
      this.vx = 0;
      this.vy = 0;
      this.loftHeight = this.holder.isJumping ? this.holder.jumpHeight : 0;
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

      // 更新挑球高度（抛物线下降）
      if (this.isLofted && this.loftHeight > 0) {
        this.loftHeight -= 1.5;
        if (this.loftHeight < 0) this.loftHeight = 0;
      }

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
    this.isLofted = false;
  }

  // 挑球过顶（传球的一种特殊形式）
  loft(power, direction) {
    this.isHeld = false;
    this.holder = null;
    this.vx = Math.cos(direction) * power * 0.8;
    this.vy = Math.sin(direction) * power * 0.8;
    this.isLofted = true;
    this.loftHeight = 40; // 挑球最高高度
  }

  // 吊射（高弧线慢速）
  lobShot(power, direction) {
    this.isHeld = false;
    this.holder = null;
    this.vx = Math.cos(direction) * power * 0.5; // 慢速
    this.vy = Math.sin(direction) * power * 0.5;
    this.isLofted = true;
    this.loftHeight = 60; // 高弧线
  }

  // 倒钩射门（向后上方踢）
  bicycleKick(power, direction) {
    this.isHeld = false;
    this.holder = null;
    // 倒钩方向偏后上方
    const kickAngle = direction - Math.PI * 0.7; // 向后上方偏移
    this.vx = Math.cos(kickAngle) * power * 1.2;
    this.vy = Math.sin(kickAngle) * power * 1.2;
    this.isLofted = true;
    this.loftHeight = 50;
    this.isFlame = true; // 倒钩必定是火焰球
  }

  // 鱼跃头球（水平飞行）
  divingHeader(power, direction) {
    this.isHeld = false;
    this.holder = null;
    this.vx = Math.cos(direction) * power * 1.1;
    this.vy = Math.sin(direction) * power * 0.3; // 水平方向为主
    this.isLofted = true;
    this.loftHeight = 15; // 低弧线
  }

  // 传球飞行
  pass(power, direction) {
    this.isHeld = false;
    this.holder = null;
    this.vx = Math.cos(direction) * power;
    this.vy = Math.sin(direction) * power;
    this.isLofted = false;
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

  // 更新动画帧
  updateAnimation() {
    this.animTimer++;
    if (this.animTimer > 6) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 8;
    }
  }
}
