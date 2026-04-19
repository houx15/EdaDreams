# EdaDreams v2+ Gap Fix Plan

> 对标设计文档，修复实现差距，使 Case 01 完整可玩。
> 基于 2026-04-18 完整审计：逐条对比 flowchart_v3.md + narrative_v3.md +
> state_machine.json + lu_mingyuan_dialog.json + tools_query_map.json +
> inference_map.json + search_engine.json + ui_interaction_spec.md。

---

## 一、完整差距清单

### 类别 A — 核心机制断裂（游戏完全无法进行）

| # | 差距 | 设计文档来源 | 影响范围 |
|---|------|-------------|---------|
| A1 | **拖拽/文本选取→context 面板未实现** | ui_interaction_spec L108-129 | 核心机制 #1（Context Curation）完全不可用。玩家无法把任何文字放进推理引擎。 |

### 类别 B — 线索链断裂（游戏进行到一半死路）

| # | 差距 | 设计文档来源 | 影响范围 |
|---|------|-------------|---------|
| B1 | **搜索结果中 `key_clue` 不应显示给玩家** | search_engine.json 每条有 `key_clue` 字段，但这只是设计注释，不应渲染 | 破坏难度。玩家看到🔑图标就知道哪条有用 |
| B2 | **搜索结果 `useful` 标记不应有视觉区分** | 设计意图是 useful=false 只在内容上不同，不应有绿色边框 | 同上，破坏探索感 |
| B3 | **搜索"刘哲 深圳"的结果应为反转起点** | flowchart Phase 6, narrative 线索 A | 已有数据(liuzhe_meituan/liuzhe_douyin/liuzhe_noise)，但 BrowserFrame 搜索结果直接显示 key_clue |
| B4 | **搜索"林奕辰 武汉"的结果应为最终确认** | flowchart Phase 10 | 已有数据(linyichen_linkedin/linyichen_github)，可搜索 |
| B5 | **搜索"AutoAI"的结果应显示正常的 app 页面** | narrative 线索, search_engine autoai_appstore | 已有数据，但搜索结果不可点击进入详情页（只有 opens 字段的才能点击） |
| B6 | **Browser 地址栏无法导航到 bank/telecom 页面** | flowchart Phase 5（银行系统需先解锁） | 玩家获得银行系统地址后无法在地址栏输入跳转。当前只能通过侧边栏入口 |
| B7 | **GSXT 搜索结果不支持进入详情页** | tools_query_map gsxt.detail_page | 设计说点击目标公司名→打开详情页加载 06_company_registration.txt，代码只显示搜索结果列表 |
| B8 | **搜索结果的 page_content 未被搜索结果中 `clickable:false` 的条目使用** | search_engine 中多条有 page_content 但不是 clickable | 有内容的搜索结果无法查看 |

### 类别 C — 对话引擎差距

| # | 差距 | 设计文档来源 | 影响范围 |
|---|------|-------------|---------|
| C1 | **对话延迟未实现** | lu_mingyuan_dialog.json 各条目有 `response_delay_seconds` | 代码中固定 800ms，但设计要求邮箱调取 5s、通信记录 6s、VPS 7s、取证 10s、住户 12s |
| C2 | **对话两阶段回复未实现** | dialog 中多条有 `response_immediate` + `response_followup` | 设计要求陆明远先说"好，我帮你调"（立即），等 N 秒后再说"资料到了"（延迟）。当前只有单次回复 |
| C3 | **对话的前置条件检查逻辑不完整** | lu_mingyuan_dialog `prerequisite_check` / `hard_prerequisite` | dialog.ts 的 `processMessage` 可能未正确处理两阶段匹配（request_phone_forensics_no_evidence vs request_phone_forensics_with_evidence） |
| C4 | **陈芳通信记录（189号）需要玩家提供理由** | lu_mingyuan_dialog request_telecom_189 `player_must_justify` | 陆明远应该追问"这个号码是谁的？你为什么要查？"，然后玩家解释后才同意。当前可能直接解锁 |
| C5 | **VPS 请求需要玩家确认** | lu_mingyuan_dialog request_vps `player_confirms: true` | 陆明远应问"你是说那个 vps996 的服务器？"等玩家确认后才开始调取 |

### 类别 D — 推理引擎差距

| # | 差距 | 设计文档来源 | 影响范围 |
|---|------|-------------|---------|
| D1 | **最终报告的 `output_file` 异步加载路径** | inference_map.json stage_final `output_file: "content/case01/inference_templates/final_report.txt"` | InferencePanel 尝试 `/data/content/case01/inference_templates/final_report.txt` 加载，文件已存在 ✅ |
| D2 | **不完整报告（min_required < 4）应有 [信息不足] 标记** | inference_map stage_final `incomplete_output` | 当前推理引擎对 stage_final 命中但不足 4 组关键词时如何处理？需确认 |

### 类别 E — 交互打磨（P1 级别，不影响核心可玩性）

| # | 差距 | 设计文档来源 | 影响范围 |
|---|------|-------------|---------|
| E1 | **Tab 超过 5 个时应自动关闭最左侧 tab** | ui_interaction_spec L239 | 当前静默拒绝打开新 tab |
| E2 | **Tab 打开/关闭动画缺失** | ui_interaction_spec L237-238 | 0.2s 滑入 / 0.15s 缩出 |
| E3 | **搜索结果文本不可选/不可拖** | ui_interaction_spec "所有 tab 类型中的文本都应该可以选中拖拽到 context" | 即使 A1 修复了文档拖拽，搜索结果和工具结果也需要支持 |
| E4 | **侧边栏 NavTree 不显示工具锁定状态** | v2 plan Phase 6 "工具入口" | 银行系统和通信记录应该有 🔒 标记，解锁后变为可用 |
| E5 | **状态栏日志应滚动** | ui_interaction_spec L246-258 | 当前状态栏只显示最后一条消息，没有滑动动画 |
| E6 | **证据到达动画缺失** | ui_interaction_spec L190-195 | badge 数字跳动 + 新条目蓝色 3 秒 |

### 类别 F — 音效（P2 级别）

| # | 差距 | 设计文档来源 |
|---|------|-------------|
| F1 | 全部 9 种音效未实现 | ui_interaction_spec L280-291 |

---

## 二、实施计划

### 原则

1. **先修核心机制** — A 类优先（没有拖拽就没有游戏）
2. **再修线索链** — B 类其次（线索链断了游戏走不完）
3. **再修对话** — C 类（对话体验影响沉浸感）
4. **最后打磨** — D/E/F（体验提升但不阻塞可玩性）

### 每步必须 TDD：先写测试 → 再实现 → 测试通过 → 继续。

---

### Step 1: 拖拽系统（A1）

**目标：** 实现从文档阅读区/浏览器/电话 → context 面板的文本拖拽。

**设计规格（ui_interaction_spec L108-129）：**
- 玩家选中任意文本 → 拖拽 → 松开到 context 面板 → 创建新 block
- 拖拽预览：半透明文本块，前 20 字 + `...`
- 放置提示：context 面板边框变蓝虚线
- 落入动画：0.2s ease-out + 轻微弹跳
- 溢出时：block 弹回 + 红字 `CONTEXT OVERFLOW`

**实现方案：**
- 使用 HTML5 Drag and Drop API + `document.getSelection()`
- 在 `GameplayLayout.svelte` 层面统一处理拖拽，因为三个 tab 类型（文档/浏览器/电话）都需要支持
- `DocumentViewer.svelte`、`BrowserFrame.svelte`、`PhoneFrame.svelte` 的结果区域添加 `draggable` 支持
- `ContextInput.svelte` 添加 `ondrop` / `ondragover` 处理器

**涉及文件：**
- `src/components/reader/DocumentViewer.svelte` — 添加文本选取→拖拽源
- `src/components/browser/BrowserFrame.svelte` — 搜索结果和工具结果可拖
- `src/components/phone/PhoneFrame.svelte` — 对话消息可拖
- `src/components/inference/ContextInput.svelte` — 添加 drop target
- `src/scenes/GameplayLayout.svelte` — 可能需要全局拖拽协调
- `src/lib/state/context.svelte.ts` — 已有 `addBlock()`，无需改动

**TDD：**
- 拖拽是纯 UI 行为，难以用 vitest 单测。用 DOM 测试（@testing-library/svelte）验证 drop 事件处理。

---

### Step 2: 搜索体验修复（B1, B2, B3, B5, B8）

**目标：** 搜索引擎结果不泄露线索，所有有内容的搜索结果可查看。

**具体修改：**

1. **B1 — 隐藏 key_clue：** BrowserFrame.svelte 中删除 `{#if result.key_clue}` 渲染块。key_clue 只是给开发者的设计注释。

2. **B2 — 移除 useful 绿色边框：** 删除 `.result-item.useful { border-left: 3px solid var(--green); }` 样式。搜索结果外观应统一，区别只在内容中。

3. **B3 — "刘哲 深圳" 搜索正常工作：** 数据已存在（liuzhe_meituan/liuzhe_douyin/liuzhe_noise）。但 liuzhe_meituan 和 liuzhe_douyin 没有 `clickable` 字段也没有 `page_content`。需要：
   - 给 liuzhe_meituan 添加 `page_content`（展示骑手主页截图的文字描述）
   - 给 liuzhe_douyin 添加 `page_content`（展示抖音主页文字描述）
   - 让 BrowserFrame 支持点击这些结果查看详情（当前只有 `opens` 和 `page_content` 两种可点击路径）

4. **B5 — AutoAI 搜索结果：** autoai_appstore 已有 `page_content`。但 `clickable` 未设置。需要修改 BrowserFrame 逻辑：有 `page_content` 的结果都应可点击查看。

5. **B8 — page_content 可查看：** 统一逻辑：有 `page_content` 的搜索结果 → 点击进入 page view。

**涉及文件：**
- `src/components/browser/BrowserFrame.svelte` — UI 修改
- `public/data/search_engine.json` — 给部分结果添加 page_content

---

### Step 3: 浏览器工具页面增强（B6, B7）

**目标：** 地址栏可导航到银行/通信系统；GSXT 搜索结果可进入详情页。

**具体修改：**

1. **B6 — 地址栏导航：** BrowserFrame 的 `navigateTo` 函数应识别更多 URL 模式：
   - `bank-sec.donghai.internal` → view = 'bank'（需要先检查 bank_system 解锁状态）
   - `telecom.records.internal` 或类似 → view = 'telecom'
   - 当前已有 whois/gsxt/numquery/ip_lookup 的地址匹配，需扩展

2. **B7 — GSXT 详情页：** 点击搜索结果中的目标公司名时，加载 `06_company_registration.txt`。
   - 修改 `runGsxt()` — 当搜索返回 results 数组时，渲染列表；点击某条结果后加载详情
   - 或新增一个 GSXT 详情视图

**涉及文件：**
- `src/components/browser/BrowserFrame.svelte` — 逻辑修改

---

### Step 4: 对话引擎两阶段回复（C1, C2, C3, C3b, C4, C5）

**目标：** 陆明远的对话体验符合设计文档——有延迟、有追问、有确认、有上下文感知分支。

**lu_mingyuan_dialog.json 中的 6 种对话模式：**

| 模式 | 条目 | 关键字段 |
|------|------|---------|
| 即时回复 | unlock_bank, ask_progress, thank_or_bye | `response` |
| 两阶段延迟 | request_email_info | `response_immediate` → 延迟 → `response_followup`（**无 `response` 字段！**） |
| 上下文感知分支 | request_telecom_138 | `context_check` → `response_if_context_yes`/`response_if_context_no` → 延迟 → `response_followup`（**无 `response` 字段！**） |
| 理由验证 | request_telecom_189 | `response`(追问) → 等玩家回复 → `response_after_justification` → 延迟 → `response_followup` |
| 确认流程 | request_vps | `response`(确认) → 等玩家回复 → `response_after_confirm` → 延迟 → `response_followup` |
| 解释流程 | request_phone_forensics_with_evidence | `response` → 等玩家回复 → `response_after_explanation` → 延迟 → `response_followup` |
| 前置+满足回复 | request_resident_info, ask_affected_list | `prerequisite_not_met_response` / `prerequisite_met_response` → 延迟 → `response_followup`（**无 `response` 字段！**） |

**具体修改：**

1. **C1 + C2 — 延迟 + 两阶段回复：** DialogEngine 的 `processMessage` 需要返回更丰富的结果：
   ```typescript
   interface DialogTurnResult {
     messages: DialogMessage[];
     triggeredUnlock?: string;
     pendingAction?: {
       immediateMessage: string;    // "好，我帮你调" 或 response_immediate
       delaySeconds: number;         // 5-12 秒
       followupMessage: string;      // "资料到了" 或 response_followup
       unlockOnComplete: string;      // lock ID
     };
   }
   ```
   - PhoneFrame 收到 `pendingAction` 后先显示 `immediateMessage`
   - setTimeout(delaySeconds * 1000) 后追加 `followupMessage` 并触发解锁
   - 优先使用 `response_immediate`，其次使用 `response`，最后使用 `prerequisite_met_response`

2. **C3 — 前置条件检查：** DialogEngine 需要：
   - 查询 stateMachine.isUnlocked(prerequisite) 
   - 如果未满足 → 返回 `prerequisite_not_met_response`
   - 如果已满足且有 `prerequisite_met_response` → 使用该字段作为立即回复（request_resident_info, ask_affected_list）
   - 如果已满足且无 `prerequisite_met_response` → 继续处理（可能有 additional_match 要求）
   - 两阶段取证条目（no_evidence vs with_evidence）已在 JSON 中用 priority 区分

3. **C3b — 上下文感知分支（context_check）：** `request_telecom_138` 使用特殊模式：
   - 检查玩家输入是否同时包含 `context_check` 描述的关键词（如"通信|通话|记录|调取"）
   - 如果包含 → 返回 `response_if_context_yes` → 延迟 → `response_followup` → 解锁
   - 如果不包含 → 返回 `response_if_context_no`（追问"你要查这个号码什么？"），不触发解锁
   - **此条目没有 `response` 字段**，不处理会导致空回复+立即解锁（严重 bug）

4. **C4 — 玩家提供理由：** telecom_189 需要 `player_must_justify` 流程：
   - 第一次玩家提到 189 → 陆明远追问理由
   - 玩家再次回复包含有效理由 → 陆明远同意 + 延迟回复
   - 需要在 DialogEngine 中实现"等待玩家回答"的状态

5. **C5 — VPS 请求确认：** request_vps 有 `player_confirms: true`：
   - 陆明远先问"服务器登录记录？你是说那个 vps996 的服务器？"
   - 玩家确认后才开始调取

**涉及文件：**
- `src/lib/engine/dialog.ts` — 核心逻辑修改
- `src/lib/engine/types-v2.ts` — 扩展 DialogTurnResult 类型
- `src/components/phone/PhoneFrame.svelte` — UI 适配两阶段 + pending action
- `src/lib/engine/dialog.test.ts` — 更新测试

**TDD：**
- dialog.test.ts 覆盖所有新场景
- 两阶段回复、前置拒绝、理由验证、确认流程、上下文感知分支、prerequisite_met_response

---

### Step 5: 推理引擎最终报告完善（D2）

**目标：** stage_final 命中但关键词不足 4 组时，生成带 [信息不足] 标记的不完整报告。

**当前问题：** inference_map.json 的 `stage_final.incomplete_output` 是一段设计注释（"如果 required_keywords 命中不足 4 组，生成不完整报告，缺失部分标为 [信息不足]，不触发结案。"），不是实际的报告文本。当前代码直接返回这段注释给玩家，需要修复。

**具体修改：**
- inference-v2.ts 的 `runInferenceV2` 对 stage_final 的 `min_required` 检查（已有基础逻辑，需完善输出）
- 检查 5 组 required_keywords 各自是否被命中：林奕辰 / AutoAI远程操控 / 刘哲=人头 / 资金链 / 钓鱼手法
- 不足 4 组 → `triggersCaseClose = false`
  - 动态生成报告：命中的章节正常输出，未命中的章节替换为 `[信息不足]`
  - 参考 final_report.txt 的结构，按章节检查对应关键词
- 4 组及以上 → `triggersCaseClose = true`，加载 final_report.txt

**涉及文件：**
- `src/lib/engine/inference-v2.ts`
- `src/lib/engine/inference-v2.test.ts`

---

### Step 6: Tab 管理和侧边栏打磨（E1, E4）

**目标：** Tab 自动关闭最旧；侧边栏显示锁定状态。

**具体修改：**

1. **E1 — Tab 自动关闭：** GameplayLayout.svelte 的 `openEvidenceTab()`，当 `openTabs.length >= MAX_TABS` 时，先 `openTabs.shift()` 移除最左侧 tab。

2. **E4 — NavTree 锁定状态：** NavTree.svelte 导入 `getSharedStateMachine()`，工具入口根据锁状态显示 🔒/✅。

**涉及文件：**
- `src/scenes/GameplayLayout.svelte`
- `src/components/sidebar/NavTree.svelte`

---

### Step 7: 全链路集成验证

**目标：** 完整走一遍 Case 01 全流程，确认每一步都能走通。

**验证清单（基于 flowchart_v3.md 的 23 步 + 支线）：**

```
起点:
□ briefing_001.eml 自动打开
□ 点击附件 → phishing_sample.eml tab 打开
□ 从邮件中选中域名文本 → 拖入 context

Phase 1:
□ 搜索"域名查询" → 找到 WHOIS 网站 → 点击打开
□ WHOIS 输入 donghai-verify.cn → 返回注册信息
□ 选中注册信息 → 拖入 context

Phase 2:
□ 搜索"东海银行 陆明远" → 找到电话号码
□ 打电话 → 陆明远接听
□ 说"帮我查 lz_tech@163.com" → 陆明远说"好，稍等"(5s) → "资料到了"
□ 邮箱信息解锁，侧边栏出现

Phase 3:
□ 号码查询 13827719403 → 归属深圳移动
□ 打电话说"调取 138-2771-9403 通信记录" → 陆明远说"好"(6s) → "记录到了"
□ 通信记录解锁

Phase 4:
□ 号码查询 075588326617 → 瑞泽信息技术
□ GSXT 搜索"瑞泽" → 公司详情

Phase 5:
□ 打电话"开通银行系统权限" → 陆明远给地址密码
□ 银行系统解锁 → 地址栏输入银行地址 → 打开银行页面
□ 查客户名单 → 发现刘哲
□ 查刘哲流水 → 8847
□ 查 8847 → 陈芳

Phase 6（反转）:
□ 搜索"刘哲 深圳" → 饿了么骑手 + 抖音
□ 推理引擎放入刘哲 + 外卖骑手信息 → 建议调取 VPS

Phase 7:
□ 打电话"帮我调取 vps996 服务器登录记录" → 确认 → 等待(7s) → VPS 记录解锁
□ 推理引擎放入 VPS 双 IP → 建议手机取证

Phase 8:
□ 打电话"刘哲可能不是真正操作的人...VPS 记录显示...需要取证"
  → 陆明远说"我看了 VPS 记录...好，我安排"(10s) → 4 个取证文件解锁

Phase 9:
□ IP 查询 118.25.76.203 → 武汉洪山
□ 打电话"武汉洪山区雄楚大道329号鹏程花园4栋1703，查住户"
  → 陆明远联系武汉(12s) → 林奕辰信息解锁

Phase 10:
□ 搜索"林奕辰 武汉" → 领英 + GitHub

Phase 11（结案）:
□ context 放入 林奕辰+刘哲+陈芳+钓鱼+AutoAI → 推理 → 最终报告 → CASE CLOSED
```

---

## 三、文件清单

### 新增文件
无新文件。所有改动在现有文件上修改。

### 修改文件

| 文件 | 步骤 | 改动量 |
|------|------|--------|
| `src/components/inference/ContextInput.svelte` | Step 1 | **大改** — 添加 drop target |
| `src/components/reader/DocumentViewer.svelte` | Step 1 | **中改** — 添加拖拽源 |
| `src/components/browser/BrowserFrame.svelte` | Step 1,2,3 | **大改** — 拖拽源 + 搜索 UI + 地址栏 + GSXT 详情 |
| `src/components/phone/PhoneFrame.svelte` | Step 1,4 | **大改** — 拖拽源 + 两阶段回复 UI |
| `src/lib/engine/dialog.ts` | Step 4 | **大改** — 两阶段回复 + 前置检查 + 理由验证 + 确认流程 |
| `src/lib/engine/types-v2.ts` | Step 4 | **中改** — 扩展 DialogTurnResult |
| `src/lib/engine/inference-v2.ts` | Step 5 | **小改** — stage_final min_required 逻辑 |
| `src/scenes/GameplayLayout.svelte` | Step 6 | **小改** — tab auto-close |
| `src/components/sidebar/NavTree.svelte` | Step 6 | **小改** — 锁定状态 |
| `public/data/search_engine.json` | Step 2 | **小改** — 添加 page_content |

### 不动文件
- `src/lib/engine/search.ts` — 搜索引擎匹配逻辑正确，无需改动
- `src/lib/engine/state-machine.ts` — 状态机逻辑正确
- `src/lib/state/evidence-v2.svelte.ts` — 证据管理正确
- `src/lib/state/context.svelte.ts` — context state 正确，addBlock 已实现
- `src/lib/state/state-machine-shared.ts` — 共享实例正确
- 所有 `public/data/*.json` 除 search_engine.json 外无需改动
- 所有 content/*.txt 文件已存在且正确
- `inference_templates/final_report.txt` 已存在且内容正确（v3 叙事）

---

## 四、依赖关系

```
Step 1 (拖拽) ← 无依赖，先做
    ↓
Step 2 (搜索 UI) ← 独立
Step 3 (浏览器增强) ← 独立
    ↓  (Step 2, 3 可并行)
Step 4 (对话引擎) ← 依赖 PhoneFrame（Step 1 添加的拖拽源可能影响 PhoneFrame 结构）
    ↓
Step 5 (推理完善) ← 独立
Step 6 (打磨) ← 独立
    ↓  (Step 5, 6 可并行)
Step 7 (集成验证) ← 依赖所有前面步骤
```

## 五、预计工作量

| 步骤 | 子任务数 | 预计复杂度 |
|------|---------|-----------|
| Step 1 拖拽 | 4 (拖拽源×3 + drop target) | 高 |
| Step 2 搜索 UI | 3 (隐藏线索 + page_content + 样式) | 低 |
| Step 3 浏览器增强 | 2 (地址栏 + GSXT详情) | 中 |
| Step 4 对话引擎 | 5 (延迟+两阶段+前置+理由+确认) | 高 |
| Step 5 推理完善 | 1 (min_required 逻辑) | 低 |
| Step 6 打磨 | 2 (tab + 侧边栏) | 低 |
| Step 7 集成验证 | 1 | 手动 |
| **总计** | **~18 子任务** | |
