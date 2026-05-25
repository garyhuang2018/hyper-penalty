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

    // 加速状态
    this.isAccelerating = false;
    this.accelerateMultiplier = 1.5;

    // 跳起状态
    this.isJumping = false;
    this.jumpHeight = 0;
    this.jumpTimer = 0;

    // 动画相关
    this.animFrame = 0;
    this.animTimer = 0;

    // 倒地状态
    this.knockedTimer = 0;
    this.getUpTimer = 0;

    // 撞人冷却
    this.bumpCooldown = 0;

    // 过人状态（连按变向）
    this._lastDirections = [];
    this._lastDirectionTime = 0;
    this.STEP_OVER_WINDOW = 200; // 200ms 内连按同方向触发过人

    // 带球步数统计（必杀技）
    this.dribbleSteps = 0;
    this.isFlame = false;

    // 自然移动属性
    this.turnSpeed = 0.08;  // 转向速度 (0-1，越大转向越快)
    this.dribblePhase = 0;  // 带球弧线相位
    this.dribbleOffset = 0; // 当前带球偏移量

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

      // 计算目标方向
      const targetDir = Math.atan2(dy, dx);

      // 平滑转向 - 逐步调整方向而非瞬间转向
      let angleDiff = targetDir - this.direction;
      // 归一化角度差到 [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.direction += angleDiff * this.turnSpeed;

      // 带球弧线 - 左右摆动
      if (this._hasBall()) {
        this.dribblePhase += 0.1;
        this.dribbleOffset = Math.sin(this.dribblePhase) * 8;
      } else {
        this.dribbleOffset = 0;
      }
    }

    // 检测过人（连按变向）
    const now = Date.now();
    const dirKey = `${dx},${dy}`;
    if (now - this._lastDirectionTime < this.STEP_OVER_WINDOW) {
      const lastDir = this._lastDirections[this._lastDirections.length - 1];
      if (lastDir === dirKey) {
        this._triggerStepOver(dx, dy);
      }
    }
    this._lastDirections.push(dirKey);
    this._lastDirectionTime = now;
    if (this._lastDirections.length > 2) {
      this._lastDirections.shift();
    }

    // 速度倍率（加速 + 铲球）
    const speedMultiplier = this.getSpeedMultiplier();
    const currentSpeed = this.speed * speedMultiplier;

    // 计算新位置 - 使用当前朝向而非目标方向
    let moveX = Math.cos(this.direction);
    let moveY = Math.sin(this.direction);

    // 应用带球偏移（垂直于移动方向）
    if (this.dribbleOffset !== 0) {
      const perpX = -moveY;
      const perpY = moveX;
      moveX += perpX * this.dribbleOffset * 0.1;
      moveY += perpY * this.dribbleOffset * 0.1;
    }

    let newX = this.x + moveX * currentSpeed;
    let newY = this.y + moveY * currentSpeed;

    // 约束到有效区域
    newX = Math.max(this.minX, Math.min(this.maxX, newX));
    newY = Math.max(this.minY, Math.min(this.maxY, newY));

    this.x = newX;
    this.y = newY;

    // 更新带球步数
    if (this._hasBall()) {
      this.dribbleSteps++;
      if (this.dribbleSteps >= 11) {
        this.isFlame = true;
      }
    }

    // 更新状态
    if (length > 0) {
      this.state = 'running';
      this._updateAnimation();
    } else {
      this.state = 'idle';
    }
  }

  // 触发过人变向
  _triggerStepOver(dx, dy) {
    // 变向：向相反方向移动一小段，然后改变方向
    this.direction = Math.atan2(-dy, -dx);
    // 给予短暂的加速效果作为视觉反馈
    const stepSpeed = this.speed * 2;
    this.x += dx * stepSpeed * 0.5;
    this.y += dy * stepSpeed * 0.5;
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

  // 传球（带球时）
  pass(targetAngle) {
    if (this.state === 'knocked_down' || this.state === 'getting_up') return null;
    if (!this._hasBall()) return null;

    // 传球方向基于面向方向或指定目标方向
    const passAngle = targetAngle !== undefined ? targetAngle : this.direction;
    const passPower = 12; // 传球力度

    this.state = 'running';

    return { power: passPower, angle: passAngle };
  }

  // 撞人（无球时）
  bump() {
    if (this.state === 'knocked_down' || this.state === 'getting_up') return false;
    if (this.bumpCooldown > 0) return false;

    this.state = 'running';
    this.bumpCooldown = 1000; // 1秒冷却

    return true;
  }

  // 跳起/挑球
  jump() {
    if (this.state === 'knocked_down' || this.state === 'getting_up') return false;
    if (this.isJumping) return false;

    this.isJumping = true;
    this.jumpTimer = 500; // 0.5秒跳起时间
    this.state = 'running';

    return true;
  }

  // 是否持有球
  _hasBall() {
    return this.ball && this.ball.holder === this;
  }

  // 设置持有的球引用
  setBall(ball) {
    this.ball = ball;
  }

  // 获取铲球时的速度倍率
  getTackleSpeedMultiplier() {
    return this.state === 'tackling' ? 1.2 : 1.0;
  }

  // 获取加速时的速度倍率
  getSpeedMultiplier() {
    if (this.isAccelerating) {
      return this.accelerateMultiplier;
    }
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

    // 更新跳起状态
    if (this.isJumping) {
      this.jumpTimer -= deltaTime;
      if (this.jumpTimer <= 0) {
        this.isJumping = false;
        this.jumpHeight = 0;
      } else {
        // 计算跳起高度（抛物线）
        const progress = 1 - (this.jumpTimer / 500);
        this.jumpHeight = Math.sin(progress * Math.PI) * 30; // 最高30px
      }
    }

    // 更新撞人冷却
    if (this.bumpCooldown > 0) {
      this.bumpCooldown -= deltaTime;
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
    this.dribblePhase = 0;
    this.dribbleOffset = 0;
    this.direction = this.team === 'A' ? 0 : Math.PI;
  }

  // 碰撞检测（与其他球员）
  collidesWith(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + other.radius;
  }
}
