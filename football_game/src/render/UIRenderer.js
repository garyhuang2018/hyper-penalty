// UI 渲染器
import { GAME_CONFIG } from '../config/game.config.js';

export class UIRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // 绘制比分 UI
  drawScore(scoreA, scoreB) {
    const ctx = this.ctx;
    const { CANVAS_WIDTH } = GAME_CONFIG;

    // 比分背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 80, 5, 160, 30);

    // 比分文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`RED ${scoreA} - ${scoreB} BLUE`, CANVAS_WIDTH / 2, 20);
  }

  // 绘制计时器
  drawTimer(seconds) {
    const ctx = this.ctx;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, 10, 10);
  }

  // 绘制蓄力条
  drawChargeBar(charge) {
    const ctx = this.ctx;
    const barWidth = 200;
    const barHeight = 20;
    const x = 10;
    const y = GAME_CONFIG.CANVAS_HEIGHT - 30;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);

    // 进度条背景
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 蓄力进度（渐变颜色）
    const ratio = charge / GAME_CONFIG.SKILL.MAX_CHARGE;
    let color;
    if (ratio < 0.5) {
      color = '#f1c40f'; // 黄色
    } else if (ratio < GAME_CONFIG.SKILL.FLAME_THRESHOLD / GAME_CONFIG.SKILL.MAX_CHARGE) {
      color = '#e67e22'; // 橙色
    } else {
      color = '#e74c3c'; // 红色（可释放必杀技）
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth * ratio, barHeight);

    // 火焰球阈值标记
    const flameX = x + barWidth * (GAME_CONFIG.SKILL.FLAME_THRESHOLD / GAME_CONFIG.SKILL.MAX_CHARGE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(flameX - 1, y - 3, 2, barHeight + 6);

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(charge >= GAME_CONFIG.SKILL.FLAME_THRESHOLD ? 'FLAME! PRESS SPACE!' : 'HOLD SPACE TO CHARGE', x + 5, y + barHeight / 2);
  }

  // 绘制控制提示
  drawControls() {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ARROWS/WASD: Move | SPACE: Shoot | Q/E: Switch Player', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  }

  // 绘制暂停/提示消息
  drawMessage(message, subMessage = '') {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 主消息
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    // 副消息
    if (subMessage) {
      ctx.font = '24px Arial';
      ctx.fillText(subMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }

  // 绘制半场/全场提示
  drawPeriod(period) {
    const ctx = this.ctx;
    const { CANVAS_WIDTH } = GAME_CONFIG;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 80, 40, 160, 30);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(period, CANVAS_WIDTH / 2, 55);
  }

  // 绘制当前控制的球员标识
  drawActivePlayerIndicator(playerIndex, team) {
    const ctx = this.ctx;
    const { CANVAS_WIDTH } = GAME_CONFIG;

    const teamName = team === 'A' ? 'RED' : 'BLUE';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH - 120, 5, 110, 25);

    ctx.fillStyle = team === 'A' ? '#e74c3c' : '#3498db';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${teamName} P${playerIndex + 1}`, CANVAS_WIDTH - 65, 17);
  }
}
