// 游戏常量配置
export const GAME_CONFIG = {
  // Canvas 设置
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // 场地设置
  FIELD: {
    WIDTH: 760,
    HEIGHT: 520,
    OFFSET_X: 20,
    OFFSET_Y: 40,
    COLOR: '#3a8c2a',      // 草地绿
    LINE_COLOR: '#ffffff',   // 白线
    LINE_WIDTH: 2,
  },

  // 球门设置
  GOAL: {
    WIDTH: 120,
    HEIGHT: 20,
    COLOR: '#ffffff',
  },

  // 球员设置
  PLAYER: {
    RADIUS: 16,
    SPEED: 4,
    COLOR_TEAM_A: '#e74c3c', // 红队
    COLOR_TEAM_B: '#3498db', // 蓝队
    SPRITE_SIZE: 32,
  },

  // 像素精灵图配置（简单生成式像素画）
  SPRITE: {
    // 球员身体尺寸
    BODY_SIZE: 12,
    LEG_SIZE: 8,
  },

  // 球设置
  BALL: {
    RADIUS: 8,
    FRICTION: 0.98,
    COLOR: '#ffffff',
    SPRITE_SIZE: 16,
    FLAME_COLOR: '#ff6600',
  },

  // 比赛设置
  MATCH: {
    HALF_DURATION: 120, // 秒
    GOAL_PAUSE_DURATION: 2000, // 毫秒
  },

  // 必杀技设置
  SKILL: {
    MAX_CHARGE: 100,
    CHARGE_RATE: 2,        // 每帧充能
    MIN_SHOOT_POWER: 8,
    MAX_SHOOT_POWER: 18,
    FLAME_THRESHOLD: 80,   // 火焰球阈值
  },

  // AI 设置
  AI: {
    THINK_INTERVAL: 500,   // AI 决策间隔 ms
    CHASE_SPEED: 3,
    ATTACK_SPEED: 3.5,
  },
};
