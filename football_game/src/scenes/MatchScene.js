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
import { soundSystem } from '../systems/SoundSystem.js';
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

    // AB连按追踪（用于守门员无敌扑救）
    this._abPressTimes = [];
    this._abWindow = 500; // 500ms内连按触发无敌扑救

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

    // 加速（按住 Shift）
    this.inputManager.onKeyDown(KEYS.SHIFT, () => this._startAccelerate());
    this.inputManager.onKeyUp(KEYS.SHIFT, () => this._stopAccelerate());

    // 传球(带球)/铲球(无球) - J键
    this.inputManager.onKeyDown(KEYS.J, () => this._handleJ());

    // 射门(带球)/撞人(无球) - K键
    this.inputManager.onKeyDown(KEYS.K, () => this._handleK());

    // AB连按检测（守门员无敌扑救）
    this.inputManager.onKeyDown(KEYS.A, () => this._handleAB());
    this.inputManager.onKeyDown(KEYS.W, () => this._handleAB());

    // 跳起/挑球 - Space
    this.inputManager.onKeyDown(KEYS.SPACE, () => this._handleJump());

    // 换人
    this.inputManager.onKeyDown(KEYS.Q, () => this._switchPlayer(-1));
    this.inputManager.onKeyDown(KEYS.E, () => this._switchPlayer(1));
  }

  _startAccelerate() {
    const player = this._getActivePlayer();
    if (player) {
      player.isAccelerating = true;
    }
  }

  _stopAccelerate() {
    const player = this._getActivePlayer();
    if (player) {
      player.isAccelerating = false;
    }
  }

  _handleJ() {
    if (this.matchController.isPaused()) return;
    const player = this._getActivePlayer();
    if (!player) return;

    if (this.ball.holder === player) {
      // 带球时传球
      this._pass(player);
    } else {
      // 无球时铲球
      this._tackle(player);
    }
  }

  _handleK() {
    if (this.matchController.isPaused()) return;
    const player = this._getActivePlayer();
    if (!player) return;

    // 守门员扑救
    if (player.role === 'goalkeeper') {
      this._goalkeeperSave(player);
      return;
    }

    if (this.ball.holder === player) {
      // 带球跳起+射门 = 必杀技高跳射门
      if (player.isJumping) {
        this._shoot(player);
      } else {
        // 带球时射门
        this._shoot(player);
      }
    } else {
      // 无球时：奔跑中按前+K = 头撞
      if (this._tryHeader(player)) {
        return;
      }
      // 否则撞人
      this._bump(player);
    }
  }

  // 尝试头撞（奔跑中面向方向且按前）
  _tryHeader(player) {
    if (player.state !== 'running') return false;

    // 检查是否按住了前方向（根据玩家朝向判断）
    const isPressingForward = true; // 简化：只要在跑动就认为面向前方

    if (isPressingForward && this._isBallNear(player)) {
      return this._header(player);
    }
    return false;
  }

  _handleJump() {
    if (this.matchController.isPaused()) return;
    const player = this._getActivePlayer();
    if (!player) return;

    if (this.ball.holder === player) {
      // 带球时挑球过顶
      this._loft(player);
    } else {
      // 无球时跳起
      player.jump();
    }
  }

  _pass(player) {
    // 找面向方向的队友传球
    const teammates = this.players.filter(p => p.team === player.team && p !== player);
    if (teammates.length === 0) return;

    // 简化：传给距离最近的队友
    let nearestTeammate = null;
    let nearestDist = Infinity;
    teammates.forEach(t => {
      const dist = Math.sqrt((t.x - player.x) ** 2 + (t.y - player.y) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestTeammate = t;
      }
    });

    if (nearestTeammate) {
      const angle = Math.atan2(nearestTeammate.y - player.y, nearestTeammate.x - player.x);
      const result = player.pass(angle);
      if (result) {
        this.ball.pass(result.power, result.angle);
        soundSystem.playPass();
      }
    }
  }

  _loft(player) {
    // 挑球过顶
    const result = player.pass();
    if (result) {
      this.ball.loft(result.power * 0.7, result.angle);
      soundSystem.playPass();
    }
  }

  _tackle(player) {
    player.tackle();
  }

  _bump(player) {
    if (player.bump()) {
      // 撞人逻辑由 PhysicsSystem 处理
    }
  }

  _move(dx, dy) {
    if (this.matchController.isPaused()) return;
    const activePlayer = this._getActivePlayer();
    if (activePlayer) {
      activePlayer.move(dx, dy);
    }
  }

  _shoot(player) {
    if (this.matchController.isPaused()) return;
    const activePlayer = player || this._getActivePlayer();
    if (activePlayer && this.ball.holder === activePlayer) {
      const result = this.skillSystem.release(activePlayer);
      if (result) {
        this.ball.shoot(result.power, result.angle, result.isFlame);
        this.matchController.onShoot();
        soundSystem.playShoot();
      }
    }
  }

  _switchPlayer(direction) {
    // 获取红队非守门员球员（玩家控制的队伍，排除守门员）
    const redPlayers = this.players.filter(p => p.team === 'A' && p.role !== 'goalkeeper');
    this.activePlayerIndex = (this.activePlayerIndex + direction + redPlayers.length) % redPlayers.length;
    eventBus.emit('playerSwitch', { index: this.activePlayerIndex });
    soundSystem.playSwitch();
  }

  _getActivePlayer() {
    const redPlayers = this.players.filter(p => p.team === 'A' && p.role !== 'goalkeeper');
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
    // 活跃玩家需要排除守门员后计算索引
    const redFieldPlayers = this.players.filter(p => p.team === 'A' && p.role !== 'goalkeeper');
    const isActive = player.team === 'A' && redFieldPlayers.indexOf(player) === this.activePlayerIndex;

    // 使用 Renderer 的 drawPlayer 方法绘制像素精灵
    this.renderer.drawPlayer(player);

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

    // 重置球员位置 - 根据角色查找对应位置
    const positions = {
      A: this.field.getStartingPositions('A'),
      B: this.field.getStartingPositions('B')
    };

    this.players.forEach((player, index) => {
      const teamPositions = positions[player.team];
      // 根据角色找到对应位置索引
      let posIndex = teamPositions.findIndex(p => p.role === player.role);
      // 如果找不到精确匹配（如defender有2个），使用第一个匹配的
      if (posIndex === -1) {
        if (player.role === 'goalkeeper') posIndex = 0;
        else if (player.role === 'defender') posIndex = 1;
        else if (player.role === 'midfielder') posIndex = 3;
        else if (player.role === 'striker') posIndex = 5;
      }
      const pos = teamPositions[posIndex];
      if (pos) {
        player.resetPosition(pos.x, pos.y);
      }
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

  // 守门员扑救
  // 连续AB无敌扑救
  _handleAB() {
    if (!this._isGoalkeeperState()) return;

    const now = Date.now();
    // 记录按键时间
    this._abPressTimes.push(now);

    // 清理超出窗口的记录
    this._abPressTimes = this._abPressTimes.filter(t => now - t < this._abWindow);

    // 500ms内连续按A+B超过2次触发无敌扑救
    if (this._abPressTimes.length >= 3) {
      this._handleGoalkeeperSave();
      this._abPressTimes = []; // 重置
    }
  }

  _handleGoalkeeperSave() {
    // 守门员状态下，连续按A+B触发无敌扑救
    // 成功率90%，无敌状态下全身发光
    if (!this._isGoalkeeperState()) return;

    this._goalkeeperInvincible = true;
    this._goalkeeperInvincibleTimer = 1000; // 无敌持续1秒

    // 90%成功率
    const success = Math.random() < 0.9;
    if (success) {
      this._goalkeeperSuperSave();
    }
  }

  _isGoalkeeperState() {
    const player = this._getActivePlayer();
    return player && player.role === 'goalkeeper';
  }

  _goalkeeperSuperSave() {
    // 无敌扑救：守门员全身发光，将球完全击飞
    const player = this._getActivePlayer();
    if (!player) return;

    // 临时标记发光效果
    player.isGlowing = true;
    setTimeout(() => { player.isGlowing = false; }, 500);

    // 检查是否能碰到球
    const ball = this.ball;
    const dist = Math.sqrt((ball.x - player.x) ** 2 + (ball.y - player.y) ** 2);

    if (dist < player.radius + ball.radius + 20) {
      // 超级扑救 - 球被击飞到远离球门的位置
      const punchPower = 20;
      // 球飞向边线
      const punchAngle = ball.y < player.y ? -Math.PI / 4 : Math.PI / 4;
      ball.shoot(punchPower, punchAngle, false);
      soundSystem.playShoot();
    }
  }

  _goalkeeperSave(player) {
    // 获取守门员面向方向
    const dirX = Math.cos(player.direction);
    const dirY = Math.sin(player.direction);
    this._goalkeeperDive(player, dirX, dirY);
  }

  _goalkeeperDive(player, dirX, dirY) {
    // 扑救移动距离
    const diveDistance = 30;
    const targetX = player.x + dirX * diveDistance;
    const targetY = player.y + dirY * diveDistance;

    // 临时移动守门员
    const originalX = player.x;
    const originalY = player.y;
    player.x = Math.max(player.minX, Math.min(player.maxX, targetX));
    player.y = Math.max(player.minY, Math.min(player.maxY, targetY));

    // 检查是否能碰到球
    const ball = this.ball;
    const dist = Math.sqrt((ball.x - player.x) ** 2 + (ball.y - player.y) ** 2);

    if (dist < player.radius + ball.radius + 10) {
      // 扑救成功 - 打飞球
      const punchPower = 15;
      const punchAngle = Math.atan2(dirY, dirX);
      ball.shoot(punchPower, punchAngle, false);
      soundSystem.playShoot();
    }

    // 恢复位置
    player.x = originalX;
    player.y = originalY;
  }

  // 头撞（奔跑中按前+K）
  _header(player) {
    if (player.state !== 'running') return false;
    if (!this._isBallNear(player)) return false;

    const ball = this.ball;
    // 带球时头球：释放球并向上击出
    if (ball.holder === player) {
      ball.release();
    }

    // 计算头球方向：朝向对方球门并向上
    const angle = Math.atan2(-0.5, player.direction > Math.PI / 2 || player.direction < -Math.PI / 2 ? -1 : 1);
    ball.loft(12, angle);

    // 撞到对方可能倒地
    const opponent = this._findNearestOpponent(player);
    if (opponent) {
      const dist = Math.sqrt((opponent.x - player.x) ** 2 + (opponent.y - player.y) ** 2);
      if (dist < player.radius + opponent.radius + 20) {
        if (Math.random() < 0.5) {
          opponent.knockDown();
        }
        if (Math.random() < 0.2) {
          player.knockDown();
        }
      }
    }

    return true;
  }

  _isBallNear(player) {
    return this.ball.distanceTo(player) < player.radius + this.ball.radius + 10;
  }

  _findNearestOpponent(player) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const p of this.players) {
      if (p.team === player.team) continue;
      const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = p;
      }
    }
    return nearest;
  }
}
