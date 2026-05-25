# 热血足球 - 技术规格说明

## 概述
基于 HTML5 Canvas + 原生 JavaScript 的俯视角足球游戏，复刻热血足球的核心体验。

## 技术栈
- **渲染**: HTML5 Canvas 2D API
- **语言**: 原生 JavaScript (ES6+)
- **帧率**: 60 FPS (固定时间步长)
- **依赖**: 零外部依赖

## 项目结构
```
football-game/
├── index.html              # 入口 HTML
├── src/
│   ├── main.js            # 游戏入口
│   ├── config/game.config.js
│   ├── core/
│   │   ├── GameLoop.js
│   │   ├── InputManager.js
│   │   └── EventBus.js
│   ├── entities/
│   │   ├── Ball.js
│   │   ├── Player.js
│   │   ├── Goal.js
│   │   └── Field.js
│   ├── systems/
│   │   ├── PhysicsSystem.js
│   │   ├── AIController.js
│   │   ├── MatchController.js
│   │   └── SkillSystem.js
│   ├── render/
│   │   ├── Renderer.js
│   │   └── UIRenderer.js
│   └── scenes/
│       └── MatchScene.js
└── SPEC.md
```

## 核心系统

### 1. 游戏循环 (GameLoop)
- 固定时间步长: 16.67ms (60 FPS)
- 使用 `requestAnimationFrame`
- 分离 update 和 render 逻辑

### 2. 输入管理 (InputManager)
- 监听 `keydown` / `keyup` 事件
- 维护按键状态对象
- 支持按键按下/松开回调

### 3. 事件总线 (EventBus)
- 模块间通信
- 支持 `on` / `off` / `emit`

### 4. 球员 (Player)
- **状态**: idle | running | tackling | shooting | knocked_down | getting_up
- **属性**: speed, power, technique
- **队伍**: A (红队) / B (蓝队)
- **角色**: goalkeeper / defender / forward

### 5. 球 (Ball)
- **状态**: free | held | shooting
- **特效**: 火焰球 (isFlame)
- **物理**: 摩擦力、弹跳、速度衰减

### 6. 必杀技系统 (SkillSystem)
- 按住空格蓄力
- 蓄力条: 0-100
- 火焰球阈值: 80
- 满蓄力射门球带火焰特效，守门员无法扑救

### 7. AI 系统 (AIController)
- 简单状态机
- 守门员: 坚守球门
- 后卫: 追球、解围
- 前锋: 追球、进攻、射门

### 8. 比赛控制器 (MatchController)
- 比分追踪
- 计时器 (2分钟半场)
- 进球检测和暂停
- 半场/全场管理

### 9. 物理系统 (PhysicsSystem)
- 球员捡球 (自动控球)
- 球员间碰撞
- 铲球抢断

## 控件

| 按键 | 功能 |
|------|------|
| 方向键 / WASD | 移动球员 |
| 空格 (按住蓄力,松开射门) | 射门 |
| Q / E | 切换控制球员 |

## 游戏流程

1. **开始界面**: 显示标题和操作说明，按任意键开始
2. **上半场**: 2分钟，红队(玩家) vs 蓝队(AI)
3. **进球**: 暂停2秒，显示"GOAL!"，重置位置
4. **半场**: 显示"HALF TIME"，按空格继续
5. **下半场**: 2分钟，互换进攻方向
6. **结束**: 显示"FULL TIME"和最终比分

## 像素美术 (TODO)
- [ ] 球员精灵图 (各方向跑步/站立/射门/倒地)
- [ ] 球精灵图 (普通/火焰)
- [ ] 场地背景美术
- [ ] 音效 (射门/进球/欢呼)

## 验证清单

- [x] Canvas 显示足球场
- [x] 键盘控制球员移动
- [x] 球员自动捡球
- [x] 带球移动
- [x] 蓄力射门
- [x] 进球检测
- [x] AI 对手
- [x] 必杀技特效
- [x] 比赛计时
- [x] 半场/全场

## 运行方式

直接用浏览器打开 `index.html` 即可运行。
