# EdaDreams v2+ Implementation Plan

> 从 v1（线性证据投递）到 v2+（主动探索调查）的完整实施计划。
> 技术栈：Svelte 5 + TypeScript + Vite（现有）。
> 目标：完整可玩的 Case 00 + Case 01 原型（v3 叙事：刘哲人头 → 反转 → 林奕辰真犯）。

---

## 一、变更总结：v1 → v2+

### 保留不动的系统

| 系统 | 原因 |
|------|------|
| Boot 序列（Case 00 B0–B8） | 设计文档明确"Case 00 完全不受影响" |
| 窗口框架（TitleBar/MenuBar/Toolbar/StatusBar） | 不变 |
| Context 面板（拖拽、百分比、block 管理） | 不变 |
| 推理按钮 UI + 输出面板 | 不变（引擎逻辑改，UI 不变） |
| 命令行系统 | 不变 |
| 能力指示灯 | 不变（Case 01 只有 CTX 亮） |

### 需要重构的系统

| 系统 | v1 行为 | v2+ 行为 | 改动量 |
|------|---------|---------|--------|
| **推理引擎** | 关键词匹配 → A/B/C 级 → 触发词解锁下一文件 | 14 阶段匹配 → 分析+方向建议 → 不解锁任何东西 | **大改** |
| **证据管理** | 推理触发自动投递到侧边栏 | 不投递；证据来自工具/电话/数据库 | **大改** |
| **侧边栏** | 显示"证据材料"列表，逐步点亮 | 显示备忘区 + 已发现的证据 + 工具入口 | **中改** |
| **数据层（case01）** | 硬编码 12 步配置 | 从 JSON 文件加载（5 个 JSON） | **重写** |
| **GameplayLayout** | 纯三栏文档阅读 | 三栏 + 浏览器模拟/电话/数据库交替 | **大改** |

### 需要新建的系统

| 系统 | 说明 | 复杂度 |
|------|------|--------|
| **浏览器模拟** | 地址栏 + 打开"网页"tab（WHOIS/工商/号码查询/IP查询） | 高 |
| **电话系统** | 拨号界面 + 文字化通话 + 陆明远关键词匹配对话树 | 高 |
| **搜索引擎** | 17+ 条预设结果，模糊匹配，含噪音 | 中 |
| **数据库终端** | 银行系统 + 通信记录系统，结构化查询界面 | 中 |
| **状态机** | 7 把锁，有硬依赖链，控制工具/数据解锁 | 中 |
| **取证结果包** | 手机取证解锁后一次性推送 4 个文件 | 低 |
| **结案流程** | 最终推理 → 完整报告 → CASE CLOSED | 低 |

---

## 二、实施阶段

### Phase 1：数据层重构（基础设施）

**目标：** 把 v2+ 的所有数据从 JSON 文件加载到 TypeScript 类型系统中，替换掉旧的硬编码 case01 配置。

#### 1.1 定义 v2+ 类型系统

```
src/lib/engine/types-v2.ts (新文件)
```

新增类型：
- `LockState` — 锁的当前状态 + 解锁条件
- `SearchResult` — 搜索结果条目
- `ToolQuery` — 工具的输入→输出映射
- `DialogEntry` — 陆明远对话树条目
- `InferenceStage` — 推理阶段（14 个 stage）
- `EvidenceSource` — 证据来源（briefing/tool/phone/forensics）
- `PhoneCallState` — 电话通话状态

#### 1.2 数据加载器

```
src/lib/data/loaders.ts (新文件)
```

从 `public/data/` 加载 JSON：
- `state_machine.json` → 7 把锁的配置
- `tools_query_map.json` → 工具查询映射
- `search_engine.json` — 搜索引擎结果
- `lu_mingyuan_dialog.json` — 对话树
- `inference_map.json` — 推理阶段配置（Case 01）
- `case00_inference_map.json` — Case 00 推理配置

JSON 文件放到 `public/data/` 下，运行时 fetch 加载（不用 import，保持数据与代码分离）。

#### 1.3 清理旧数据

- 移除 `src/lib/data/case01.ts` 中旧的 12 步硬编码
- 保留 `src/lib/data/case00.ts`（Case 00 不变）
- 保留 `src/lib/data/boot.ts`（Boot 序列不变）

**交付物：**
- [ ] `types-v2.ts` 完整类型定义
- [ ] JSON 文件复制到 `public/data/`
- [ ] 数据加载器 + 类型安全访问
- [ ] 旧 case01 数据清理
- [ ] 测试：数据加载 + 类型检查

---

### Phase 2：状态机 + 证据管理重构

**目标：** 实现 7 把锁的状态机，重构证据管理从"自动投递"到"工具驱动"。

#### 2.1 状态机

```
src/lib/state/state-machine.svelte.ts (新文件)
```

功能：
- 7 个锁的初始状态（全部 locked）
- 解锁条件检查（打电话 + 关键词匹配 + 前置依赖）
- `tryUnlock(lockId, context)` → 检查前置 → 成功/拒绝
- 硬依赖链：`vps_records` → `phone_forensics` → `resident_info`
- 取证解锁后一次性解锁 4 个文件

#### 2.2 证据管理重构

```
src/lib/state/evidence.svelte.ts (重构)
```

变更：
- 不再由推理引擎触发解锁
- 证据来源改为：
  - **工具查询返回** — WHOIS/工商/号码/银行/通信/警察
  - **电话解锁** — 陆明远调取的邮箱信息、VPS 记录、取证结果、住户信息
  - **取证包裹** — 手机取证后一次性获得 4 个文件
  - **Briefing 附件** — 钓鱼邮件样本（唯一主动投递）
- 新增证据元数据：来源工具、解锁条件、是否已读

#### 2.3 备忘系统

```
src/lib/state/memo.svelte.ts (新文件)
```

- `handover_note.txt` 作为系统备忘，在侧边栏备忘区可查看
- 提供工具网址线索（WHOIS/工商/号码查询）

**交付物：**
- [ ] 状态机实现 + 7 把锁 + 硬依赖链
- [ ] 证据管理重构（来源改为工具/电话）
- [ ] 备忘系统
- [ ] 测试：解锁链 + 前置依赖拒绝

---

### Phase 3：推理引擎重构

**目标：** 从 A/B/C 级 + 触发词 → 14 阶段匹配 + 三档提示系统。不再解锁任何东西。

#### 3.1 新推理引擎

```
src/lib/engine/inference-v2.ts (新文件)
```

核心逻辑：
1. 扫描 context 中所有 block 文本
2. 检查 14 个 stage 的 `required_keywords` + `absent_keywords`
3. 找到命中最多的 stage → 生成该 stage 的输出
4. 输出 = `output_analysis` + `hints_by_attempt`（根据同一 context 推理次数选择档位）
5. `stage_final` 特殊处理：需要至少 4 组关键词命中 → 完整报告 → 触发结案

变更点：
- **不再有 triggerWords 和 triggeredUnlock**
- **不再有 grade（A/B/C）**
- **新增 hint 计数器**：同一 context 反复推理时累加，context 变化时重置
- **Case 00 推理**保持旧逻辑（用 `case00_inference_map.json`），不受影响

#### 3.2 清理旧引擎

- 保留 `inference.ts` 用于 Case 00
- 新增 `inference-v2.ts` 用于 Case 01
- 或：统一引擎，Case 00 用 stage_0 配置，Case 01 用 stage 1-14 + stage_final

**交付物：**
- [ ] 14 阶段推理引擎
- [ ] 三档提示系统
- [ ] Case 00 兼容（保持旧行为）
- [ ] 最终报告生成
- [ ] 测试：各阶段匹配 + 提示递增

---

### Phase 4：浏览器模拟

**目标：** 在中间阅读区实现浏览器模拟——地址栏 + 打开网页 tab + 工具查询界面。

#### 4.1 浏览器组件

```
src/components/browser/BrowserTab.svelte (新)
src/components/browser/AddressBar.svelte (新)
src/components/browser/SearchEngine.svelte (新)
src/components/browser/WhoisTool.svelte (新)
src/components/browser/GsxtTool.svelte (新)
src/components/browser/NumqueryTool.svelte (新)
src/components/browser/IpLookupTool.svelte (新)
src/components/browser/BankTerminal.svelte (新)
src/components/browser/TelecomTerminal.svelte (新)
```

#### 4.2 交互流程

1. **侧边栏"网页检索"入口** → 点击 → 中间区打开浏览器 tab
2. **地址栏**：输入 URL → 如果匹配已知工具（whois.cnnic-query.cn 等）→ 渲染对应工具界面
3. **搜索引擎**：输入搜索词 → 模糊匹配 `search_engine.json` → 渲染结果列表
4. **搜索结果**：点击 `clickable: true` 的结果 → 打开对应工具页面
5. **工具页面**：
   - WHOIS：输入域名 → 返回注册信息（文本块可拖拽到 context）
   - 工商：输入企业名/法人 → 返回搜索结果列表 → 点击查看详情
   - 号码查询：输入号码 → 返回归属信息
   - IP 查询：输入 IP → 返回归属信息
   - 银行系统：需要先解锁 → 下拉选查询类型 + 输入条件 → 返回结果
   - 通信记录：需要先解锁 → 输入号码 → 返回通信数据
6. **工具查询返回的结果文本可拖拽到 context**

#### 4.3 搜索引擎实现

```
src/lib/engine/search.ts (新)
```

- 模糊匹配：玩家输入文本 → 检查每条结果的 `match` 数组
- 多条同时命中 → 混合排序（useful 在前，noise 在后）
- 未匹配 → 返回 0-2 条通用噪音
- 结果文本可选中拖拽

**交付物：**
- [ ] 浏览器 tab + 地址栏
- [ ] 搜索引擎（17+ 条预设 + 噪音）
- [ ] WHOIS 工具页面
- [ ] 工商查询工具页面
- [ ] 号码查询工具页面
- [ ] IP 查询工具页面
- [ ] 银行终端（需解锁）
- [ ] 通信记录终端（需解锁）
- [ ] 搜索结果可拖拽到 context
- [ ] 测试：搜索匹配 + 工具查询映射

---

### Phase 5：电话系统

**目标：** 实现拨号界面 + 文字化通话 + 陆明远关键词匹配对话。

#### 5.1 电话组件

```
src/components/phone/PhoneDialer.svelte (新)
src/components/phone/PhoneCall.svelte (新)
src/components/phone/DialogBubble.svelte (新)
```

#### 5.2 对话引擎

```
src/lib/engine/dialog.ts (新)
```

- 玩家打字输入 → 关键词匹配 `lu_mingyuan_dialog.json`
- 按 priority 排序，取最高
- 前置检查：`prerequisite_check`（如 `vps_records` 是否已解锁）
- 未满足前置 → 返回拒绝回复
- 满足前置 → 返回确认 + 触发解锁
- 延迟回复：1-3 秒（普通）/ 5-12 秒（调取操作）
- 部分对话需要玩家先解释理由（如 189 号码调取）

#### 5.3 交互流程

1. 侧边栏"通话"入口（或其他入口方式）→ 打开电话 tab
2. 输入号码 → 拨打
3. 只有 0755-8800-1234 能接通（陆明远）
4. 其他号码 → "无法接通"或"号码不存在"
5. 接通后 → 文字对话界面
6. 陆明远回复后 → 可能触发解锁（银行系统/通信记录/邮箱信息/VPS记录/取证/住户信息）

**交付物：**
- [ ] 电话拨号界面
- [ ] 对话界面（文字气泡）
- [ ] 陆明远对话引擎（关键词匹配 + 前置检查）
- [ ] 解锁触发
- [ ] 测试：各对话场景 + 前置拒绝

---

### Phase 6：侧边栏重构

**目标：** 侧边栏从"纯证据列表"变为"导航 + 备忘 + 证据 + 工具入口"。

#### 6.1 新侧边栏结构

```
工作台
├── 案件概览（briefing）
├── 证据材料（从工具/电话获得的结果）
│   ├── briefing_001.eml
│   ├── phishing_sample.eml（附件）
│   ├── handover_note.txt（备忘）
│   └── ...（随调查进展逐步出现）
├── 笔记（暂不实现）
├── 线索图谱（暂不实现）
工具
├── 网页检索（点击打开浏览器 tab）
├── 通话（点击打开电话 tab）
├── 银行系统🔒（解锁后变为可用）
└── 通信记录🔒（解锁后变为可用）
系统
├── 身份信息
├── 能力授权
└── 设置
```

#### 6.2 证据条目行为

- 工具查询返回 → 自动添加到"证据材料"
- 电话解锁 → 添加到"证据材料"
- 取证包裹 → 一次性添加 4 个条目
- 点击 → 中间阅读区打开 tab（现有行为不变）

**交付物：**
- [ ] 新侧边栏结构
- [ ] 工具入口（网页检索、通话）
- [ ] 备忘区（handover_note）
- [ ] 动态证据列表
- [ ] 🔒 锁定/解锁状态显示

---

### Phase 7：GameplayLayout 重构 + 集成

**目标：** 把所有新系统整合到 GameplayLayout，替换旧的纯文档阅读模式。

#### 7.1 中间区域 Tab 类型扩展

现有：只有文档 tab（EvidenceFile）
新增：
- 浏览器 tab（搜索引擎 + 工具页面）
- 电话 tab（拨号 + 对话）
- 文档 tab（证据/备忘）— 保持不变

中间阅读区根据 tab 类型渲染不同组件。

#### 7.2 拖拽统一

所有 tab 类型中显示的文本都应该可以选中拖拽到 context：
- 文档中的文本（现有）
- 工具查询结果文本（新增）
- 搜索结果文本（新增）
- 电话对话记录文本（新增）

#### 7.3 Game 状态扩展

```typescript
// game.svelte.ts 扩展
phase: 'boot' | 'briefing' | 'gameplay' | 'case_closed'
casePhase: 'phase0_discovery' | 'phase1_domain' | 'phase2_email' | ... | 'phase_final'
```

不需要严格跟踪 casePhase——v2+ 是非线性的，让玩家自由探索。状态机的锁已经控制了哪些可以做。

**交付物：**
- [ ] GameplayLayout 支持 3 种 tab 类型
- [ ] 拖拽从所有 tab 类型可用
- [ ] 整合侧边栏 + 浏览器 + 电话 + 文档
- [ ] 状态机驱动 UI 状态

---

### Phase 8：结案流程 + 最终打磨

**目标：** 实现完整结案流程（最终推理 → 报告 → CASE CLOSED），打磨细节。

#### 8.1 最终报告

- `stage_final` 推理：需要 4+ 组关键词命中
- 完整报告模板从 `inference_templates/final_report.txt` 加载
- 不完整时缺失部分标 `[信息不足]`
- 完整报告 → 触发结案

#### 8.2 结案流程

- 推理生成完整报告 → 侧边栏出现 `final_report.rpt`
- 状态栏滚动：`case_001: CLOSED`
- 无庆祝、无弹窗——安静归档
- 游戏回到安静等待状态

#### 8.3 Case 00 兼容性验证

确保 Case 00 Boot → B5 Briefing → B6 推理 → B7 接受 → B8 过渡到 Case 01 全流程不受影响。

#### 8.4 打磨

- 搜索引擎噪音结果的真实感
- 陆明远回复延迟和语气
- 工具页面的桌面 app 质感
- 侧边栏 badge 动画
- 状态栏日志

**交付物：**
- [ ] 最终报告生成
- [ ] 结案流程
- [ ] Case 00 → Case 01 完整流程测试
- [ ] 打磨细节

---

## 三、文件清单

### 新增文件

```
src/lib/engine/types-v2.ts          — v2+ 类型定义
src/lib/engine/inference-v2.ts      — 14 阶段推理引擎
src/lib/engine/search.ts            — 搜索引擎匹配
src/lib/engine/dialog.ts            — 陆明远对话引擎
src/lib/state/state-machine.svelte.ts — 7 把锁状态机
src/lib/state/memo.svelte.ts        — 备忘系统

src/components/browser/BrowserTab.svelte    — 浏览器容器
src/components/browser/AddressBar.svelte    — 地址栏
src/components/browser/SearchEngine.svelte  — 搜索引擎页面
src/components/browser/WhoisTool.svelte     — WHOIS 查询页面
src/components/browser/GsxtTool.svelte      — 工商查询页面
src/components/browser/NumqueryTool.svelte  — 号码查询页面
src/components/browser/IpLookupTool.svelte  — IP 查询页面
src/components/browser/BankTerminal.svelte  — 银行系统终端
src/components/browser/TelecomTerminal.svelte — 通信记录终端

src/components/phone/PhoneDialer.svelte     — 拨号界面
src/components/phone/PhoneCall.svelte       — 通话界面
src/components/phone/DialogBubble.svelte    — 对话气泡

public/data/state_machine.json        — 从 prototype/ 复制
public/data/tools_query_map.json      — 从 prototype/ 复制
public/data/search_engine.json        — 从 prototype/ 复制
public/data/lu_mingyuan_dialog.json   — 从 prototype/ 复制
public/data/inference_map.json        — 从 prototype/ 复制（Case 01）
public/data/case00_inference_map.json — 从 prototype/ 复制（Case 00）

public/data/content/case01/*.txt      — 从 prototype/content/case01/ 复制
public/data/content/case01/inference_templates/*.txt — 推理输出模板
```

### 修改文件

```
src/lib/state/evidence.svelte.ts      — 重构：来源改为工具/电话
src/lib/state/game.svelte.ts          — 扩展：支持新阶段
src/lib/data/case01.ts                — 重写或废弃
src/scenes/GameplayLayout.svelte      — 大改：支持多 tab 类型
src/components/sidebar/Sidebar.svelte — 重构：新结构
src/components/sidebar/EvidenceList.svelte — 适配新证据来源
src/components/inference/InferencePanel.svelte — 适配新推理引擎
```

### 不动文件

```
src/scenes/BootScene.svelte           — Case 00 不变
src/components/boot/*                 — Boot 组件不变
src/components/shell/*                — 窗口框架不变
src/components/reader/DocumentViewer.svelte — 文档渲染不变
src/components/inference/ContextBlock.svelte — Context block 不变
src/components/inference/CapacityBar.svelte — 容量条不变
src/components/common/CapabilityLights.svelte — 能力灯不变
src/components/common/CommandLine.svelte — 命令行不变
src/lib/state/context.svelte.ts       — Context 状态不变
src/lib/state/command.svelte.ts       — 命令行状态不变
src/lib/engine/keywords.ts            — Case 00 关键词不变
src/lib/engine/capacity.ts            — 容量计算不变
```

---

## 四、优先级和依赖

```
Phase 1 (数据层) ← 无依赖，先做
    ↓
Phase 2 (状态机) ← 依赖 Phase 1 的类型和数据
    ↓
Phase 3 (推理引擎) ← 依赖 Phase 1 的类型
    ↓
Phase 4 (浏览器) ← 依赖 Phase 1 (数据) + Phase 2 (锁状态)
Phase 5 (电话) ← 依赖 Phase 1 (数据) + Phase 2 (锁状态)
    ↓  (Phase 4, 5 可并行)
Phase 6 (侧边栏) ← 依赖 Phase 2, 4, 5
    ↓
Phase 7 (集成) ← 依赖 Phase 2-6
    ↓
Phase 8 (结案) ← 依赖 Phase 7
```

**可并行的阶段：** Phase 3 和 Phase 4/5 可以并行开发（推理引擎和浏览器/电话互相不依赖）。

---

## 五、测试策略

每个 Phase 都要求：
1. **单元测试** — 纯逻辑（搜索引擎匹配、对话引擎、状态机、推理阶段匹配）
2. **组件测试** — Svelte 组件渲染（工具页面、电话界面）
3. **集成测试** — 端到端流程（搜索→打开工具→查询→结果→拖拽→推理→解锁）
4. **手动验证** — 完整游戏流程从 Boot → Case 01 结案

关键测试场景：
- 搜索"东海银行 陆明远"→ 找到电话号码 → 拨打 → 对话
- 打电话申请银行权限 → 银行系统解锁 → 查客户名单 → 发现刘哲
- 不拿 VPS 证据就要求取证 → 陆明远拒绝
- 拿到 VPS 双 IP → 再要求取证 → 陆明远同意 → 4 个文件一次性出现
- 最终推理 → 完整报告 → CASE CLOSED

---

## 六、预计工作量

| Phase | 说明 | 预计子任务 |
|-------|------|-----------|
| Phase 1 | 数据层重构 | 4 |
| Phase 2 | 状态机 + 证据 | 3 |
| Phase 3 | 推理引擎 | 3 |
| Phase 4 | 浏览器模拟 | 8 |
| Phase 5 | 电话系统 | 4 |
| Phase 6 | 侧边栏 | 3 |
| Phase 7 | 集成 | 3 |
| Phase 8 | 结案 + 打磨 | 3 |
| **总计** | | **~31 个子任务** |

---

## 七、风险和注意事项

1. **Svelte 5 Runes 兼容性** — 确保新组件使用 `$state`/`$derived`/`$effect`，不用旧 store API
2. **数据文件路径** — `public/data/` 下的文件运行时 fetch，Vite 开发服务器直接提供
3. **拖拽跨组件** — 浏览器/电话中的文本拖到 context 需要统一的拖拽协议
4. **推理引擎兼容** — Case 00 用旧引擎，Case 01 用新引擎，需要在 GameplayLayout 中切换
5. **状态持久化** — 目前无存档，页面刷新会丢失进度。可接受（P2 才做存档）
6. **content 文件编码** — 所有文本文件 UTF-8，fetch 后直接使用
