// 游戏主入口
import { GameLoop } from './core/GameLoop.js';
import { MatchScene } from './scenes/MatchScene.js';
import { eventBus } from './core/EventBus.js';
import { GAME_CONFIG } from './config/game.config.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('Canvas element not found!');
      return;
    }

    // 初始化场景
    this.matchScene = new MatchScene(this.canvas);

    // 初始化游戏循环
    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );

    // 启动游戏
    this._start();
  }

  _start() {
    // 显示开始提示
    this._showStartScreen();

    // 监听任意键开始
    const startHandler = () => {
      document.removeEventListener('keydown', startHandler);
      const overlay = document.getElementById('startOverlay');
      if (overlay) overlay.style.display = 'none';
      this.matchScene.matchController.paused = false;
      this.gameLoop.start();
    };

    setTimeout(() => {
      document.addEventListener('keydown', startHandler);
    }, 100);
  }

  _showStartScreen() {
    // 在渲染前显示提示
    console.log('=== 热血足球 ===');
    console.log('按任意键开始比赛');
    console.log('操作说明:');
    console.log('  方向键/WASD: 移动');
    console.log('  空格(按住蓄力,松开射门): 射门');
    console.log('  Q/E: 切换控制球员');
  }

  update(deltaTime) {
    this.matchScene.update(deltaTime);
  }

  render() {
    this.matchScene.render();
  }
}

// 页面加载后启动游戏
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
