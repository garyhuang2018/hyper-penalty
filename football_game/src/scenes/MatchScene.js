// 比赛场景 - 核心游戏逻辑
import { GAME_CONFIG } from '../config/game.config.js';
import { Ball } from '../entities/Ball.js';
import { Player } from '../entities/Player.js';
import { Goal } from '../entities/Goal.js';
import { Field } from '../entities/Field.js';
import { InputManager, KEYS } from '../core/InputManager.js';
import { Renderer } from '../render/Renderer.js';
import { UIRenderer } from '../render/UIRenderer.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { AIController } from '../systems/AIController.js';
import { MatchController } from '../systems/MatchController.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { eventBus } from '../core/EventBus.js';

// 球精灵图生成器
class BallSpriteGenerator {
  static getNormalBall(frame) {
    // 普通球 - 有轻微旋转动画（每4帧转一点）
    const rotationOffset = (frame % 4) * 2;

    return {
      pixels: [
        // 球体主体
        { x: 0, y: 0, r: 7, c: '#ffffff' },
        // 黑色五边形图案（模拟足球）
        { x: -2, y: -3, w: 4, h: 4, c: '#333333' },
      ],
      rotation: rotationOffset
    };
  }

  static getFlameBall(frame) {
    // 火焰球 - 旋转的火焰效果
    const flamePhase = frame % 8;
    const scale = 1 + (flamePhase < 4 ? flamePhase * 0.1 : (8 - flamePhase) * 0.1);

    // 火焰粒子位置（围绕球的火焰效果）
    const flameParticles = [];
    const numFlames = 6;
    for (let i = 0; i < numFlames; i++) {
      const angle = (i / numFlames) * Math.PI * 2 + (flamePhase * 0.3);
      const dist = 8 + Math.sin(flamePhase * 0.5 + i) * 2;
      flameParticles.push({
        x: Math.cos(angle) * dist * scale,
        y: Math.sin(angle) * dist * scale,
        size: 3 + Math.sin(flamePhase + i) * 1.5,
        c: i % 2 === 0 ? '#ff6600' : '#ffcc00'
      });
    }

    return {
      center: { x: 0, y: 0, r: 6, c: '#ffffff' },
      flames: flameParticles,
      glow: { r: 12, c: 'rgba(255, 100, 0, 0.4)' }
    };
  }
}

// 简单像素精灵图生成器
class SpriteGenerator {
  // 生成球员精灵图数据
  static generatePlayerSprite(team, state, frame, direction) {
    const colors = team === 'A'
      ? { body: '#e74c3c', dark: '#c0392b', skin: '#fdbf6f' }
      : { body: '#3498db', dark: '#2980b9', skin: '#fdbf6f' };

    const sprites = {
      idle: this._genIdleSprite(colors, direction),
      running: this._genRunningSprite(colors, frame, direction),
      shooting: this._genShootingSprite(colors, frame, direction),
      knocked_down: this._genKnockedDownSprite(colors),
      getting_up: this._genGettingUpSprite(colors, frame),
      tackling: this._genTacklingSprite(colors, direction),
    };

    return sprites[state] || sprites.idle;
  }

  static _genIdleSprite(colors, direction) {
    const flip = direction > Math.PI / 2 || direction < -Math.PI / 2;
    return {
      pixels: [
        // 头
        { x: -4, y: -12, w: 8, h: 8, c: colors.skin },
        // 身体
        { x: -5, y: -4, w: 10, h: 10, c: colors.body },
        { x: -3, y: -2, w: 6, h: 6, c: colors.dark },
        // 腿
        { x: -4, y: 6, w: 3, h: 6, c: colors.dark },
        { x: 1, y: 6, w: 3, h: 6, c: colors.dark },
      ],
      flip: flip
    };
  }

  static _genRunningSprite(colors, frame, direction) {
    const flip = direction > Math.PI / 2 || direction < -Math.PI / 2;
    // 4帧跑步动画
    const legOffset = [0, 2, 0, -2][frame % 4];
    const armOffset = [-1, 1, -1, 1][frame % 4];

    return {
      pixels: [
        // 头
        { x: -4, y: -12, w: 8, h: 8, c: colors.skin },
        // 身体
        { x: -5, y: -4, w: 10, h: 10, c: colors.body },
        { x: -3, y: -2, w: 6, h: 6, c: colors.dark },
        // 手臂
        { x: -8, y: -3 + armOffset, w: 4, h: 3, c: colors.skin },
        { x: 4, y: -3 - armOffset, w: 4, h: 3, c: colors.skin },
        // 腿（动画）
        { x: -4, y: 6 + legOffset, w: 3, h: 6, c: colors.dark },
        { x: 1, y: 6 - legOffset, w: 3, h: 6, c: colors.dark },
      ],
      flip: flip
    };
  }

  static _genShootingSprite(colors, frame, direction) {
    const flip = direction > Math.PI / 2 || direction < -Math.PI / 2;
    // 2帧射门动画
    const kickOffset = frame % 2 === 0 ? 4 : 8;

    return {
      pixels: [
        // 头
        { x: -4, y: -12, w: 8, h: 8, c: colors.skin },
        // 身体（后仰）
        { x: -6, y: -4, w: 10, h: 10, c: colors.body },
        { x: -4, y: -2, w: 6, h: 6, c: colors.dark },
        // 支撑腿
        { x: -3, y: 6, w: 3, h: 6, c: colors.dark },
        // 踢球腿（伸出）
        { x: 2 + kickOffset, y: 2, w: 8, h: 3, c: colors.dark },
        // 手臂
        { x: -9, y: -2, w: 4, h: 3, c: colors.skin },
        { x: 5, y: -4, w: 4, h: 3, c: colors.skin },
      ],
      flip: flip
    };
  }

  static _genKnockedDownSprite(colors) {
    return {
      pixels: [
        // 头
        { x: -6, y: -2, w: 8, h: 6, c: colors.skin },
        // 身体（躺）
        { x: 2, y: -1, w: 10, h: 6, c: colors.body },
        // 腿
        { x: -10, y: 0, w: 6, h: 3, c: colors.dark },
        { x: 12, y: 2, w: 6, h: 3, c: colors.dark },
      ],
      flip: false
    };
  }

  static _genGettingUpSprite(colors, frame) {
    // 起身动画 - 从躺到站
    const progress = frame % 4 / 4;
    const tilt = Math.floor(progress * 3);

    return {
      pixels: [
        // 头
        { x: -4 + tilt, y: -10 + tilt * 2, w: 8, h: 8, c: colors.skin },
        // 身体
        { x: -5 + tilt, y: -4 + tilt * 2, w: 10, h: 10, c: colors.body },
        { x: -3 + tilt, y: -2 + tilt * 2, w: 6, h: 6, c: colors.dark },
        // 腿
        { x: -4, y: 6, w: 3, h: 6, c: colors.dark },
        { x: 1, y: 6, w: 3, h: 6, c: colors.dark },
      ],
      flip: false
    };
  }

  static _genTacklingSprite(colors, direction) {
    const flip = direction > Math.PI / 2 || direction < -Math.PI / 2;

    return {
      pixels: [
        // 头（低姿态）
        { x: -4, y: -6, w: 8, h: 6, c: colors.skin },
        // 身体（滑铲）
        { x: -8, y: -2, w: 14, h: 6, c: colors.body },
        { x: -6, y: 0, w: 10, h: 4, c: colors.dark },
        // 腿（踢出）
        { x: 6, y: 2, w: 8, h: 3, c: colors.dark },
        { x: -12, y: 0, w: 5, h: 3, c: colors.dark },
      ],
      flip: flip
    };
  }
}

export class MatchScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.uiRenderer = new UIRenderer(canvas.getContext('2d'));
    this.inputManager = new InputManager();
    this.field = new Field();

    // 初始化球
    const ballPos = this.field.getBallStartPosition();
    this.ball = new Ball(ballPos.x, ballPos.y);

    // 初始化球员
    this.players = [];
    this._initPlayers();

    // 初始化球门
    this.goals = [new Goal('left'), new Goal('right')];

    // 初始化系统
    this.physics = new PhysicsSystem(this);
    this.ai = new AIController(this);
    this.matchController = new MatchController(this);
    this.skillSystem = new SkillSystem(this);

    // 玩家当前控制的球员索引
    this.activePlayerIndex = 2; // 默认控制前锋

    // 注册输入
    this._registerInput();

    // 标记是否结束
    this.ended = false;
  }

  _initPlayers() {
    const teams = ['A', 'B'];
    teams.forEach(team => {
      const positions = this.field.getStartingPositions(team);
      positions.forEach((pos, index) => {
        const player = new Player(pos.x, pos.y, team, pos.role);
        this.players.push(player);
      });
    });
  }

  _registerInput() {
    // 移动
    this.inputManager.onKeyDown(KEYS.UP, () => this._move(0, -1));
    this.inputManager.onKeyDown(KEYS.DOWN, () => this._move(0, 1));
    this.inputManager.onKeyDown(KEYS.LEFT, () => this._move(-1, 0));
    this.inputManager.onKeyDown(KEYS.RIGHT, () => this._move(1, 0));
    this.inputManager.onKeyDown(KEYS.W, () => this._move(0, -1));
    this.inputManager.onKeyDown(KEYS.S, () => this._move(0, 1));
    this.inputManager.onKeyDown(KEYS.A, () => this._move(-1, 0));
    this.inputManager.onKeyDown(KEYS.D, () => this._move(1, 0));

    // 射门（松开空格键时）
    this.inputManager.onKeyDown(KEYS.SPACE, () => this.skillSystem.startCharging());
    this.inputManager.onKeyUp(KEYS.SPACE, () => this._shoot());

    // 换人
    this.inputManager.onKeyDown(KEYS.Q, () => this._switchPlayer(-1));
    this.inputManager.onKeyDown(KEYS.E, () => this._switchPlayer(1));
  }

  _move(dx, dy) {
    if (this.matchController.isPaused()) return;
    const activePlayer = this._getActivePlayer();
    if (activePlayer) {
      activePlayer.move(dx, dy);
    }
  }

  _shoot() {
    if (this.matchController.isPaused()) return;
    const activePlayer = this._getActivePlayer();
    if (activePlayer && this.ball.holder === activePlayer) {
      const result = this.skillSystem.release(activePlayer);
      if (result) {
        this.ball.shoot(result.power, result.angle, result.isFlame);
        this.matchController.onShoot();
      }
    }
  }

  _switchPlayer(direction) {
    // 获取红队球员（玩家控制的队伍）
    const redPlayers = this.players.filter(p => p.team === 'A');
    this.activePlayerIndex = (this.activePlayerIndex + direction + redPlayers.length) % redPlayers.length;
    eventBus.emit('playerSwitch', { index: this.activePlayerIndex });
  }

  _getActivePlayer() {
    const redPlayers = this.players.filter(p => p.team === 'A');
    return redPlayers[this.activePlayerIndex];
  }

  // 更新
  update(deltaTime) {
    if (this.ended) return;

    // 更新比赛控制器
    this.matchController.update(deltaTime);

    if (!this.matchController.isPaused()) {
      // 更新技能系统（蓄力）
      this.skillSystem.update();

      // 更新球员
      this.players.forEach(player => player.update(deltaTime));

      // 更新球
      this.ball.update();
      this.ball.updateAnimation();

      // AI 决策
      this.ai.update(deltaTime);

      // 物理和碰撞
      this.physics.update();

      // 检查进球
      this.matchController.checkGoals();
    }

    // 更新动画
    this._updateAnimations();
  }

  _updateAnimations() {
    // 可用于更新粒子效果等
  }

  // 渲染
  render() {
    // 清空
    this.renderer.clear();

    // 绘制场地
    this.renderer.drawField();
    this.renderer.drawGoals();

    // 绘制球员
    this.players.forEach((player, index) => {
      this._renderPlayer(player, index);
    });

    // 绘制球
    this._renderBall();

    // 绘制 UI
    this._renderUI();
  }

  _renderPlayer(player, index) {
    const ctx = this.renderer.ctx;
    const isActive = player.team === 'A' && this.players.filter(p => p.team === 'A').indexOf(player) === this.activePlayerIndex;

    // 获取精灵图
    const sprite = SpriteGenerator.generatePlayerSprite(
      player.team,
      player.state,
      player.animFrame,
      player.direction
    );

    // 保存上下文状态
    ctx.save();

    // 翻转处理
    if (sprite.flip) {
      ctx.translate(player.x, player.y);
      ctx.scale(-1, 1);
      ctx.translate(-player.x, -player.y);
    }

    // 绘制像素精灵
    sprite.pixels.forEach(px => {
      ctx.fillStyle = px.c;
      ctx.fillRect(
        Math.round(player.x + px.x - px.w / 2),
        Math.round(player.y + px.y - px.h / 2),
        px.w,
        px.h
      );
    });

    ctx.restore();

    // 当前控制球员标记（光环）
    if (isActive) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, GAME_CONFIG.PLAYER.RADIUS + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 倒地时的地面阴影
    if (player.state === 'knocked_down' || player.state === 'getting_up') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 8, player.radius * 0.8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderBall() {
    const ctx = this.renderer.ctx;
    const frame = this.ball.animFrame; // 使用球的动画帧

    // 普通球或火焰球
    if (this.ball.isFlame) {
      const flameBall = BallSpriteGenerator.getFlameBall(frame);

      // 发光效果
      const gradient = ctx.createRadialGradient(
        this.ball.x, this.ball.y, 0,
        this.ball.x, this.ball.y, flameBall.glow.r
      );
      gradient.addColorStop(0, 'rgba(255, 150, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, flameBall.glow.r, 0, Math.PI * 2);
      ctx.fill();

      // 火焰粒子
      flameBall.flames.forEach(f => {
        ctx.fillStyle = f.c;
        ctx.beginPath();
        ctx.arc(this.ball.x + f.x, this.ball.y + f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 球核心
      ctx.fillStyle = flameBall.center.c;
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, flameBall.center.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const normalBall = BallSpriteGenerator.getNormalBall(frame);

      // 球本体
      ctx.fillStyle = normalBall.pixels[0].c;
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, normalBall.pixels[0].r, 0, Math.PI * 2);
      ctx.fill();

      // 黑色五边形图案
      ctx.fillStyle = normalBall.pixels[1].c;
      ctx.beginPath();
      const patternX = this.ball.x - normalBall.pixels[1].w / 2 + normalBall.pixels[1].x + normalBall.pixels[1].w / 2;
      const patternY = this.ball.y - normalBall.pixels[1].h / 2 + normalBall.pixels[1].y + normalBall.pixels[1].h / 2;
      ctx.moveTo(patternX, patternY - 2);
      ctx.lineTo(patternX + 2, patternY + 1);
      ctx.lineTo(patternX - 2, patternY + 1);
      ctx.closePath();
      ctx.fill();

      // 球边框
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, GAME_CONFIG.BALL.RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _renderUI() {
    // 比分
    this.uiRenderer.drawScore(
      this.matchController.scoreA,
      this.matchController.scoreB
    );

    // 计时器
    this.uiRenderer.drawTimer(this.matchController.remainingTime);

    // 蓄力条
    this.uiRenderer.drawChargeBar(this.skillSystem.charge);

    // 当前控制球员
    this.uiRenderer.drawActivePlayerIndicator(
      this.activePlayerIndex,
      'A'
    );

    // 控制提示
    this.uiRenderer.drawControls();

    // 半场提示
    if (this.matchController.halfTime) {
      this.uiRenderer.drawPeriod('FIRST HALF');
    } else if (this.matchController.secondHalf) {
      this.uiRenderer.drawPeriod('SECOND HALF');
    }

    // 暂停消息
    if (this.matchController.isPaused()) {
      if (this.matchController.goalScored) {
        this.uiRenderer.drawMessage('GOAL!');
      } else if (this.matchController.halfTimeMessage) {
        this.uiRenderer.drawMessage('HALF TIME', 'Press SPACE to continue');
      } else if (this.matchController.fullTimeMessage) {
        this.uiRenderer.drawMessage('FULL TIME', `${this.matchController.scoreA} - ${this.matchController.scoreB}`);
      }
    }
  }

  // 重置位置
  resetPositions() {
    const ballPos = this.field.getBallStartPosition();
    this.ball.x = ballPos.x;
    this.ball.y = ballPos.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.isHeld = false;
    this.ball.holder = null;
    this.ball.isFlame = false;

    // 重置球员位置
    const positions = {
      A: this.field.getStartingPositions('A'),
      B: this.field.getStartingPositions('B')
    };

    this.players.forEach((player, index) => {
      const teamPositions = positions[player.team];
      let posIndex;
      if (player.role === 'goalkeeper') posIndex = 0;
      else if (player.role === 'defender') posIndex = 1;
      else posIndex = 2;

      const pos = teamPositions[posIndex];
      player.resetPosition(pos.x, pos.y);
    });
  }

  // 获取某队所有球员
  getTeamPlayers(team) {
    return this.players.filter(p => p.team === team);
  }

  // 获取红队控制的球员
  getControlledPlayer() {
    return this._getActivePlayer();
  }
}
