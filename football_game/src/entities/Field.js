// 场地实体
import { GAME_CONFIG } from '../config/game.config.js';

export class Field {
  constructor() {
    const field = GAME_CONFIG.FIELD;
    this.x = field.OFFSET_X;
    this.y = field.OFFSET_Y;
    this.width = field.WIDTH;
    this.height = field.HEIGHT;
  }

  // 获取场地中心点
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  // 获取某球队的初始球门位置
  getGoalPosition(team) {
    if (team === 'A') {
      return { x: this.x - GAME_CONFIG.GOAL.WIDTH, y: this.y + this.height / 2 };
    } else {
      return { x: this.x + this.width + GAME_CONFIG.GOAL.WIDTH, y: this.y + this.height / 2 };
    }
  }

  // 获取某球队的初始球员位置
  getStartingPositions(team) {
    const center = this.getCenter();
    const positions = [];

    if (team === 'A') {
      // 红队 - 左侧
      // 守门员
      positions.push({ x: this.x + 50, y: center.y, role: 'goalkeeper' });
      // 后卫
      positions.push({ x: this.x + 150, y: center.y - 100, role: 'defender' });
      // 前锋
      positions.push({ x: this.x + 250, y: center.y, role: 'forward' });
    } else {
      // 蓝队 - 右侧
      // 守门员
      positions.push({ x: this.x + this.width - 50, y: center.y, role: 'goalkeeper' });
      // 后卫
      positions.push({ x: this.x + this.width - 150, y: center.y + 100, role: 'defender' });
      // 前锋
      positions.push({ x: this.x + this.width - 250, y: center.y, role: 'forward' });
    }

    return positions;
  }

  // 获取球的初始位置（场地中央）
  getBallStartPosition() {
    return this.getCenter();
  }
}
