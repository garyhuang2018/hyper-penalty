// Canvas 渲染器
import { GAME_CONFIG } from '../config/game.config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.height = canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    // 设置抗锯齿（像素风格需要关闭）
    this.ctx.imageSmoothingEnabled = false;
  }

  // 清空画布
  clear() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // 绘制场地
  drawField() {
    const field = GAME_CONFIG.FIELD;
    const ctx = this.ctx;

    // 场地背景
    ctx.fillStyle = field.COLOR;
    ctx.fillRect(field.OFFSET_X, field.OFFSET_Y, field.WIDTH, field.HEIGHT);

    // 场地边线
    ctx.strokeStyle = field.LINE_COLOR;
    ctx.lineWidth = field.LINE_WIDTH;
    ctx.strokeRect(field.OFFSET_X, field.OFFSET_Y, field.WIDTH, field.HEIGHT);

    // 中线
    ctx.beginPath();
    ctx.moveTo(field.OFFSET_X + field.WIDTH / 2, field.OFFSET_Y);
    ctx.lineTo(field.OFFSET_X + field.WIDTH / 2, field.OFFSET_Y + field.HEIGHT);
    ctx.stroke();

    // 中圈
    ctx.beginPath();
    ctx.arc(field.OFFSET_X + field.WIDTH / 2, field.OFFSET_Y + field.HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // 中点
    ctx.fillStyle = field.LINE_COLOR;
    ctx.beginPath();
    ctx.arc(field.OFFSET_X + field.WIDTH / 2, field.OFFSET_Y + field.HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // 左侧禁区
    const penaltyWidth = 150;
    const penaltyHeight = 280;
    ctx.strokeRect(
      field.OFFSET_X,
      field.OFFSET_Y + (field.HEIGHT - penaltyHeight) / 2,
      penaltyWidth,
      penaltyHeight
    );

    // 左侧球门区（小禁区）
    const goalAreaWidth = 60;
    const goalAreaHeight = 160;
    ctx.strokeRect(
      field.OFFSET_X,
      field.OFFSET_Y + (field.HEIGHT - goalAreaHeight) / 2,
      goalAreaWidth,
      goalAreaHeight
    );

    // 右侧禁区
    ctx.strokeRect(
      field.OFFSET_X + field.WIDTH - penaltyWidth,
      field.OFFSET_Y + (field.HEIGHT - penaltyHeight) / 2,
      penaltyWidth,
      penaltyHeight
    );

    // 右侧球门区（小禁区）
    ctx.strokeRect(
      field.OFFSET_X + field.WIDTH - goalAreaWidth,
      field.OFFSET_Y + (field.HEIGHT - goalAreaHeight) / 2,
      goalAreaWidth,
      goalAreaHeight
    );
  }

  // 绘制球门
  drawGoals() {
    const field = GAME_CONFIG.FIELD;
    const goal = GAME_CONFIG.GOAL;
    const ctx = this.ctx;

    // 左侧球门（蓝队防守，红队进攻）
    ctx.fillStyle = '#3498db';
    ctx.fillRect(
      field.OFFSET_X - goal.WIDTH,
      field.OFFSET_Y + (field.HEIGHT - goal.HEIGHT) / 2,
      goal.WIDTH,
      goal.HEIGHT
    );

    // 左侧球门框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      field.OFFSET_X - goal.WIDTH,
      field.OFFSET_Y + (field.HEIGHT - goal.HEIGHT) / 2,
      goal.WIDTH,
      goal.HEIGHT
    );

    // 右侧球门（红队防守，蓝队进攻）
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(
      field.OFFSET_X + field.WIDTH,
      field.OFFSET_Y + (field.HEIGHT - goal.HEIGHT) / 2,
      goal.WIDTH,
      goal.HEIGHT
    );

    // 右侧球门框
    ctx.strokeRect(
      field.OFFSET_X + field.WIDTH,
      field.OFFSET_Y + (field.HEIGHT - goal.HEIGHT) / 2,
      goal.WIDTH,
      goal.HEIGHT
    );

    ctx.lineWidth = field.LINE_WIDTH;
  }

  // 绘制圆形（用于玩家/球 占位）
  drawCircle(x, y, radius, color, borderColor = null) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 绘制文本
  drawText(text, x, y, options = {}) {
    const ctx = this.ctx;
    const {
      color = '#ffffff',
      font = '16px Arial',
      align = 'center',
      baseline = 'middle'
    } = options;

    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  }
}
