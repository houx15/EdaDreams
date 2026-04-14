# AGENTS.md — EdaDreams

## Project Overview

EdaDreams is a first-person investigation puzzle game. The player operates a commercial
cybersecurity AI analysis platform called **Eda** — reading evidence, curating context,
and triggering inference to solve cases. The game interface IS Eda itself: a fullscreen
desktop application with no menus, cutscenes, or HUD.

**Core twist:** A hidden `/exit` command closes the game window to reveal the player's
real desktop — the player was always the person sitting at the computer.

**Current state:** Prototype/design phase. All files are design documents, scripts,
wireframes, and game content. No source code exists yet.

## Repository Structure

```
prototype/
├── PROJECT.md                    # Master project document — read this first
├── script/                       # Game scripts (what the player experiences)
│   ├── case00_boot.md            # Boot sequence, 8 beats
│   └── case01_investigation.md   # Phishing case, 12-step inference chain
├── wireframes/                   # UI design
│   └── case00_machine.html       # v1.0 reference layout (open in browser)
├── content/                      # In-game text assets (player reads these)
│   └── case01/                   # 11 evidence files for Case 01
│       ├── 01_phishing_sample.eml
│       ├── 02_domain_registration.txt
│       └── ... (numbered 01–11)
└── systems/                      # System design specs (how the engine works)
    ├── inference_engine_spec.md  # Keywords, output templates, unlock logic
    └── ui_interaction_spec.md    # Animations, drag-drop, sounds, colors
```

## Design Principles (MANDATORY — do not violate)

These are extracted from PROJECT.md and the scripts. Any implementation MUST respect them:

1. **No tutorial tone.** Never say "click here", "great job!", no guide arrows.
2. **Eda has no inner monologue.** She speaks only through inference output — work content, not feelings.
3. **All text is real.** Emails have full bodies, reports have full analysis, lists have 47 entries.
   Not icons or abstractions.
4. **`/exit` is always available, never prompted.** From the very first frame to the end.
5. **Capability unlock = player-initiated delegation, not system rewards.**
6. **Inference is iterative, not one-shot puzzles.** Players adjust context → infer → read → repeat.
7. **No celebration on case completion.** Quiet archival, like a real investigation system.

## Visual Direction

- **Desktop app aesthetic, NOT a game.** System gray tones (`#f0f0f0` bg, `#ddd` borders, `#333` text).
- Three-column layout: left nav sidebar | center document reader | right inference panel.
- Bottom status bar: system log + command line `>` + capability indicator lights.
- Window has fake OS title bar (red/yellow/green dots), menu bar, toolbar.
- **NOT terminal/hacker/amber-on-black style. NOT a web app.** It is desktop software.
- UI language is **Chinese** (e.g., "推理" not "INFER", "上下文" not "CONTEXT").

## Key Game Systems

### Context Curation (Core Mechanic #1)

- Players select text in the document reader and drag it into the context panel.
- Each text block consumes a **percentage** of capacity (not slots).
- Capacity bar: 0–50% blue → 50–80% orange → 80–100% red → overflow blocked.
- Historical inputs/outputs also count toward capacity.
- Blocks can be deleted, reordered at any time.

### Inference Engine (Core Mechanic #2)

- **NOT real-time LLM generation.** Pre-written templates matched by keywords.
- Keyword matching: fuzzy contains-match, deduplicated across blocks.
- Three output grades:
  - **A (complete):** All ★★★ keywords + ≥1 ★★ → full analysis + trigger word → unlocks next evidence.
  - **B (partial):** ≥1 ★★★ but missing others → incomplete analysis with `[数据不足]` gaps.
  - **C (fail):** No ★★★ keywords → "Insufficient context" message.
- **Noise dilution:** Irrelevant content in context makes output verbose and unfocused.
- See `systems/inference_engine_spec.md` for the full keyword tables per step.

### Progressive Evidence Unlock (Core Mechanic #3)

- Each inference output may contain a **trigger word** (name, domain, phone number).
- System detects trigger word → pushes next evidence file to sidebar.
- Only A-grade output guarantees the trigger word. B-grade has ~50% chance.

### Capability Delegation (Core Mechanic #4)

- 7 indicator lights: CTX CMP WEB MEM TOOL EXEC CODE. Only CTX starts lit.
- Each capability unlocks when the player voluntarily delegates a tedious task to Eda.
- NOT a reward system — player-initiated.

## Naming Conventions

- **File names:** lowercase English + underscores, e.g., `phishing_sample.eml`
- **Case numbers:** `CASE-2041-NNNN`
- **Evidence file prefix:** two-digit sequence number, e.g., `01_`, `02_`
- **Script files:** `caseNN_description.md`
- **System docs:** `description_spec.md`
- **Game content:** stored in `content/caseNN/` with real file extensions (`.eml`, `.txt`, `.rpt`)

## Implementation Priority (from PROJECT.md)

### P0 — Playable (MVP)

1. Window frame (title bar + three-column layout + status bar)
2. Document reader (open files, tab switching, text selection)
3. Context panel (drag-drop, percentage calculation, block deletion)
4. Inference engine (keyword matching → A-grade output → trigger word detection → evidence unlock)
5. Case 00 boot sequence
6. Case 01 full 12-step flow

### P1 — Good

7. Boot animations (scan line, token candidate flickering)
8. B/C-grade inference output variants
9. Noise dilution effects
10. Sound effects
11. Command line system (`/help`, `/exit` + hidden achievements)

### P2 — Complete

12. Case 02+ content
13. Capability delegation system
14. Ending sequence
15. Save/load

## Build / Lint / Test

**Not applicable yet — no source code exists.** When implementation begins, update this
section with the chosen tech stack's commands.

Expected commands once implemented:
- Build: TBD
- Lint: TBD
- Test: TBD
- Single test: TBD
- Dev server: TBD

## Key Color Values

| Element | Color |
|---------|-------|
| Background | `#f0f0f0` |
| Border | `#ddd` |
| Body text | `#333` / `#222` |
| Accent / links | `#4a9eff` |
| Sidebar active | `#1a237e` |
| OK status | green |
| Wait status | yellow |
| Error | `#f44336` |
| Muted text | `#888` / `#999` / `#ccc` |
| Context bar 0–50% | `#4a9eff` (blue) |
| Context bar 50–80% | `#ff9800` (orange) |
| Context bar 80–100% | `#f44336` (red) |

## Important Files to Read Before Implementing

1. `prototype/PROJECT.md` — 5 min, establishes the whole picture
2. `prototype/wireframes/case00_machine.html` — visual layout reference
3. `prototype/script/case00_boot.md` — boot sequence + core mechanic introduction
4. `prototype/systems/inference_engine_spec.md` — keyword tables + output templates
5. `prototype/systems/ui_interaction_spec.md` — all UI behavior specifications

## Language Notes

- All design docs are written in **Chinese**.
- Game UI text is in **Chinese**.
- Game content (evidence files) is in **Chinese**.
- Code comments and commit messages may be in either language.
- This AGENTS.md is in English for compatibility with coding agents.
