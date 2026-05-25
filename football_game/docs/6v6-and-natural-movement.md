# 热血足球 - 6v6改造 + 自然移动

## 问题1: 人数增加到6v6

### 当前阵型 (3v3)
```
红队(A):                    蓝队(B):
    [守门员]                    [守门员]
    [后卫]                      [后卫]
    [前锋]                      [前锋]
```

### 目标阵型 (6v6)
```
红队(A): 1-2-2-1           蓝队(B): 1-2-2-1
    [守门员] GK                  [守门员] GK
    [后卫1] CB1    [后卫2] CB2  [后卫1] CB1    [后卫2] CB2
    [中场1] CM1  [中场2] CM2     [中场1] CM1  [中场2] CM2
    [前锋] ST                      [前锋] ST
```

### 位置定义
| 角色 | 缩写 | 职责 |
|------|------|------|
| goalkeeper | GK | 守门 |
| defender | CB | 边后卫 |
| midfielder | CM | 中场 |
| striker | ST | 前锋 |

### Field.js 修改
```javascript
getStartingPositions(team) {
  if (team === 'A') {
    return [
      { x: 50, y: center.y, role: 'goalkeeper' },
      { x: 150, y: center.y - 80, role: 'defender' },
      { x: 150, y: center.y + 80, role: 'defender' },
      { x: 280, y: center.y - 100, role: 'midfielder' },
      { x: 280, y: center.y + 100, role: 'midfielder' },
      { x: 380, y: center.y, role: 'striker' },
    ];
  }
  // 蓝队镜像...
}
```

---

## 问题2: AI移动不自然（只会走直线）

### 当前问题
- AI直接朝目标点直线移动
- 没有平滑转向
- 没有弧线带球

### 改进方案

#### 1. 平滑转向 (Smooth Turning)
```
当前: direction = atan2(target - current)
改进: direction += (target_direction - direction) * turn_rate
```

#### 2. 带球弧线 (Dribble Arc)
- 带球时不是直线，而是轻微左右摆动
- 每隔一段时间加一个小的垂直偏移

#### 3. 速度变化 (Speed Variation)
- 奔跑时有轻微速度变化（模拟体力）
- 带球时比无球稍慢

#### 4. 转身延迟 (Turn Delay)
- 急停后不能立即变向
- 需要一个小硬直

### 实现代码
```javascript
// Player.js
class Player {
  turnSpeed = 0.1;  // 转向速度 (0-1)
  targetDirection = 0;
  dribbleOffset = 0;
  dribblePhase = 0;

  move(dx, dy) {
    // 计算目标方向
    const targetDir = Math.atan2(dy, dx);

    // 平滑转向
    let angleDiff = targetDir - this.direction;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.direction += angleDiff * this.turnSpeed;

    // 带球弧线
    if (this.ball && this.ball.holder === this) {
      this.dribblePhase += 0.1;
      this.dribbleOffset = Math.sin(this.dribblePhase) * 10;
    }

    // 移动
    const moveX = Math.cos(this.direction);
    const moveY = Math.sin(this.direction);
    // 应用 dribbleOffset...
  }
}
```

---

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `Field.js` | 阵型从3人改为6人 |
| `Player.js` | 添加平滑转向、带球弧线 |
| `AIController.js` | AI行为调整适配6人 |
| `MatchScene.js` | 玩家控制切换（Q/E循环6人）|
| `game.config.js` | 场地尺寸可能需调整 |

---

## 验收标准

1. 每队6名球员（1守门员+2后卫+2中场+1前锋）
2. AI移动有弧线，不是直线
3. 带球时有左右摆动
4. 转向平滑，不是瞬间转向
