# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Hot Blood Football (热血足球) - a top-down HTML5 Canvas football game with no external dependencies, running at 60 FPS fixed timestep. Single-page app using ES6 modules via `script type="module"`.

## Running

**Must use HTTP server** - ES6 modules cannot be loaded via `file://` protocol due to CORS restrictions.

```bash
cd D:/13_develop/football_game
python -m http.server 8080
```
Then open: `http://localhost:8080`

**Do NOT** double-click `index.html` - it will fail with CORS/module errors.

## Architecture

### Game Loop
`src/core/GameLoop.js` - Fixed 60 FPS timestep with accumulator pattern. `update(deltaTime)` and `render()` are separated. `MatchScene.update()` orchestrates all systems in this order:
1. MatchController (timer, pause)
2. SkillSystem (charge accumulation)
3. Players (animation, knocked state)
4. Ball (friction, boundaries)
5. AI (decision making)
6. Physics (collisions, pickup, tackling)
7. Goal detection

### Scene Pattern
`MatchScene` is the central orchestrator owning all entities and systems. It handles input registration and render composition.

### Entity Classes
- `Player` - State machine (idle/running/tackling/shooting/knocked_down/getting_up), team A/B, role (goalkeeper/defender/forward), direction indicator
- `Ball` - States: free/held/shooting. `hold(player)` attaches ball; `shoot(power, angle, isFlame)` launches
- `Field` - Pure geometry, starting positions for both teams
- `Goal` - AABB check for ball

### System Classes
- `PhysicsSystem` - Manual collision (no physics engine): ball pickup radius, player overlap separation, tackling with 60% steal chance
- `AIController` - Think interval (500ms) + per-frame Act. State machine per AI player: chase_ball/guard_goal/defend_goal/support/attack
- `MatchController` - Score, 120s timer, half-time/full-time detection, goal-scored pause (2s)
- `SkillSystem` - Hold SPACE to charge (0-100, rate 2/frame), flame threshold at 80, power 8-18 based on charge

### EventBus
`src/core/EventBus.js` - Simple pub/sub for inter-module communication. Events: `playerSwitch`, `goal`, `playerShoot`.

### Input Flow
`InputManager` tracks key state. `MatchScene._registerInput()` maps keys to callbacks. Movement/shooting blocked when `matchController.isPaused()`.

## Key Coordinates

Field: OFFSET (20, 40), size 760x520. Team A (red) attacks right, Team B (blue) attacks left. Goal width 120, height 20.

## Controls

| Key | Action |
|-----|--------|
| Arrow/WASD | Move player |
| SPACE (hold) | Charge shot |
| SPACE (release) | Shoot |
| Q/E | Switch controlled player |

## Important Implementation Notes

- Flame ball visual effect (`ball.isFlame`) is drawn as orange/yellow glow layers - goalkeeper cannot currently save flame balls but this isn't enforced in code yet
- AI shoot decision: forward + holding ball + within 200 units of goal + 3% random chance per frame
- Goalkeeper movement is constrained to penalty area
- Tackling triggers `knockDown()` on both tackler and ball holder (60% success rate)
- When `matchController.isPaused()` returns true, all input-driven movement is blocked
