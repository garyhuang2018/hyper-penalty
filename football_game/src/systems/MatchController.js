// 比赛控制器 - 规则和状态管理
import { GAME_CONFIG } from '../config/game.config.js';
import { eventBus } from '../core/EventBus.js';

export class MatchController {
  constructor(scene) {
    this.scene = scene;
    this.ball = scene.ball;
    this.goals = scene.goals;
    this.players = scene.players;

    // 比分
    this.scoreA = 0; // 红队
    this.scoreB = 0; // 蓝队

    // 比赛时间
    this.remainingTime = GAME_CONFIG.MATCH.HALF_DURATION;
    this.halfTime = true;
    this.secondHalf = false;
    this.isFirstHalf = true;

    // 暂停状态
    this.paused = true; // 开始时暂停
    this.goalScored = false;
    this.goalPauseTimer = 0;

    this.halfTimeMessage = false;
    this.fullTimeMessage = false;

    // 监听空格键继续
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (this.halfTimeMessage) {
          this._startSecondHalf();
        }
      }
    });
  }

  update(deltaTime) {
    // 进球暂停
    if (this.goalScored) {
      this.goalPauseTimer -= deltaTime;
      if (this.goalPauseTimer <= 0) {
        this.goalScored = false;
        this.paused = false;
        this.scene.resetPositions();
      }
      return;
    }

    // 半场/全场暂停
    if (this.paused) return;

    // 计时
    this.remainingTime -= deltaTime / 1000;
    if (this.remainingTime <= 0) {
      this.remainingTime = 0;

      if (this.isFirstHalf) {
        this._showHalfTime();
      } else {
        this._endMatch();
      }
    }
  }

  checkGoals() {
    if (this.goalScored) return;

    for (const goal of this.goals) {
      if (goal.checkGoal(this.ball)) {
        this._onGoal(goal);
        return;
      }
    }
  }

  _onGoal(goal) {
    this.goalScored = true;
    this.goalPauseTimer = GAME_CONFIG.MATCH.GOAL_PAUSE_DURATION;
    this.paused = true;

    // 更新比分
    // A 队进攻左侧球门（进球左侧球门算 A 得分）
    // B 队进攻右侧球门
    if (goal.side === 'right') {
      // 球进了右侧球门，是 A 队（红队）进的
      this.scoreA++;
      eventBus.emit('goal', { team: 'A', score: this.scoreA });
    } else {
      // 球进了左侧球门，是 B 队（蓝队）进的
      this.scoreB++;
      eventBus.emit('goal', { team: 'B', score: this.scoreB });
    }

    // 重置球位置
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  _showHalfTime() {
    this.paused = true;
    this.halfTimeMessage = true;
    this.halfTime = false;
    this.secondHalf = true;
  }

  _startSecondHalf() {
    this.halfTimeMessage = false;
    this.isFirstHalf = false;
    this.remainingTime = GAME_CONFIG.MATCH.HALF_DURATION;
    this.paused = false;
    this.scene.resetPositions();
  }

  _endMatch() {
    this.paused = true;
    this.fullTimeMessage = true;
    this.scene.ended = true;
  }

  isPaused() {
    return this.paused;
  }

  onShoot() {
    eventBus.emit('playerShoot');
  }
}
