// 球门实体
import { GAME_CONFIG } from '../config/game.config.js';

export class Goal {
  constructor(side) {
    this.side = side; // 'left' 或 'right'

    const field = GAME_CONFIG.FIELD;
    const goal = GAME_CONFIG.GOAL;

    if (side === 'left') {
      this.x = field.OFFSET_X - goal.WIDTH;
      this.y = field.OFFSET_Y + (field.HEIGHT - goal.HEIGHT) / 2;
    } else {
      this.x = field.OFFSET_X + field.WIDTH;
      this.y = field.OFFSET_Y + (field.HEIGHT - goal.HEIGHT) / 2;
    }

    this.width = goal.WIDTH;
    this.height = goal.HEIGHT;
  }

  // 检测球是否进球
  checkGoal(ball) {
    return (
      ball.x >= this.x &&
      ball.x <= this.x + this.width &&
      ball.y >= this.y &&
      ball.y <= this.y + this.height
    );
  }

  // 获取进球的目标球队（A 队进攻左侧球门，B 队进攻右侧球门）
  getTargetTeam() {
    return this.side === 'left' ? 'A' : 'B';
  }
}
