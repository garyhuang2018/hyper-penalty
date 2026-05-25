// 必杀技系统
import { GAME_CONFIG } from '../config/game.config.js';
import { soundSystem } from './SoundSystem.js';

export class SkillSystem {
  constructor(scene) {
    this.scene = scene;
    this.ball = scene.ball;

    // 蓄力
    this.charge = 0;
    this.isCharging = false;
  }

  startCharging() {
    if (this.ball.isHeld && this.scene.matchController && !this.scene.matchController.isPaused()) {
      this.isCharging = true;
      soundSystem.playCharge();
    }
  }

  update() {
    if (this.isCharging && this.ball.isHeld) {
      this.charge = Math.min(this.charge + GAME_CONFIG.SKILL.CHARGE_RATE, GAME_CONFIG.SKILL.MAX_CHARGE);
    }
  }

  release(player) {
    // 带球11步后自动火焰球
    if (player.dribbleSteps >= 11) {
      player.isFlame = true;
    }

    // 高跳射门必杀 - 跳到最高点时射门 = 火焰球
    if (player.isJumping && player.jumpHeight > 50) {
      player.isFlame = true;
    }

    if (!this.isCharging || !this.ball.isHeld) {
      // 非蓄力射门也检查火焰球条件
      const isFlame = player.isFlame || this.charge >= GAME_CONFIG.SKILL.FLAME_THRESHOLD;
      if (!this.ball.isHeld) {
        this.isCharging = false;
        this.charge = 0;
        return null;
      }

      const power = this._calculatePower();
      const flame = isFlame;

      // 方向朝向对方球门
      const goalX = player.team === 'A'
        ? GAME_CONFIG.FIELD.OFFSET_X + GAME_CONFIG.FIELD.WIDTH + GAME_CONFIG.GOAL.WIDTH
        : GAME_CONFIG.FIELD.OFFSET_X - GAME_CONFIG.GOAL.WIDTH;
      const goalY = GAME_CONFIG.FIELD.OFFSET_Y + GAME_CONFIG.FIELD.HEIGHT / 2;
      const angle = Math.atan2(goalY - player.y, goalX - player.x);

      // 重置
      this.isCharging = false;
      this.charge = 0;
      player.dribbleSteps = 0;
      player.isFlame = false;

      return { power, angle, isFlame: flame };
    }

    const power = this._calculatePower();
    const isFlame = this.charge >= GAME_CONFIG.SKILL.FLAME_THRESHOLD;

    // 方向朝向对方球门
    const goalX = player.team === 'A'
      ? GAME_CONFIG.FIELD.OFFSET_X + GAME_CONFIG.FIELD.WIDTH + GAME_CONFIG.GOAL.WIDTH
      : GAME_CONFIG.FIELD.OFFSET_X - GAME_CONFIG.GOAL.WIDTH;
    const goalY = GAME_CONFIG.FIELD.OFFSET_Y + GAME_CONFIG.FIELD.HEIGHT / 2;
    const angle = Math.atan2(goalY - player.y, goalX - player.x);

    // 重置蓄力
    this.isCharging = false;
    this.charge = 0;
    player.dribbleSteps = 0;
    player.isFlame = false;

    return { power, angle, isFlame };
  }

  _calculatePower() {
    // 根据蓄力值计算射门力量
    const ratio = this.charge / GAME_CONFIG.SKILL.MAX_CHARGE;
    return GAME_CONFIG.SKILL.MIN_SHOOT_POWER +
           (GAME_CONFIG.SKILL.MAX_SHOOT_POWER - GAME_CONFIG.SKILL.MIN_SHOOT_POWER) * ratio;
  }

  reset() {
    this.charge = 0;
    this.isCharging = false;
  }
}
