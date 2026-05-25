// 键盘输入管理器
export class InputManager {
  constructor() {
    // 按键状态
    this.keys = {};
    // 按键按下时的回调
    this.keyDownCallbacks = {};
    // 按键松开时的回调
    this.keyUpCallbacks = {};

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      // 防止方向键和空格键滚动页面
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
      if (this.keyDownCallbacks[e.code]) {
        this.keyDownCallbacks[e.code].forEach(cb => cb());
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (this.keyUpCallbacks[e.code]) {
        this.keyUpCallbacks[e.code].forEach(cb => cb());
      }
    });
  }

  // 检查按键是否按下
  isKeyDown(keyCode) {
    return !!this.keys[keyCode];
  }

  // 注册按键按下回调
  onKeyDown(keyCode, callback) {
    if (!this.keyDownCallbacks[keyCode]) {
      this.keyDownCallbacks[keyCode] = [];
    }
    this.keyDownCallbacks[keyCode].push(callback);
  }

  // 注册按键松开回调
  onKeyUp(keyCode, callback) {
    if (!this.keyUpCallbacks[keyCode]) {
      this.keyUpCallbacks[keyCode] = [];
    }
    this.keyUpCallbacks[keyCode].push(callback);
  }

  // 清空输入状态
  reset() {
    this.keys = {};
  }
}

// 常用按键常量
export const KEYS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  W: 'KeyW',
  A: 'KeyA',
  S: 'KeyS',
  D: 'KeyD',
  SPACE: 'Space',
  ENTER: 'Enter',
  Q: 'KeyQ',  // 换人
  E: 'KeyE',  // 换人
  SHIFT: 'ShiftLeft',  // 加速
  J: 'KeyJ',  // 传球(带球)/铲球(无球)
  K: 'KeyK',  // 射门(带球)/撞人(无球)
};
