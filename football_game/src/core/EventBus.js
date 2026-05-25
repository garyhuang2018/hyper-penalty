// 简单事件总线 - 模块间通信
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  // 订阅事件
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 取消订阅
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  // 触发事件
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));
  }

  // 清空所有事件
  clear() {
    this.listeners.clear();
  }
}

// 全局事件总线实例
export const eventBus = new EventBus();
