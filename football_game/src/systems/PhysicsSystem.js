// 物理系统 - 碰撞检测
import { GAME_CONFIG } from '../config/game.config.js';

export class PhysicsSystem {
  constructor(scene) {
    this.scene = scene;
    this.players = scene.players;
    this.ball = scene.ball;
  }

  update() {
    // 球员与球碰撞
    this._checkBallPickup();

    // 球员间碰撞
    this._checkPlayerCollisions();

    // 铲球检测
    this._checkTackle();
  }

  // 球员捡球（自动控球）
  _checkBallPickup() {
    const ball = this.ball;

    // 球已经在某球员控制下，跳过
    if (ball.isHeld) return;

    // 接触即持有（移动中的球也可以被捡起）
    for (const player of this.players) {
      if (player.state === 'knocked_down' || player.state === 'getting_up') continue;

      const dist = ball.distanceTo(player);
      if (dist < player.radius + ball.radius + 5) {
        ball.hold(player);
        return;
      }
    }
  }

  // 球员间碰撞
  _checkPlayerCollisions() {
    const players = this.players;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        if (p1.state === 'knocked_down' || p1.state === 'getting_up') continue;
        if (p2.state === 'knocked_down' || p2.state === 'getting_up') continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0) {
          // 碰撞分离
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          p1.x -= nx * overlap / 2;
          p1.y -= ny * overlap / 2;
          p2.x += nx * overlap / 2;
          p2.y += ny * overlap / 2;

          // 不同队球员碰撞可能抢球
          if (p1.team !== p2.team && this.ball.holder) {
            const holder = this.ball.holder;
            if (holder === p1 || holder === p2) {
              // 带球球员被撞，可能丢失球
              const impactForce = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy) +
                                  Math.sqrt(p2.vx * p2.vx + p2.vy * p2.vy);
              if (impactForce > 5) {
                this.ball.release();
              }
            }
          }
        }
      }
    }
  }

  // 铲球检测
  _checkTackle() {
    const ball = this.ball;
    if (ball.isHeld) {
      const holder = ball.holder;

      for (const player of this.players) {
        // 只检查对方球员
        if (player.team === holder.team) continue;
        if (player.state === 'knocked_down' || player.state === 'getting_up') continue;

        // 铲球条件：tackling 状态 + 距离 < 30px + 速度 > 3
        const dist = ball.distanceTo(player);
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);

        if (player.state === 'tackling' && dist < 30 && speed > 3) {
          // 70% 成功率
          const successRate = 0.7;
          if (Math.random() < successRate) {
            // 抢断成功
            ball.release();
            holder.knockDown();
          } else {
            // 抢断失败，防守者可能倒地
            if (Math.random() < 0.3) {
              player.knockDown();
            }
          }
        }
      }
    }
  }
}
