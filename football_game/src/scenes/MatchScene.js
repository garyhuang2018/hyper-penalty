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

    // 球员圆形
    ctx.fillStyle = player.getColor();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // 球员边框
    ctx.strokeStyle = player.state === 'knocked_down' ? '#888' : '#fff';
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.stroke();

    // 当前控制球员标记
    if (isActive) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 方向指示器
    if (player.state === 'running' || player.state === 'idle') {
      const indicatorX = player.x + Math.cos(player.direction) * (player.radius + 5);
      const indicatorY = player.y + Math.sin(player.direction) * (player.radius + 5);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 倒地状态
    if (player.state === 'knocked_down' || player.state === 'getting_up') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(player.x, player.y + player.radius / 2, player.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderBall() {
    const ctx = this.renderer.ctx;

    // 火焰效果
    if (this.ball.isFlame) {
      ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 球本体
    ctx.fillStyle = GAME_CONFIG.BALL.COLOR;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
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
