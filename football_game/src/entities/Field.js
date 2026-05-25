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

  // 获取某球队的初始球员位置 (6v6阵型: 1 GK + 2 CB + 2 CM + 1 ST)
  getStartingPositions(team) {
    const center = this.getCenter();
    const positions = [];

    if (team === 'A') {
      // 红队 - 左侧 (1-2-2-1阵型)
      // 守门员 GK
      positions.push({ x: this.x + 50, y: center.y, role: 'goalkeeper' });
      // 后卫 CB x2
      positions.push({ x: this.x + 150, y: center.y - 80, role: 'defender' });
      positions.push({ x: this.x + 150, y: center.y + 80, role: 'defender' });
      // 中场 CM x2
      positions.push({ x: this.x + 280, y: center.y - 100, role: 'midfielder' });
      positions.push({ x: this.x + 280, y: center.y + 100, role: 'midfielder' });
      // 前锋 ST
      positions.push({ x: this.x + 380, y: center.y, role: 'striker' });
    } else {
      // 蓝队 - 右侧 (镜像阵型)
      // 守门员 GK
      positions.push({ x: this.x + this.width - 50, y: center.y, role: 'goalkeeper' });
      // 后卫 CB x2
      positions.push({ x: this.x + this.width - 150, y: center.y - 80, role: 'defender' });
      positions.push({ x: this.x + this.width - 150, y: center.y + 80, role: 'defender' });
      // 中场 CM x2
      positions.push({ x: this.x + this.width - 280, y: center.y - 100, role: 'midfielder' });
      positions.push({ x: this.x + this.width - 280, y: center.y + 100, role: 'midfielder' });
      // 前锋 ST
      positions.push({ x: this.x + this.width - 380, y: center.y, role: 'striker' });
    }

    return positions;
  }

  // 获取球的初始位置（场地中央）
  getBallStartPosition() {
    return this.getCenter();
  }
}
