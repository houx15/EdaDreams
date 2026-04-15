# EdaDreams — 待办计划

> 截至 2026-04-15。
> **状态：P0 + P1 + P2 全部完成。** 以下保留完整记录供参考。

---

## P0 — 不做这些 coder 没法开工

### 1. 写 7 个 v3 新增全文文件

这些内容在 `case01_narrative_v3.md` 里有梗概或部分全文，需要扩展成独立的、可直接渲染给玩家的完整文本。放在 `content/case01/` 下。

| 序号 | 文件名 | 内容 | 来源 | 注意事项 |
|------|--------|------|------|---------|
| 1a | `vps_login_records.txt` | SSH 登录记录表，双 IP，深圳 2 次 8 分钟 vs 武汉 7 次 38 小时 | narrative_v3 Phase 7 | 格式要像真的服务器日志导出，不带分析 |
| 1b | `phone_forensics_report.txt` | 手机取证报告摘要：设备信息 + 应用列表 + AutoAI 权限/数据量 | narrative_v3 线索 D | 格式像公安技术组的取证报告，冷冰冰的 |
| 1c | `autoai_operation_log.txt` | AutoAI 按时间戳的操作日志：注册域名、发邮件、群发短信、转账等 | narrative_v3 线索 D | 格式像 app 的 debug log，机器语言 |
| 1d | `autoai_chat_log.txt` | 刘哲↔"顾问"(林总) 的完整聊天记录 | narrative_v3 线索 E 已有全文 | 直接从 narrative_v3 提取，独立成文件 |
| 1e | `autoai_screenshot_desc.txt` | 截图 #0314-2215 的描述：终端+美团外卖+地址+WiFi | narrative_v3 Phase 8 已有描述 | 格式像取证报告的截图附录 |
| 1f | `resident_info.txt` | 鹏程花园 4 栋 1703 住户信息：林奕辰 | narrative_v3 Phase 9 | 格式像派出所户籍查询返回 |
| 1g | `account_b_transactions.txt` | 陈芳账户 8847 的原始交易流水（ATM/支付宝/加密货币） | 旧 09_fund_flow 中的第三层数据 | 只要原始流水，不要分析段落 |

### 2. 更新 `04_phone_records.txt`

**要改什么：**
- 新增一行终端信息：`终端型号: Redmi Note 11 · MIUI 14`
- 新增 03-08 一通来电：`03-08 20:00 呼入 未知号码 4分22秒`（林总初次联络）
- 新增流量分应用统计段落：

```
流量分应用统计（03-08 至 03-17）:
  AutoAI           11.6 GB  (82%)
  抖音              1.2 GB  (8%)
  饿了么骑手版       0.8 GB  (6%)
  其他               0.6 GB  (4%)
```

### 3. 整理 `02_domain_registration.txt`

当前文件用 `---SPLIT---` 标记拆分了多个查询结果，格式不规范。

**做法：** 删掉这个文件。域名查询的返回内容已经在 `tools_query_map.json` 的 `whois.queries` 里定义了。coder 直接读 JSON 渲染即可，不需要独立文本文件。

如果 coder 希望有独立文本作为渲染模板，拆成 4 个小文件：
- `whois_donghai-verify.cn.txt`
- `whois_donghai-secure.cn.txt`
- `whois_donghai-safety.cn.txt`
- `whois_donghai-bank.com.txt`

### 4. 清理过时文件

| 文件 | 操作 | 原因 |
|------|------|------|
| `script/case01_investigation.md` | 移入 `archived/` | v2 旧版，被 narrative_v3 取代 |
| `script/case01_flowchart.md` | 移入 `archived/` | 旧版，被 flowchart_v3 取代 |
| `content/case01/02_domain_registration.txt` | 删除或拆分（见上） | 格式混乱 |
| `content/case01/09_fund_flow_INFERENCE_OUTPUT.txt` | 移入 `content/case01/inference_templates/` | 标记更清晰 |
| `content/case01/11_timeline_INFERENCE_OUTPUT.txt` | 移入 `content/case01/inference_templates/` | 标记更清晰 |
| `systems/inference_engine_spec.md` | 在文件顶部加废弃标记 | v1 触发词模式已被 `inference_map.json` 取代 |

---

## P1 — 不做体验会差但不阻塞开工

### 5. 重写 `inference_map.json` 的输出措辞

**原则：** Eda 分析你给她的东西，但不总是告诉你下一步去哪。

**做法：** 对 14 个 stage 逐一重写 `output_suggestion`：

| 次数 | 提示力度 | 示例（stage_3 为例） |
|------|---------|---------------------|
| 第 1-2 次推理 | 纯分析 | "三个域名注册人和邮箱完全相同。注册邮箱 lz_tech@163.com 是目前已知的唯一身份线索。" |
| 第 3 次 | 隐晦暗示 | 同上 + "该邮箱的注册信息可能包含更多身份线索。" |
| 第 4 次+ | 明确建议 | 同上 + "建议通过官方渠道调取该邮箱的注册信息。" |

需要给每个 stage 增加 `hints_by_attempt` 字段：
```json
"hints_by_attempt": {
  "1-2": "纯分析文本",
  "3": "分析 + 隐晦暗示",
  "4+": "分析 + 明确建议"
}
```

### 6. 更新 `PROJECT.md` 文件地图

当前文件地图缺少：
- `case01_data/` 目录（5 个 JSON）
- `archived/` 目录
- `case01_flowchart_v3.md` 和 `case01_narrative_v3.md`
- `TODO.md`

把文件地图改成当前实际结构。

### 7. 统一 `systems/tools_spec.md`

两个选择：
- **方案 A：** 标记为"设计理念文档"，保留人可读的描述，注明"实现细节见 JSON"
- **方案 B：** 废弃，所有内容由 JSON 承载

建议 A——保留 tools_spec 作为设计意图的说明（为什么这么设计），JSON 作为实现规格（具体怎么做）。在 tools_spec 顶部加注：

```
> 实现规格见 case01_data/tools_query_map.json 和 search_engine.json。
> 本文件只描述设计意图和交互原则。
```

### 8. 写 8847 的银行原始流水

当前 `tools_query_map.json` 里 bank 的 8847 流水只有一行 `result_summary`。需要写成完整的银行流水格式（和 08_liuzhe_account.txt 格式一致），包含：
- 5 笔来自 3301 的转入
- 6 笔 ATM 取现（海口各区）
- 4 笔支付宝/微信转出
- 2 笔加密货币购买
- 余额 ¥3,500

不含任何分析。就是原始交易记录。

---

## P2 — 打磨细节

### 9. 搜索引擎噪音扩充

当前 `search_engine.json` 有 17 条预设。可以扩充到 30+ 条，覆盖更多玩家可能搜的词：
- "钓鱼邮件 怎么查" → 安全教育文章（噪音）
- "银行 诈骗 报警" → 法律科普（噪音）
- "深圳 南山 科技园" → 科技园简介（噪音）
- "Redmi Note 11" → 手机评测（噪音，但确认是千元机）
- "AutoAI 安全吗" / "AutoAI 权限" → 论坛讨论（伏笔）
- 通用搜索（任何未匹配的词）→ 随机 1-2 条无关新闻

### 10. 最终报告模板全文

`inference_map.json` 的 `stage_final` 引用了 narrative_v3 中的报告，但没有独立的完整模板文件。需要写一份包含五章完整结构的报告模板（包含 v3 的林奕辰/AutoAI 内容），并按 context 命中情况标注哪些段落在不完整时替换为 `[信息不足]`。

### 11. Case 00 的推理关键词表确认

旧的 `inference_engine_spec.md` 里有 Case 00 的关键词表（briefing 的关键信息/噪音/输出模板）。这部分内容没有被 JSON 覆盖。需要：
- 要么把 Case 00 的部分提取到 `case00_data/inference_map.json`
- 要么在 `inference_engine_spec.md` 中只保留 Case 00 部分，废弃 Case 01 部分

### 12. content/ 目录结构最终化

按新设计，content/case01/ 的文件应该按来源重命名：

```
content/case01/
├── briefing/
│   └── briefing_001.eml        ← 主动投递
├── system/
│   └── handover_note.txt       ← 系统备忘
├── phishing/
│   └── sample.eml              ← briefing 附件
├── bank/                        ← 银行系统返回的原始数据
│   ├── liuzhe_account.txt
│   ├── account_b.txt
│   ├── account_b_transactions.txt  ← 新增
│   └── affected_clients.txt
├── telecom/                     ← 通信记录返回的原始数据
│   └── 13827719403.txt
├── forensics/                   ← 取证结果
│   ├── phone_report.txt         ← 新增
│   ├── autoai_log.txt           ← 新增
│   ├── autoai_chat.txt          ← 新增
│   └── autoai_screenshot.txt    ← 新增
├── police/
│   └── resident_info.txt        ← 新增
├── external/                    ← 外部调取（VPS、邮箱等）
│   ├── email_account.txt
│   └── vps_login_records.txt    ← 新增
└── inference_templates/         ← 推理输出模板（不是证据）
    ├── fund_flow_analysis.txt
    ├── timeline.txt
    └── final_report.txt         ← 新增
```

或者不重组——保持扁平结构，靠 JSON 的 `result_file` 字段指向。**这个决定留给 coder，我们只要确保 JSON 里的引用路径和实际文件对得上。**

---

## 不做的（记录为什么不做）

| 事项 | 为什么不做 |
|------|-----------|
| Case 02+ 内容 | Case 01 还没完成，不分散精力 |
| 能力委托曲线文档 | 依赖 Case 02 设计，现在写太早 |
| 结局设计 | 需要全部 case 的叙事弧线才能设计 |
| 存档/读档系统 | 纯实现问题，不需要策划文档 |
| 完整音效列表 | 电话/搜索的新交互音效等 coder 搭好框架再补 |
