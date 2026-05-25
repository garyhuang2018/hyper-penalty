// 音效系统 - 使用 Web Audio API 生成合成音效
export class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  _initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 恢复上下文（用户交互后才能播放）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // 射门音 - 短促有力的振荡声
  playShoot() {
    if (!this.enabled) return;
    this._initAudioContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 创建振荡器
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  // 进球音 - 频率上升的欢呼音效
  playGoal() {
    if (!this.enabled) return;
    this._initAudioContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 创建多个振荡器模拟欢呼声
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sawtooth';
      const startFreq = 400 + i * 100;
      oscillator.frequency.setValueAtTime(startFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(startFreq * 2, now + 0.3);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.setValueAtTime(0.15, now + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now + i * 0.05);
      oscillator.stop(now + 0.5);
    }
  }

  // 蓄力音（可选）- 逐渐上升的音调
  playCharge() {
    if (!this.enabled) return;
    this._initAudioContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // 切换球员音效
  playSwitch() {
    if (!this.enabled) return;
    this._initAudioContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// 全局音效系统实例
export const soundSystem = new SoundSystem();