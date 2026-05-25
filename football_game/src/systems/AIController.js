// AI 控制器
import { GAME_CONFIG } from '../config/game.config.js';
import { eventBus } from '../core/EventBus.js';

export class AIController {
  constructor(scene) {
    this.scene = scene;
    this.players = scene.players;
    this.ball = scene.ball;
    this.field = scene.field;

    // AI 思维间隔
    this.thinkTimer = 0;
    this.thinkInterval = GAME_CONFIG.AI.THINK_INTERVAL;

    // AI 状态
    this.aiStates = new Map();

    // 初始化 AI 状态
    this.players.filter(p => p.team === 'B').forEach(player => {
      this.aiStates.set(player, 'chase_ball');
    });

    // 监听射门事件
    eventBus.on('playerShoot', () => this._onAIShoot());
  }

  update(deltaTime) {
    // 获取蓝队 AI 球员
    const aiPlayers = this.players.filter(p => p.team === 'B');

    this.thinkTimer += deltaTime;

    if (this.thinkTimer >= this.thinkInterval) {
      this.thinkTimer = 0;

      aiPlayers.forEach(player => {
        this._think(player);
      });
    }

    // 每个帧更新移动
    aiPlayers.forEach(player => {
      this._act(player);
    });
  }

  _think(player) {
    const ball = this.ball;
    const role = player.role;
    const state = this.aiStates.get(player);

    // 判断距离球门的方向
    const goalToDefend = this.field.getGoalPosition('B'); // 蓝队球门
    const goalToAttack = this.field.getGoalPosition('A'); // 红队球门

    if (role === 'goalkeeper') {
      // 守门员：坚守球门
      if (ball.isHeld && ball.holder.team === 'A' && ball.distanceTo(goalToDefend) < 200) {
        this.aiStates.set(player, 'defend_goal');
      } else {
        this.aiStates.set(player, 'guard_goal');
      }
    } else if (role === 'defender') {
      // 后卫 CB：主要防守，保护己方球门
      if (ball.isHeld && ball.holder.team === 'A') {
        // 对方带球，追球施压
        this.aiStates.set(player, 'chase_ball');
      } else if (ball.isHeld && ball.holder.team === 'B') {
        // 队友带球，返回防守位置（不要跑太远去追队友的球）
        this.aiStates.set(player, 'return');
      } else {
        // 球自由，回防
        this.aiStates.set(player, 'return');
      }
    } else if (role === 'midfielder') {
      // 中场 CM：攻守兼备，主要支援进攻
      if (ball.isHeld && ball.holder === player) {
        // 自己带球，进攻！
        this.aiStates.set(player, 'attack');
      } else if (ball.isHeld) {
        if (ball.holder.team === 'B') {
          // 队友带球，支援进攻（在队友侧后方）
          this.aiStates.set(player, 'support');
        } else {
          // 对方带球，中场拦截
          this.aiStates.set(player, 'chase_ball');
        }
      } else {
        // 球自由，追球
        this.aiStates.set(player, 'chase_ball');
      }
    } else {
      // 前锋 ST：主要进攻
      if (ball.isHeld && ball.holder === player) {
        // 自己带球，进攻！
        this.aiStates.set(player, 'attack');
      } else if (ball.isHeld) {
        if (ball.holder.team === 'B') {
          // 队友带球，支援（在队友身后，不要挡路）
          this.aiStates.set(player, 'support');
        } else {
          // 对方带球，追球
          this.aiStates.set(player, 'chase_ball');
        }
      } else {
        // 球自由，追球
        this.aiStates.set(player, 'chase_ball');
      }
    }
  }

  _act(player) {
    const ball = this.ball;
    const state = this.aiStates.get(player);
    const role = player.role;
    const goalToAttack = this.field.getGoalPosition('A');
    const goalToDefend = this.field.getGoalPosition('B');

    let targetX, targetY;
    let speed = GAME_CONFIG.AI.CHASE_SPEED;

    switch (state) {
      case 'guard_goal':
        // 守门员在球门前小范围移动
        const goalPos = this.field.getGoalPosition('B');
        targetX = goalPos.x + 40;
        targetY = ball.y;
        targetY = Math.max(goalPos.y - 60, Math.min(goalPos.y + 60, targetY));
        break;

      case 'defend_goal':
        // 冲向球
        targetX = ball.x;
        targetY = ball.y;
        speed = GAME_CONFIG.AI.ATTACK_SPEED;
        break;

      case 'chase_ball':
        // 追球 - 只追自由球或对方持有的球，不追队友持有的球
        if (ball.isHeld && ball.holder.team === 'A') {
          // 追对方球员持有的球
          targetX = ball.x;
          targetY = ball.y;
        } else if (!ball.isHeld) {
          // 追自由球
          targetX = ball.x;
          targetY = ball.y;
        } else {
          // 队友持有球，应该去支援而不是追球
          targetX = goalToDefend.x + 200;
          targetY = this.field.getCenter().y;
        }
        break;

      case 'attack':
        // 带球进攻 - 朝对方球门移动
        targetX = goalToAttack.x;
        targetY = goalToAttack.y;
        speed = GAME_CONFIG.AI.CHASE_SPEED;
        break;

      case 'support':
        // 支援 - 在持球者身后（朝向己方球门方向 = 防守方向）
        // 注意：蓝队(B)进攻方向是朝左(对方球门)，所以"身后"是x+40（朝己方球门）
        if (ball.holder && ball.holder.team === 'B') {
          const holder = ball.holder;
          // 在持球者身后（防守方向）
          targetX = holder.x + 40; // +40 is toward own goal for Blue
          targetY = holder.y;
          // 中场支援时可以稍微靠边
          if (role === 'midfielder') {
            targetY = holder.y + (player.y > holder.y ? -60 : 60);
          }
        } else {
          targetX = ball.x;
          targetY = ball.y;
        }
        break;

      case 'return':
        // 返回防守位置 - 根据角色返回不同位置
        if (role === 'defender') {
          // 后卫留在己方半场靠近球门的位置
          targetX = goalToDefend.x + 150;
          targetY = ball.y;
        } else if (role === 'midfielder') {
          // 中场回防到中场位置
          targetX = goalToDefend.x + 250;
          targetY = ball.y + (player.y > goalToDefend.y ? -80 : 80);
        } else {
          // 前锋回防稍微靠后
          targetX = goalToDefend.x + 180;
          targetY = ball.y + (player.y > goalToDefend.y ? -60 : 60);
        }
        break;

      default:
        targetX = ball.x;
        targetY = ball.y;
    }

    // 移动向目标
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const moveX = dx / dist;
      const moveY = dy / dist;
      player.move(moveX, moveY);
    }

    // 尝试射门 - 前锋和中场都可以射门
    if ((player.role === 'striker' || player.role === 'midfielder') && ball.isHeld && ball.holder === player) {
      const goalPos = this.field.getGoalPosition('A');
      const distToGoal = Math.sqrt(
        Math.pow(goalPos.x - player.x, 2) +
        Math.pow(goalPos.y - player.y, 2)
      );

      // 前锋射门距离更远，中场射门距离较短
      const shootRange = player.role === 'striker' ? 200 : 150;

      if (distToGoal < shootRange && Math.random() < 0.03) {
        const shootResult = player.shoot(12, false);
        if (shootResult) {
          ball.shoot(shootResult.power, shootResult.angle, shootResult.isFlame);
        }
      }
    }
  }

  _onAIShoot() {
    // AI 射门后的处理
  }
}
