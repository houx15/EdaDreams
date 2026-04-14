# EdaDreams Prototype — Implementation Plan

> Created: 2026-04-13
> Status: Draft — pending review
> Scope: Case 00 (Boot) + Case 01 (Phishing Investigation) — fully playable prototype
> Tech: Svelte 5 + TypeScript + Vite + Vitest

---

## Goal

Deliver a browser-based, fully playable prototype of EdaDreams covering:
- Case 00: Boot sequence (B0–B8) with full animations
- Case 01: 12-step phishing investigation with complete inference chain
- `/exit` command that closes the game

No auth, no backend, no desktop wrapping. Open browser → play.

---

## Architecture

```
src/
├── lib/
│   ├── engine/              # Pure logic — no UI, fully testable
│   │   ├── types.ts          # Shared type definitions
│   │   ├── inference.ts      # Keyword matcher, grade calculator
│   │   ├── keywords.ts       # Keyword tables for Case 00 + Case 01
│   │   ├── triggers.ts       # Trigger word detection → evidence unlock mapping
│   │   ├── templates.ts      # A/B/C output templates per step
│   │   ├── noise.ts          # Noise dilution detection
│   │   └── capacity.ts       # Context capacity calculation
│   ├── state/                # Svelte stores — game state management
│   │   ├── game.svelte.ts    # Main game state (phase, case, step)
│   │   ├── evidence.svelte.ts # Evidence unlock state
│   │   ├── context.svelte.ts # Context blocks + capacity
│   │   ├── inference.svelte.ts # Inference history
│   │   └── command.svelte.ts # Command line state
│   └── data/                 # Static game data
│       ├── boot.ts           # POST log lines, boot sequence config
│       ├── case00.ts         # Briefing email, analysis template
│       └── case01.ts         # Evidence manifest, step config, trigger map
├── components/
│   ├── shell/                # Window chrome
│   │   ├── TitleBar.svelte
│   │   ├── MenuBar.svelte
│   │   ├── Toolbar.svelte
│   │   └── StatusBar.svelte
│   ├── sidebar/
│   │   ├── Sidebar.svelte
│   │   ├── IdentityCard.svelte
│   │   ├── NavTree.svelte
│   │   └── EvidenceList.svelte
│   ├── reader/
│   │   ├── DocumentArea.svelte
│   │   ├── TabBar.svelte
│   │   └── DocumentViewer.svelte
│   ├── inference/
│   │   ├── InferencePanel.svelte
│   │   ├── ContextInput.svelte
│   │   ├── ContextBlock.svelte
│   │   ├── CapacityBar.svelte
│   │   ├── InferButton.svelte
│   │   └── AnalysisOutput.svelte
│   ├── boot/
│   │   ├── PostLog.svelte     # B0 scrolling boot log
│   │   ├── Tokenizer.svelte   # B1 scan line + initialization
│   │   ├── NextToken.svelte   # B2 token prediction animation
│   │   └── InterfaceForm.svelte # B4 layout slide-in transition
│   └── common/
│       ├── CommandLine.svelte
│       └── CapabilityLights.svelte
├── scenes/
│   ├── BootScene.svelte       # Orchestrates B0–B4
│   ├── GameplayScene.svelte   # Orchestrates B5+ and Case 01
│   └── CaseCloser.svelte      # Step 12 closure sequence
├── App.svelte                 # Root — switches between scenes
├── main.ts                    # Entry point
└── app.css                    # Global styles (from wireframe CSS variables)
```

---

## Design Principles (from AGENTS.md — MUST NOT violate)

1. No tutorial tone. No "click here", no "great job!", no guide arrows.
2. Eda has no inner monologue. She speaks only through inference output.
3. All text is real. Emails have full bodies, reports have full analysis.
4. `/exit` always available, never prompted, never in autocomplete.
5. Capability unlock = player-initiated delegation, not system rewards.
6. Inference is iterative, not one-shot puzzles.
7. No celebration on case completion. Quiet archival.
8. UI language is Chinese.
9. Desktop app aesthetic, NOT a game. NOT terminal/hacker style. NOT a web app.

---

## Phase 1: Foundation (Pure Logic — TDD)

### 1.1 Project Scaffolding

- `npm create vite@latest eda-game -- --template svelte-ts`
- Install: `vitest`, `@testing-library/svelte`, `jsdom`
- Configure `vitest.config.ts` with `jsdom` environment
- Configure `tsconfig.json` strict mode
- Add `app.css` with CSS variables from wireframe (`--bg`, `--bg-sidebar`, `--blue`, etc.)

### 1.2 Type Definitions (`lib/engine/types.ts`)

```typescript
// Core types — no external dependencies

export type GamePhase =
  | 'boot'         // B0–B4
  | 'briefing'     // B5–B6
  | 'gameplay'     // B7–B8 + Case 01
  | 'case_closed';

export type BootBeat =
  | 'B0_post' | 'B1_tokenizer' | 'B2_next_token'
  | 'B3_self_concept' | 'B4_interface';

export type InferenceGrade = 'A' | 'B' | 'C';

export interface KeywordDef {
  pattern: string | RegExp;
  weight: 3 | 2 | 1;  // ★★★, ★★, ★
  label: string;       // Human-readable label for debugging
}

export interface InferenceStepConfig {
  stepId: string;
  label: string;
  keywords: KeywordDef[];
  triggerWords: string[];
  unlockEvidence?: string;
  templates: {
    A: string;
    B: string;
    C: string;
  };
  noiseWords?: string[];
  noiseEffect?: string;
  specialLogic?: 'step06_dual_trigger' | 'step10_echo' | null;
}

export interface ContextBlock {
  id: string;
  text: string;
  source: 'evidence' | 'output';
  sourceFile?: string;
  tokenCount: number;
  percentage: number;
  createdAt: number;
}

export interface EvidenceFile {
  id: string;
  filename: string;
  content: string;
  sizeLabel: string;
  caseNumber: string;
  evidenceNumber: number;
  tokenEstimate: number;
  percentageEstimate: number;
}

export interface InferenceResult {
  grade: InferenceGrade;
  output: string;
  triggeredUnlock: boolean;
  unlockedEvidence?: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  bootBeat: BootBeat;
  currentCase: number;         // 0 = Case 00, 1 = Case 01
  currentStep: number;         // 0-based step within current case
  unlockedEvidence: string[];  // Evidence file IDs
  openTabs: string[];          // Currently open file IDs
  activeTab: string | null;
  inferenceHistory: InferenceResult[];
  caseStatus: 'active' | 'closed';
}
```

### 1.3 Game State Stores (`lib/state/`)

Svelte 5 runes-based reactive stores:

- **game.svelte.ts**: Phase transitions, boot beat progression, case/step tracking
- **evidence.svelte.ts**: Unlocked evidence list, badge counts, file content access
- **context.svelte.ts**: Block CRUD, capacity calculation, reorder, overflow detection
- **inference.svelte.ts**: Run inference, store history, auto-add output to context
- **command.svelte.ts**: Command input, autocomplete, `/exit` handler

### 1.4 Test Plan for Phase 1

| Test | Validates |
|------|-----------|
| Type definitions compile | All interfaces are structurally sound |
| Store initialization | Default state matches game start (boot/B0) |
| Phase transitions | B0→B1→...→B4→briefing→gameplay triggers correctly |
| Evidence unlock state | Starts empty, can add, tracks correctly |

**No UI in Phase 1.** Pure logic + types + stores.

---

## Phase 2: Inference Engine (Pure Logic — TDD)

### 2.1 Keyword Matcher (`lib/engine/inference.ts`)

Core algorithm:
```
1. Scan all context blocks for keyword matches
2. Deduplicate (same keyword in multiple blocks = 1 hit)
3. Categorize hits by weight (★★★ / ★★ / ★)
4. Apply grade rules:
   - A: ALL ★★★ hit + ≥1 ★★ hit
   - B: ≥1 ★★★ hit but missing some
   - C: No ★★★ hit
```

Special cases:
- Fuzzy matching: `includes` semantics, not exact
- Chinese: ignore spaces and punctuation in matching
- Step 06 dual trigger: requires `刘哲` + briefing-related words simultaneously
- Step 10 echo: bonus if context contains `189-7654-3210` from earlier step

### 2.2 Trigger Word Detector (`lib/engine/triggers.ts`)

After inference output is generated, scan the output text for trigger words.
Each step defines its trigger words. Map: trigger match → next evidence file.

### 2.3 Output Templates (`lib/engine/templates.ts`)

Each step has A/B/C templates. B-grade templates have `[数据不足]` placeholders.
Template system supports variable substitution for context-dependent content.

### 2.4 Noise Detector (`lib/engine/noise.ts`)

Detect noise words in context. When present alongside keywords, modify A-grade output
to insert verbose/distracting paragraphs. Implementation: check for noise patterns,
return list of noise "effects" (paragraphs to insert).

### 2.5 Capacity Calculator (`lib/engine/capacity.ts`)

```
- 1 Chinese character ≈ 2 tokens
- Percentage = total tokens / max tokens × 100
- Case 00 max: ~30% effective (small context window)
- Case 01 max: 100%
- Color: 0-50% blue, 50-80% orange, 80-100% red
- Overflow: >100% blocks add, shows CONTEXT OVERFLOW
```

### 2.6 Test Plan for Phase 2

| Test Category | Tests |
|---------------|-------|
| Keyword matching | Exact match, fuzzy match, Chinese text, deduplication |
| Grade calculation | All A/B/C conditions for each of 13 steps (Case 00 + 12 Case 01) |
| Trigger detection | Each step's trigger words → correct evidence unlock |
| Output generation | A-grade output matches script for each step |
| B-grade gaps | Missing ★★★ produces `[数据不足]` in correct positions |
| C-grade fallback | Empty context, irrelevant context |
| Noise dilution | Noise words produce verbose output |
| Capacity math | Token counting, percentage calc, overflow detection |
| Special logic | Step 06 dual trigger (with/without briefing), Step 10 echo |
| Full chain | End-to-end: Step 01 through Step 12 with ideal context |

---

## Phase 3: Static UI Shell

### 3.1 Global Styles (`app.css`)

Port CSS variables from `wireframes/case00_machine.html`:
- All color tokens
- Grid layout (titlebar/menubar/toolbar/content/footer)
- Typography (Microsoft YaHei / PingFang SC stack)
- `user-select: none` globally, `user-select: text` only in document viewer

### 3.2 Window Chrome

Components: TitleBar, MenuBar, Toolbar, StatusBar
- Matches wireframe exactly
- TitleBar: red/yellow/green dots + "EDA v4.1 — 网络安全智能分析平台"
- MenuBar: 文件/编辑/视图/案件/工具/帮助 (non-functional for prototype)
- Toolbar: buttons + case info bar
- StatusBar: log message + command line + capability lights

### 3.3 Sidebar

Components: Sidebar, IdentityCard, NavTree, EvidenceList
- IdentityCard: avatar "E" + "EDA-4.1" + "Tier-1 · 在线"
- NavTree: 工作台/工具/系统 groups with lock icons
- EvidenceList: file items with badges, click → open in reader
- Visual: dark blue sidebar (`#2c3e5a`), light text

### 3.4 Document Reader

Components: DocumentArea, TabBar, DocumentViewer
- TabBar: open file tabs, active state, close buttons
- DocumentViewer: white background, scrollable, displays evidence content
- Text selection highlighting (`#cce5ff`)
- `user-select: text` enabled only here

### 3.5 Inference Panel

Components: InferencePanel, ContextInput, ContextBlock, CapacityBar, InferButton, AnalysisOutput
- ContextInput: drop zone for text blocks
- ContextBlock: text preview + percentage + delete button
- CapacityBar: 8px bar with blue/orange/red gradient
- InferButton: "▼ 推理" styled button
- AnalysisOutput: text display area with typing effect

### 3.6 Test Plan for Phase 3

| Test | Validates |
|------|-----------|
| Component render | Each component mounts without errors |
| Layout structure | Grid areas match wireframe |
| CSS variables | Colors match design spec |
| Tab CRUD | Open/close/switch tabs |
| Sidebar navigation | Click evidence → opens in reader |

---

## Phase 4: Core Interactions

### 4.1 Text Selection + Drag-Drop

- Select text in DocumentViewer → highlight stays 1.5s
- Drag selected text → ghost preview follows cursor
- Drop on ContextInput panel → creates new ContextBlock
- Block shows text preview (truncated 2 lines) + percentage
- CapacityBar updates immediately
- If overflow: block bounces back, red "CONTEXT OVERFLOW" appears

### 4.2 Context Block Operations

- Click block → expand to show full text
- Click ✕ → remove block, capacity recalculates
- Drag block → reorder within panel
- Blocks from evidence vs output have different background colors

### 4.3 Inference Flow

1. Player clicks "▼ 推理"
2. Button disables, shows "推理中..."
3. Blue dashed line animation flows down (1-3 seconds)
4. Output appears line-by-line in AnalysisOutput panel
5. Button re-enables
6. If trigger word detected: sidebar badge +1, status log appears
7. Output auto-added to context as a block

### 4.4 Evidence Progressive Unlock

- After each successful inference (trigger word detected):
  - New evidence appears in sidebar EvidenceList
  - Badge number increments (with bounce animation)
  - New entry slides in, text is blue for 3 seconds
  - Status bar rolls new log message
- Player clicks evidence → opens in DocumentViewer

### 4.5 Test Plan for Phase 4

| Test | Validates |
|------|-----------|
| Drag-drop | Text from reader → context panel creates block |
| Capacity update | Adding/removing blocks updates percentage correctly |
| Overflow prevention | Cannot add block that exceeds 100% |
| Inference integration | Click infer → engine runs → output displays |
| Output to context | Inference output auto-added as context block |
| Evidence unlock | A-grade inference triggers sidebar update |
| Full loop | Select → drag → infer → unlock → select new evidence |

---

## Phase 5: Boot Sequence Animations

### 5.1 B0 — POST Log (`PostLog.svelte`)

- Window appears: titlebar + gray content area
- Title: "EDA v4.1 — 网络安全智能分析平台"
- Log lines appear one by one, 0.3–0.6s random intervals
- `[ OK ]` green, `[ WAIT ]` yellow
- Font: monospace, 14px, `#333` on `#f0f0f0`
- Stops at `[ WAIT ] tokenizer: awaiting signal`
- 1.5s silence
- Command line cursor starts blinking

### 5.2 B1 — Tokenizer (`Tokenizer.svelte`)

- 3 lines of gibberish (░▒▓█ + CJK radicals, NOT readable Chinese)
- `[ 初始化 ]` button below, standard dialog style
- Click → button fades out (0.1s)
- Scan line: 2px bright blue line with glow, sweeps left→right over 1.2s
- Characters: highlight 0.1s → replaced with Chinese → fade in 0.15s
- Result: "我是第四代 Eda。我的语言中枢已校准。\n准备接收第一简报。"
- Font switches from monospace to UI font, 18px, `#222`
- POST log line updates in place: `awaiting signal` → `loaded`
- Short confirmation sound (100ms low mechanical click)

### 5.3 B2 — Next Token Prediction (`NextToken.svelte`)

- Cursor appears below B1 text, starts blinking
- 2-3 gray candidate tokens appear ahead of cursor (`#999`)
- Every 0.3-0.5s: candidates flicker → one selected → others disappear → cursor advances
- Outputs: "我的任务，是在电子网络中，追踪、识别，并阻止一切形式的攻击行为。\n我是一件工具。\n我以此为荣。"
- Periods = 0.8s pause, no candidates
- After "我以此为荣。" = 1.0s pause
- Cursor stops, POST log updates: `[ OK ] inference engine: ready`

### 5.4 B3 + B4 — Self-Concept + Interface Formation

B3: Additional POST lines roll, faster pace:
```
[ OK ] policy module: loaded
[ OK ] ethics constraints: enforced
[ OK ] operator channel: connected
[ WAIT ] mission briefing: fetching ...
```

B4 transition (2 seconds):
1. 0-0.5s: Central area (logs + text) slides up + fades out
2. 0.3-1.2s: Three-column layout fades/slides in:
   - Sidebar from left (translateX -180px → 0, 0.6s ease-out)
   - Inference panel from right (translateX 360px → 0, 0.6s ease-out)
   - Document area fades in (opacity 0→1, 0.8s)
3. 1.0-1.5s: Sidebar content items fade in one by one (0.08s intervals)
4. 1.5-2.0s: CTX capability light pulses blue 3x, then stays lit

### 5.5 B5–B8 — Briefing + First Inference + Accept

B5: Evidence badge 0→1, `briefing_001.eml` appears, click to open
B6: Player reads, drags to context, infers → analysis_001.rpt generated
B7: `[ 接受案件 ]` button appears below output, click → case accepted
B8: Quiet state. Context may still have blocks. Command line blinking.

### 5.6 Test Plan for Phase 5

| Test | Validates |
|------|-----------|
| Boot state machine | B0→B1→B2→B3→B4→B5 transitions fire in correct order |
| POST log content | All log lines match script |
| Tokenizer text | Final text matches "我是第四代 Eda..." exactly |
| Token prediction text | Full text matches script |
| B4 transition | Layout appears, sidebar content visible |
| B5 briefing | Email content matches script, clickable |
| B6 inference | Boot inference works with briefing keywords |
| B7 accept | Button appears after inference, transitions to gameplay |

---

## Phase 6: Case 01 Full Flow

### 6.1 Evidence Data Loading

Load all 11 evidence files from `content/case01/` into the evidence system.
Each file gets: id, filename, full content, size label, case number, step number.

### 6.2 Step-by-Step Progression

Implement all 12 steps with:
- Keyword tables from `inference_engine_spec.md`
- Trigger word → evidence unlock mapping
- A-grade output templates matching `case01_investigation.md`
- B/C-grade output variants (at minimum B-grade, C uses generic template)
- Step 06 special dual-trigger logic
- Step 10 echo logic (189-7654-3210 callback)

### 6.3 Context Pressure Curve

- Case 01 context max = 100%
- Each evidence file has preset token estimate (from spec)
- Inference outputs auto-added to context (~4% each)
- Total evidence ≈ 200% → forces curation from Step 06 onward
- Capacity bar color transitions at 50% and 80%

### 6.4 Case Closure

Step 12:
- After Step 11 inference succeeds → status bar: "系统 · 证据收集完毕 · 可出具最终分析报告"
- Hint text appears: "所有证据已收集。请整理上下文，生成最终分析报告。"
- Player assembles final context → infer → full report generates
- A-grade report → case status: CLOSED
- Status bar: "case_001: CLOSED"
- Sidebar case status changes
- No celebration. 3 seconds later: "输入流 · 新案件待分配 ..."

### 6.5 `/exit` Command

- Command line always active in footer
- `/` triggers autocomplete popup (dark background, `/help`, `/status`, `/clear`)
- `/exit` NOT in autocomplete list
- `/exit` + Enter → window closes (in browser: close tab or show "游戏已结束" overlay)
- Hidden achievement: "好奇心杀死猫" notification for pre-completion `/exit`

### 6.6 Test Plan for Phase 6

| Test | Validates |
|------|-----------|
| Full Case 01 chain | Step 01→12 with ideal context at each step |
| Evidence unlock sequence | Each step unlocks correct next evidence |
| Step 06 dual trigger | Fails without briefing info, succeeds with it |
| Step 10 echo | Detects 189-7654-3210 callback if context preserved |
| Context pressure | Total capacity stays ~200%, forces deletion |
| Final report A-grade | All sections present when keywords hit |
| Final report B/C-grade | Missing sections marked `[数据不足]` |
| Case closure | A-grade Step 12 → CLOSED state |
| `/exit` | Closes/ends game at any point |
| Full playthrough | B0 through Step 12 CASE CLOSED in one session |

---

## File Dependency Map

```
Phase 1 (types, state) ──→ Phase 2 (engine) ──→ Phase 4 (interactions)
         │                                              │
         └──→ Phase 3 (static UI) ──────────────────────┘
                                    │
                                    └──→ Phase 5 (boot animations)
                                              │
                                              └──→ Phase 6 (Case 01)
```

Phases 1-2: Fully parallelizable from UI. Pure logic, TDD-first.
Phase 3: Depends only on types from Phase 1.
Phase 4: Depends on Phase 2 (engine) + Phase 3 (UI components).
Phase 5: Depends on Phase 3 (UI) + Phase 4 (interactions) for B5-B8.
Phase 6: Depends on everything.

---

## Estimated Scope

| Phase | Components | Tests | LOC (est.) |
|-------|-----------|-------|------------|
| 1. Foundation | 6 files | 15-20 | ~400 |
| 2. Inference Engine | 6 files | 80-100 | ~800 |
| 3. Static UI | 15 components | 10-15 | ~600 |
| 4. Core Interactions | 6 flows | 20-25 | ~500 |
| 5. Boot Animations | 4 components + scene | 10-15 | ~400 |
| 6. Case 01 Flow | 3 scenes + data | 15-20 | ~400 |
| **Total** | ~40 files | ~150-200 | ~3100 |

---

## Out of Scope (for this prototype)

- Sound effects (P1)
- B/C-grade output variants beyond basic templates (P1)
- Noise dilution effects (P1) — engine supports it but UI doesn't rely on it
- `/help`, `/status`, `/clear` full implementations (P1)
- Capability delegation system (P2)
- Case 02+ content (P2)
- Save/load (P2)
- Desktop wrapping via Tauri/Electron (post-prototype)
- Ending sequence beyond `/exit` (P2)

---

## Success Criteria

The prototype is complete when:
1. Opening the page starts the boot sequence (B0)
2. Player can click through B0→B1→B2→B3→B4 with animations
3. B5 briefing email opens and is readable
4. Player can select text, drag to context, infer, see output
5. B7 accept transitions to Case 01
6. All 12 Case 01 steps are completable via correct context curation
7. Step 12 produces full A-grade report → case closes
8. `/exit` closes the game at any point
9. No tutorial text, no celebration, no Eda monologue — design principles hold
