// 球员实体
import { GAME_CONFIG } from '../config/game.config.js';

export class Player {
  constructor(x, y, team, role = 'forward') {
    this.x = x;
    this.y = y;
    this.team = team; // 'A' (红) 或 'B' (蓝)
    this.role = role; // 'goalkeeper', 'defender', 'forward'

    this.radius = GAME_CONFIG.PLAYER.RADIUS;
    this.speed = GAME_CONFIG.PLAYER.SPEED;
    this.direction = team === 'A' ? 0 : Math.PI; // 默认朝向

    // 速度分量
    this.vx = 0;
    this.vy = 0;

    // 状态机
    this.state = 'idle'; // idle, running, tackling, shooting, knocked_down, getting_up

    // 属性
    this.power = 10;      // 射门力量
    this.technique = 5;   // 带球/铲球精度

    // 动画相关
    this.animFrame = 0;
    this.animTimer = 0;

    // 倒地状态
    this.knockedTimer = 0;
    this.getUpTimer = 0;

    // 位置限制（守门员活动范围）
    this._initPositionConstraints();
  }

  _initPositionConstraints() {
    const field = GAME_CONFIG.FIELD;
    if (this.role === 'goalkeeper') {
      if (this.team === 'A') {
        this.minX = field.OFFSET_X;
        this.maxX = field.OFFSET_X + 100;
      } else {
        this.minX = field.OFFSET_X + field.WIDTH - 100;
        this.maxX = field.OFFSET_X + field.WIDTH;
      }
      this.minY = field.OFFSET_Y + field.HEIGHT / 2 - 80;
      this.maxY = field.OFFSET_Y + field.HEIGHT / 2 + 80;
    } else {
      this.minX = field.OFFSET_X + 20;
      this.maxX = field.OFFSET_X + field.WIDTH - 20;
      this.minY = field.OFFSET_Y + 20;
      this.maxY = field.OFFSET_Y + field.HEIGHT - 20;
    }
  }

  // 移动
  move(dx, dy) {
    if (this.state === 'knocked_down' || this.state === 'getting_up') return;

    // 归一化方向
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
      this.direction = Math.atan2(dy, dx);
    }

    // 铲球状态速度 × 1.2
    const speedMultiplier = this.getTackleSpeedMultiplier();
    const currentSpeed = this.speed * speedMultiplier;

    // 计算新位置
    let newX = this.x + dx * currentSpeed;
    let newY = this.y + dy * currentSpeed;

    // 约束到有效区域
    newX = Math.max(this.minX, Math.min(this.maxX, newX));
    newY = Math.max(this.minY, Math.min(this.maxY, newY));

    this.x = newX;
    this.y = newY;

    // 更新状态
    if (length > 0) {
      this.state = 'running';
      this._updateAnimation();
    } else {
      this.state = 'idle';
    }
  }

  // 铲球
  tackle() {
    if (this.state === 'knocked_down' || this.state === 'getting_up') return false;
    this.state = 'tackling';

    // 0.3秒后恢复
    setTimeout(() => {
      if (this.state === 'tackling') {
        this.state = 'idle';
      }
    }, 300);

    return true;
  }

  // 获取铲球时的速度倍率
  getTackleSpeedMultiplier() {
    return this.state === 'tackling' ? 1.2 : 1.0;
  }

  // 射门
  shoot(power, isFlame = false) {
    if (this.state === 'knocked_down' || this.state === 'getting_up') return null;
    this.state = 'shooting';

    // 射门方向朝向对方球门
    // Team A (红) 在左侧，进攻方向是 RIGHT (x=900)
    // Team B (蓝) 在右侧，进攻方向是 LEFT (x=-100)
    const targetX = this.team === 'A'
      ? GAME_CONFIG.FIELD.OFFSET_X + GAME_CONFIG.FIELD.WIDTH + GAME_CONFIG.GOAL.WIDTH  // x=900
      : GAME_CONFIG.FIELD.OFFSET_X - GAME_CONFIG.GOAL.WIDTH;  // x=-100
    const targetY = GAME_CONFIG.FIELD.OFFSET_Y + GAME_CONFIG.FIELD.HEIGHT / 2;

    const angle = Math.atan2(targetY - this.y, targetX - this.x);

    setTimeout(() => {
      if (this.state === 'shooting') {
        this.state = 'idle';
      }
    }, 200);

    return { power, angle, isFlame };
  }

  // 被铲倒
  knockDown() {
    if (this.state === 'knocked_down') return;
    this.state = 'knocked_down';
    this.knockedTimer = 1500; // 1.5秒后起身
  }

  // 更新倒地状态
  update(deltaTime) {
    if (this.state === 'knocked_down') {
      this.knockedTimer -= deltaTime;
      if (this.knockedTimer <= 0) {
        this.state = 'getting_up';
        this.getUpTimer = 500; // 起身动画 0.5秒
      }
    } else if (this.state === 'getting_up') {
      this.getUpTimer -= deltaTime;
      if (this.getUpTimer <= 0) {
        this.state = 'idle';
      }
    }
  }

  // 动画更新
  _updateAnimation() {
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  // 获取颜色
  getColor() {
    return this.team === 'A' ? GAME_CONFIG.PLAYER.COLOR_TEAM_A : GAME_CONFIG.PLAYER.COLOR_TEAM_B;
  }

  // 重置位置
  resetPosition(x, y) {
    this.x = x;
    this.y = y;
    this.state = 'idle';
    this.vx = 0;
    this.vy = 0;
  }

  // 碰撞检测（与其他球员）
  collidesWith(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + other.radius;
  }
}
