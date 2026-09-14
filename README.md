# 时隙（Timeslit）MVP

一个可直接试玩的历史沉浸互动游戏 vertical slice。玩家从未来的时空导航终端进入约公元前 305 年的齐国临淄，通过预设或自由行动和符合时代身份边界的 NPC 互动，并可随时向隐匿的时空 AI 求助。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 目录结构

- `app/`：Next.js 页面入口、全局视觉样式与元数据
- `components/`：未来大厅、迁跃动画、历史场景和 AI 面板组件
- `data/`：与 UI 解耦的临淄世界资料、NPC 模板
- `game/`：初始玩家状态、行动解析及 mock AI 响应
- `types/`：游戏状态、NPC、叙事记录的 TypeScript 类型

## 系统说明

- 游戏阶段由 `GamePhase` 驱动：`lobby → traveling → world`。
- `PlayerState` 单独维护位置、时间、钱财、健康、可信度、怀疑度、背包与已知信息。
- 每次抵达会从 5 个模板随机生成一位 NPC；NPC 仅依据自己的知识范围回应。
- `game/engine.ts` 中的 `resolveFreeAction` 与 `askTemporalAi` 是 mock 推理边界。未来接入真实 AI API 时，可将它们替换为调用服务端 Route Handler 的异步函数，并把 `world`、`player`、`npc` 和对话历史作为结构化上下文传入。
