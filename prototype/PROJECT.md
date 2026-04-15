# EdaDreams — 项目总纲

> 本文件是开发团队的入口文档。读完这一份，你就知道这个游戏是什么、
> 核心机制怎么运作、所有设计资料在哪。

---

## 一句话

玩家以为自己是一个 AI，其实自己一直是坐在电脑前操作这个 AI 的人。

---

## 30 秒概述

EdaDreams 是一个第一人称调查解谜游戏。玩家操作一款名叫 **Eda** 的商用网络安全 AI 分析平台，通过阅读证据、筛选关键信息、喂给 AI 推理引擎来破案。

游戏的界面就是 Eda 本身——一个全屏的桌面应用程序。没有菜单画面，没有过场动画，没有 HUD。玩家从开机自检开始，一路工作到结案。整个过程像在用一款真正的政企安全软件。

**核心扭转：** 底部状态栏有一个不起眼的命令行 `>`。输入 `/exit` 回车，游戏窗口关闭，露出真实的电脑桌面——原来 Eda 一直就是桌面上的一个程序，玩家一直就是那个操作它的人。这条命令从游戏第一帧起就可用，但永远不会被提示。

---

## 核心机制

### 1. Context Curation（上下文管理）

这是游戏的第一玩法。玩家在文档阅读区读证据，选中关键文本，拖拽到右侧推理框的「上下文输入」面板。每个文本块占一定百分比的容量。上下文满了就得删旧的腾空间。

**玩家要做的决策：** 放什么进去、删什么、保留什么、什么顺序。

### 2. Inference（推理）

点击「推理」按钮，引擎根据上下文中的关键词生成分析报告。输出质量完全取决于上下文质量——关键信息齐全则输出完整，缺信息则输出有空缺，塞噪音则输出啰嗦。

**不是 LLM 实时生成。** 每步推理的输出是预写好的模板，根据关键词命中情况拼接。详见 `systems/inference_engine_spec.md`。

### 3. Active Exploration（主动探索）

只有案件 briefing 是主动投递的。之后所有信息需要玩家自己去找：在网页工具输入域名查注册信息、打电话给对接人申请银行权限、在数据库终端查流水。搜什么、去哪搜、怎么搜——全靠玩家判断。搜错了就看到一堆无关结果或空白。推理引擎的作用是帮玩家整理已有信息并建议调查方向，不是自动投递新文件。

### 4. Capability Delegation（能力委托）

游戏底部有 7 个能力指示灯：CTX CMP WEB MEM TOOL EXEC CODE。初始只有 CTX 亮着。每个能力的解锁方式是：玩家在手动做某件事做到烦了，发现可以把这件事交给 Eda。比如手动 compaction 做到受不了了 → 发现可以委托 Eda 做 compaction → CMP 灯亮起。

**这不是升级奖励，是玩家主动发起的委托。**

---

## 游戏结构

```
Case 00 (Boot)     → 开机、建立身份、学会 context + inference
Case 01 (钓鱼案)   → 第一个完整案件，12 步推理链，手动 compaction 的痛苦
Case 02+           → 后续案件，逐步解锁 CMP → WEB → MEM → TOOL → EXEC → CODE
结局                → /exit 揭示
```

**Case 之间没有明显边界。** 没有标题卡、没有过场。前一个 case 结束，下一个 case 的材料直接开始推送。整个游戏是一条连续的工作流。

---

## 视觉方向

**像一个真实的桌面 app，不像一个游戏。**

- 全屏窗口，有假 OS 标题栏（红黄绿点）、菜单栏、工具栏
- 系统灰色调（`#f0f0f0` 背景、`#ddd` 边框、`#333` 文字）
- 三栏布局：左侧导航栏 | 中间文档阅读区 | 右侧推理框
- 底部状态栏：系统日志 + 命令行 + 能力指示灯
- UI 语言：中文（"推理"不是"INFER"，"上下文"不是"CONTEXT"）

**不是** 终端/黑客/amber-on-black 风格。
**不是** 网页应用。是桌面软件。

参考线框图：`wireframes/case00_machine.html`

---

## 不可违反的设计原则

1. **没有 tutorial 语气。** 不说"点击此处"、"太好了！"、没有引导箭头。
2. **Eda 没有内心独白。** 她只通过推理输出说话，输出的是工作内容，不是心情。
3. **所有文本都是真的。** 邮件有完整正文，报告有完整分析，名单有 47 个人。不是图标代表的抽象内容。
4. **`/exit` 从第一帧起永远可用，永远不被提示。**
5. **能力解锁 = 玩家主动委托，不是系统奖励。**
6. **推理可反复迭代，不是一次性谜题。**
7. **结案时不庆祝。** 像真的办案系统一样安静归档。

---

## 文件地图

```
EdaDreams/
│
├── PROJECT.md                     ← 你正在读的这个文件
├── CHANGELOG.md                   ← 版本变更日志
├── TODO.md                        ← 待办计划
│
├── script/                        ← 剧本与流程（玩家体验什么）
│   ├── case00_boot.md             ← Case 00: 开机序列，8 个 beat
│   ├── case01_narrative_v3.md     ← Case 01: 故事线（AutoAI + 反转 + 林奕辰）
│   └── case01_flowchart_v3.md     ← Case 01: 操作流程图（23 步四幕）
│
├── case01_data/                   ← Case 01 数据手册（coder 直接读这些实现）
│   ├── state_machine.json         ← 7 把锁的解锁条件与授权链
│   ├── tools_query_map.json       ← 所有工具的 输入→输出 映射
│   ├── search_engine.json         ← 搜索引擎结果库（17 条，含噪音）
│   ├── lu_mingyuan_dialog.json    ← 陆明远电话对话树（12 种场景）
│   └── inference_map.json         ← 推理引擎阶段映射（14 阶段）
│
├── wireframes/                    ← 界面设计
│   └── case00_machine.html        ← v1.0 定稿
│
├── content/case01/                ← 游戏内文本素材（工具返回的原始文本）
│   ├── 00_handover_note.txt       ← 系统备忘：交接笔记
│   ├── 01_phishing_sample.eml     ← briefing 附件：钓鱼邮件样本
│   ├── 03_email_account.txt       ← 邮箱信息（陆明远调取）
│   ├── 04_phone_records.txt       ← 刘哲通信记录（运营商调取）
│   ├── 05_phone_lookup.txt        ← 号码归属（公开查询）
│   ├── 06_company_registration.txt ← 工商登记（公开查询）
│   ├── 07_affected_clients.txt    ← 客户名单 47 人（银行系统）
│   ├── 08_liuzhe_account.txt      ← 刘哲账户+流水（银行系统）
│   ├── 10_account_b.txt           ← 陈芳账户信息（银行系统）
│   ├── account_b_transactions.txt ← 陈芳账户流水（银行系统）
│   ├── vps_login_records.txt      ← VPS 登录记录（服务商调取）
│   ├── phone_forensics_report.txt ← 手机取证报告（公安技术组）
│   ├── autoai_operation_log.txt   ← AutoAI 操作日志（取证提取）
│   ├── autoai_chat_log.txt        ← AutoAI 聊天记录（取证提取）
│   ├── autoai_screenshot_desc.txt ← AutoAI 截图描述（取证提取）
│   ├── resident_info.txt          ← 住户信息（武汉警方协查）
│   └── inference_templates/       ← 推理输出模板（Eda 生成，不是证据）
│       ├── fund_flow_analysis.txt
│       └── timeline.txt
│
├── systems/                       ← 系统设计文档（设计意图）
│   ├── tools_spec.md              ← 工具系统设计意图（实现见 JSON）
│   ├── inference_engine_spec.md   ← ⚠️ Case 01 部分已废弃，Case 00 仍有效
│   └── ui_interaction_spec.md     ← UI 交互：动效、拖拽、音效
│
└── archived/                      ← 旧版文件（仅供参考）
```

---

## 阅读顺序建议

**如果你是第一次接触这个项目：**
1. 本文件（PROJECT.md）—— 5 分钟，建立全局理解
2. `CHANGELOG.md` —— 3 分钟，理解设计经过了哪些迭代（从底部往上读）
3. `wireframes/case00_machine.html` —— 浏览器打开，看界面长什么样
4. `script/case00_boot.md` —— 15 分钟，理解开机序列和核心机制
5. `script/case01_narrative_v3.md` —— 20 分钟，理解 Case 01 故事线（AutoAI + 反转 + 真犯）
6. `script/case01_flowchart_v3.md` —— 10 分钟，理解玩家操作路径（23 步四幕）
7. `case01_data/*.json` —— 实现时精读，这是你写代码的直接输入
8. `content/case01/` —— 实现证据系统时逐一阅读
9. `systems/ui_interaction_spec.md` —— 实现 UI 时精读

**如果你只想快速了解这个游戏的体验：**
读 `case00_boot.md` 的 B5–B6 节（第一次推理），然后读 `case01_flowchart_v3.md` 的 Phase 0–5 + Phase 6–8（追踪→反转→真凶）。

**⚠️ 不要读这些文件（已过时）：**
- `archived/` 下的所有文件 — 旧版本，仅供参考
- `systems/inference_engine_spec.md` 的 Case 01 部分 — 已被 `case01_data/inference_map.json` 取代

---

## 实现优先级建议

### P0 — 能玩（MVP）

1. 窗口框架（标题栏 + 三栏布局 + 状态栏）
2. 文档阅读区（打开文件、tab 切换、文本选中）
3. 浏览器模拟（地址栏 + 网页 tab + 搜索结果渲染）
4. 电话系统（拨号 + 文字化通话 + NPC 关键词匹配）
5. 数据库查询界面（银行系统 + 通信记录）
6. Context 面板（拖拽放入、百分比计算、删除 block）
7. 推理引擎（关键词匹配 → A 级输出 → 方向建议）
8. Case 00 boot 序列（可简化动效，保留文本内容）
9. Case 01 全探索流程（工具 + 搜索结果 + NPC 对话 + 结案）

### P1 — 好玩

10. Boot 动效（扫描线、token 候选闪烁）
11. 搜索噪音结果库（让搜索更真实）
12. 推理 B/C 级输出变体
13. 音效
14. 命令行系统（`/help`、`/exit` + 隐藏成就）

### P2 — 完整

15. Case 02+ 内容
16. 能力委托系统（CMP、WEB 等灯的点亮流程）
17. 结局序列
18. 存档/读档

---

## 关键数据

| 项目 | 数值 |
|------|------|
| Case 01 推理步骤 | 12 步 |
| Case 01 证据文件 | 11 份 |
| 受影响客户数 | 47 人（名单里有完整 47 条记录） |
| 总损失金额 | ¥384,200 |
| 嫌疑人 | 刘哲（深圳，技术面）、陈芳（海口，资金面） |
| 攻击准备期 | 74 天 |
| Context 容量 | 百分比制，Case 00 ~30%，Case 01 ~100%（但证据总量 ~200%） |
| 能力指示灯 | CTX CMP WEB MEM TOOL EXEC CODE（7 个） |

---

## 命名约定

- 文件名：小写英文 + 下划线，如 `phishing_sample.eml`
- 案件编号：`CASE-2041-NNNN`
- 证据文件前缀：两位数字序号，如 `01_`、`02_`
- 脚本文件：`caseNN_描述.md`
- 系统文档：`描述_spec.md`
