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

    // 初始化草地纹理
    this.grassPattern = null;
    this.initGrassPattern();
  }

  // 初始化草地纹理
  initGrassPattern() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 8;
    patternCanvas.height = 8;
    const pctx = patternCanvas.getContext('2d');

    // 基础色
    pctx.fillStyle = '#3a8c2a';
    pctx.fillRect(0, 0, 8, 8);

    // 条纹纹理
    pctx.fillStyle = '#2d7a22';
    pctx.fillRect(0, 0, 8, 4);

    // 草叶纹理
    pctx.fillStyle = '#4a9e35';
    pctx.fillRect(2, 2, 1, 4);
    pctx.fillRect(6, 0, 1, 4);

    this.grassPattern = this.ctx.createPattern(patternCanvas, 'repeat');
  }

  // 清空画布
  clear() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // 绘制观众席背景
  drawAudienceBackground() {
    const ctx = this.ctx;
    const field = GAME_CONFIG.FIELD;

    // 观众席渐变背景 - 上方
    const topGradient = ctx.createLinearGradient(0, 0, 0, field.OFFSET_Y);
    topGradient.addColorStop(0, '#2c3e50');
    topGradient.addColorStop(1, '#34495e');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, this.width, field.OFFSET_Y);

    // 观众席渐变背景 - 下方
    const bottomGradient = ctx.createLinearGradient(0, field.OFFSET_Y + field.HEIGHT, 0, this.height);
    bottomGradient.addColorStop(0, '#34495e');
    bottomGradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, field.OFFSET_Y + field.HEIGHT, this.width, this.height - field.OFFSET_Y - field.HEIGHT);

    // 两侧观众席
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, field.OFFSET_Y, field.OFFSET_X, field.HEIGHT);
    ctx.fillRect(field.OFFSET_X + field.WIDTH, field.OFFSET_Y, field.OFFSET_X, field.HEIGHT);
  }

  // 生成草地纹理
  generateGrassPattern() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // 基础草地色
    ctx.fillStyle = '#3a8c2a';
    ctx.fillRect(0, 0, 64, 64);

    // 添加草皮纹理变体 - 条纹效果
    for (let i = 0; i < 64; i += 4) {
      const shade = i % 8 === 0 ? '#3d9230' : '#358c28';
      ctx.fillStyle = shade;
      ctx.fillRect(0, i, 64, 2);
    }

    // 添加随机草叶效果
    ctx.fillStyle = '#4a9e35';
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * 64);
      const y = Math.floor(Math.random() * 64);
      ctx.fillRect(x, y, 1, 3);
    }

    // 添加深色斑点模拟真实草地
    ctx.fillStyle = '#2d7a22';
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * 60) + 2;
      const y = Math.floor(Math.random() * 60) + 2;
      ctx.fillRect(x, y, 2, 2);
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  // 绘制场地
  drawField() {
    const field = GAME_CONFIG.FIELD;
    const ctx = this.ctx;

    // 绘制观众席背景
    this.drawAudienceBackground();

    // 场地背景 - 使用草地纹理
    if (this.grassPattern) {
      ctx.fillStyle = this.grassPattern;
    } else {
      ctx.fillStyle = field.COLOR;
    }
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

  // 绘制球员像素精灵
  drawPlayer(player) {
    const ctx = this.ctx;
    const { x, y, direction, team, state, animFrame } = player;

    // 皮肤色
    const skinColor = '#f5c5a3';
    // 球队色
    const teamColor = team === 'A' ? '#e74c3c' : '#3498db';
    // 深色（腿）
    const darkColor = '#222222';

    // 保存当前状态
    ctx.save();
    ctx.translate(x, y);

    // 根据朝向翻转
    const facingRight = Math.cos(direction) >= 0;
    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    // 绘制状态
    if (state === 'knocked_down' || state === 'getting_up') {
      // 倒地状态 - 横向绘制
      this._drawKnockedDownPlayer(skinColor, teamColor, darkColor);
    } else if (state === 'shooting') {
      // 射门状态
      this._drawShootingPlayer(skinColor, teamColor, darkColor);
    } else if (state === 'tackling') {
      // 铲球状态 - 低姿态滑铲
      this._drawTacklingPlayer(skinColor, teamColor, darkColor);
    } else {
      // 站立/跑步状态
      const legOffset = state === 'running' ? Math.sin(animFrame * Math.PI / 2) * 3 : 0;
      const armOffset = state === 'running' ? Math.sin(animFrame * Math.PI / 2) * 2 : 0;
      this._drawStandingPlayer(skinColor, teamColor, darkColor, legOffset, armOffset);
    }

    ctx.restore();
  }

  // 站立/跑步姿态
  _drawStandingPlayer(skinColor, teamColor, darkColor, legOffset, armOffset) {
    const ctx = this.ctx;

    // 头发 (6x3 px) - 顶部
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -23, 6, 3);

    // 头部 (8x6 px) - 眼睛区域
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -20, 8, 6);

    // 眼睛 (2x2 px, 每个)
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -18, 2, 2);
    ctx.fillRect(1, -18, 2, 2);

    // 身体/球衣 (10x10 px)
    ctx.fillStyle = teamColor;
    ctx.fillRect(-5, -14, 10, 10);

    // 手臂 (3x8 px, 每个) - 稍微偏移模拟摆动
    ctx.fillStyle = skinColor;
    ctx.fillRect(-8, -12, 3, 8 + armOffset);
    ctx.fillRect(5, -12, 3, 8 - armOffset);

    // 腿 (4x10 px, 每条) - 交替前后
    ctx.fillStyle = darkColor;
    ctx.fillRect(-3, -4 + legOffset, 4, 10);
    ctx.fillRect(-1, -4 - legOffset, 4, 10);
  }

  // 射门姿态
  _drawShootingPlayer(skinColor, teamColor, darkColor) {
    const ctx = this.ctx;

    // 头发
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -23, 6, 3);

    // 头部
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -20, 8, 6);

    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -18, 2, 2);
    ctx.fillRect(1, -18, 2, 2);

    // 身体
    ctx.fillStyle = teamColor;
    ctx.fillRect(-5, -14, 10, 10);

    // 支撑腿
    ctx.fillStyle = darkColor;
    ctx.fillRect(-3, -4, 4, 10);

    // 踢球腿（向前伸）
    ctx.fillRect(5, -8, 4, 6);

    // 手臂（向后摆保持平衡）
    ctx.fillStyle = skinColor;
    ctx.fillRect(-8, -12, 3, 6);
    ctx.fillRect(5, -12, 3, 4);
  }

  // 倒地姿态
  _drawKnockedDownPlayer(skinColor, teamColor, darkColor) {
    const ctx = this.ctx;

    // 横向躺倒 - 身体旋转90度
    // 头发
    ctx.fillStyle = skinColor;
    ctx.fillRect(-23, -3, 6, 3);

    // 头部
    ctx.fillStyle = skinColor;
    ctx.fillRect(-20, -4, 8, 6);

    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(-18, -3, 2, 2);
    ctx.fillRect(-14, -3, 2, 2);

    // 身体
    ctx.fillStyle = teamColor;
    ctx.fillRect(-12, -5, 10, 10);

    // 手臂（向前伸）
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -8, 3, 8);
    ctx.fillRect(-4, 2, 3, 8);

    // 腿
    ctx.fillStyle = darkColor;
    ctx.fillRect(-2, -4, 10, 4);
    ctx.fillRect(-2, 2, 10, 4);
  }

  // 铲球姿态
  _drawTacklingPlayer(skinColor, teamColor, darkColor) {
    const ctx = this.ctx;

    // 头发
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12, 6, 3);

    // 头部（低姿态）
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -9, 8, 6);

    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -7, 2, 2);
    ctx.fillRect(1, -7, 2, 2);

    // 身体（倾斜，滑铲姿态）
    ctx.fillStyle = teamColor;
    ctx.fillRect(-6, -3, 12, 6);

    // 手臂（向前伸准备铲球）
    ctx.fillStyle = skinColor;
    ctx.fillRect(4, -5, 3, 8);

    // 腿（踢出）
    ctx.fillStyle = darkColor;
    ctx.fillRect(6, 3, 8, 3);
    ctx.fillRect(-8, 2, 6, 3);
  }
}
