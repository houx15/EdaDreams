<script lang="ts">
  import TitleBar from '../components/shell/TitleBar.svelte';
  import Sidebar from '../components/sidebar/Sidebar.svelte';
  import DocumentArea from '../components/reader/DocumentArea.svelte';
  import InferencePanel from '../components/inference/InferencePanel.svelte';
  import { gameState } from '$lib/state/game.svelte';
  import { evidenceState } from '$lib/state/evidence.svelte';
  import { inferenceState } from '$lib/state/inference.svelte';
  import { BRIEFING_EMAIL } from '$lib/data/case00';
  import { CASE01_EVIDENCE } from '$lib/data/case01';
  import type { EvidenceFile } from '$lib/engine/types';
  import {
    BOOT_LOG_LINES,
    BOOT_GIBBERISH_LINES,
    BOOT_REVEAL_TEXT,
    BOOT_TOKEN_PREDICTION,
    POST_LOG_UPDATES,
  } from '$lib/data/boot';

  const MAX_TABS = 5;

  const ALL_EVIDENCE_MAP: Record<string, EvidenceFile> = {};
  ALL_EVIDENCE_MAP[BRIEFING_EMAIL.id] = BRIEFING_EMAIL;
  for (const e of CASE01_EVIDENCE) {
    ALL_EVIDENCE_MAP[e.id] = e;
    ALL_EVIDENCE_MAP[e.filename] = e;
  }

  // Boot animation state
  let visibleLogLines = $state<typeof BOOT_LOG_LINES>([]);
  let postUpdateLines = $state<{ line: string; status: 'ok' | 'wait' }[]>([]);
  let showCursor = $state(false);
  let scanning = $state(false);
  let scanProgress = $state(0);
  let scanComplete = $state(false);
  let isDragging = $state(false);
  let isDragOver = $state(false);
  let b2Visible = $state(false);
  let b3Fading = $state(false);
  let showInterface = $state(false);
  let ctxPulsing = $state(false);
  let statusMessage = $state('');

  // Token prediction state
  let typedTokens = $state<string[]>([]);
  let tokenIndex = $state(0);
  let showingCandidates = $state(false);
  let currentCandidates = $state<string[]>([]);
  let selectedCandidate = $state('');
  let tokenAnimating = $state(false);

  // Briefing phase state
  let openTabs = $state<EvidenceFile[]>([]);
  let activeTab = $state<EvidenceFile | null>(null);
  let briefingInitialized = $state(false);
  let showAcceptButton = $state(false);
  let acceptButtonShown = $state(false);

  // Boot sequence orchestration
  $effect(() => {
    if (gameState.phase === 'boot' && gameState.bootBeat === 'B0_post' && visibleLogLines.length === 0) {
      runB0();
    }
  });

  $effect(() => {
    if (gameState.phase === 'boot' && gameState.bootBeat === 'B2_next_token' && !b2Visible) {
      b2Visible = true;
      runB2();
    }
  });

  $effect(() => {
    if (gameState.phase === 'boot' && gameState.bootBeat === 'B3_self_concept' && !b3Fading) {
      b3Fading = true;
      runB3();
    }
  });

  $effect(() => {
    if (gameState.phase === 'boot' && gameState.bootBeat === 'B4_interface' && !showInterface) {
      runB4();
    }
  });

  $effect(() => {
    if (gameState.phase === 'briefing' && !briefingInitialized) {
      briefingInitialized = true;
      initBriefing();
    }
  });

  $effect(() => {
    if (gameState.phase === 'briefing' && inferenceState.latestResult && !acceptButtonShown) {
      acceptButtonShown = true;
      showAcceptButton = true;
    }
  });

  function runB0(): void {
    let delay = 500;
    BOOT_LOG_LINES.forEach((line, index) => {
      setTimeout(() => {
        visibleLogLines = [...visibleLogLines, line];
        if (index === BOOT_LOG_LINES.length - 1) {
          setTimeout(() => {
            showCursor = true;
            gameState.advanceBootBeat();
          }, 1500);
        }
      }, delay);
      delay += line.delay;
    });
  }

  function handleInitClick(): void {
    scanning = true;

    const startTime = performance.now();
    const duration = 1200;

    function step(now: number): void {
      const elapsed = now - startTime;
      scanProgress = Math.min(100, (elapsed / duration) * 100);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        scanning = false;
        scanComplete = true;
        updateLogForB1();
        setTimeout(() => {
          gameState.advanceBootBeat();
        }, 600);
      }
    }
    requestAnimationFrame(step);
  }

  function handleDragStart(event: DragEvent): void {
    isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  function handleDragEnd(): void {
    isDragging = false;
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDragEnter(): void {
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent): void {
    const wrap = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement | null;
    if (!related || !wrap.contains(related)) {
      isDragOver = false;
    }
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    isDragOver = false;
    isDragging = false;
    handleInitClick();
  }

  function updateLogForB1(): void {
    const b1Update = POST_LOG_UPDATES.find((u) => u.beat === 'B1');
    if (b1Update) {
      postUpdateLines = [{ line: b1Update.line, status: 'ok' }];
    }
  }

  function runB2(): void {
    const { tokens, candidates, pauses } = BOOT_TOKEN_PREDICTION;
    tokenAnimating = true;

    function typeNextToken(): void {
      if (tokenIndex >= tokens.length) {
        tokenAnimating = false;
        setTimeout(() => {
          const b2Update = POST_LOG_UPDATES.find((u) => u.beat === 'B2');
          if (b2Update) {
            postUpdateLines = [...postUpdateLines, { line: b2Update.line, status: 'ok' }];
          }
          setTimeout(() => {
            gameState.advanceBootBeat();
          }, 800);
        }, 1000);
        return;
      }

      const pauseHere = pauses.includes(tokenIndex);
      const pauseDuration = pauseHere ? 800 : 0;
      const tokenDelay = 300 + Math.random() * 200 + pauseDuration;

      showingCandidates = true;
      currentCandidates = candidates[tokenIndex];
      selectedCandidate = '';

      setTimeout(() => {
        selectedCandidate = tokens[tokenIndex];
        typedTokens = [...typedTokens, tokens[tokenIndex]];
        showingCandidates = false;
        tokenIndex += 1;
        setTimeout(typeNextToken, tokenDelay);
      }, 150);
    }

    setTimeout(typeNextToken, 400);
  }

  function runB3(): void {
    const b3Updates = POST_LOG_UPDATES.filter((u) => u.beat === 'B3');
    let delay = 200;
    b3Updates.forEach((update, index) => {
      setTimeout(() => {
        postUpdateLines = [...postUpdateLines, { line: update.line, status: update.line.includes('WAIT') ? 'wait' : 'ok' }];
        if (index === b3Updates.length - 1) {
          setTimeout(() => {
            gameState.advanceBootBeat();
          }, 800);
        }
      }, delay);
      delay += 350;
    });
  }

  function runB4(): void {
    showInterface = true;
    setTimeout(() => {
      ctxPulsing = true;
      setTimeout(() => {
        ctxPulsing = false;
        gameState.transitionToBriefing();
      }, 500);
    }, 1500);
  }

  function initBriefing(): void {
    evidenceState.unlock('briefing_001');
    statusMessage = '简报已送达 · case_001';
    setTimeout(() => {
      handleEvidenceSelect(BRIEFING_EMAIL);
    }, 300);
  }

  function handleTabClick(evidence: EvidenceFile): void {
    activeTab = evidence;
  }

  function handleTabClose(evidence: EvidenceFile): void {
    const index = openTabs.findIndex((t) => t.id === evidence.id);
    if (index === -1) return;

    const newTabs = openTabs.filter((t) => t.id !== evidence.id);
    openTabs = newTabs;

    if (activeTab?.id === evidence.id) {
      if (newTabs.length > 0) {
        const newIndex = Math.min(index, newTabs.length - 1);
        activeTab = newTabs[newIndex];
      } else {
        activeTab = null;
      }
    }
  }

  function handleEvidenceSelect(evidence: EvidenceFile): void {
    const alreadyOpen = openTabs.find((t) => t.id === evidence.id);
    if (alreadyOpen) {
      activeTab = alreadyOpen;
      return;
    }

    if (openTabs.length >= MAX_TABS) {
      return;
    }

    openTabs = [...openTabs, evidence];
    activeTab = evidence;
  }

  function handleUnlock(event: { evidenceId: string }): void {
    const evidence = ALL_EVIDENCE_MAP[event.evidenceId];
    if (evidence) {
      handleEvidenceSelect(evidence);
    }
  }

  function handleAcceptCase(): void {
    showAcceptButton = false;
    statusMessage = 'case_001: accepted · 等待后续证据';
    evidenceState.unlock('evidence_01');
    gameState.transitionToGameplay();
  }
</script>

<div class="app-layout boot-scene">
  <TitleBar />

  {#if gameState.phase === 'boot'}
    <div class="boot-center" class:fade-out={showInterface}>
      <div class="boot-content">
        <div class="log-header">EDA v4.1 — POWER ON SELF TEST</div>
        <div class="log-lines">
          {#each visibleLogLines as line}
            {@const canDrag = line.status === 'wait' && gameState.bootBeat === 'B1_tokenizer' && !scanComplete}
            <div
              class="log-line"
              class:ok={line.status === 'ok'}
              class:wait={line.status === 'wait'}
              class:draggable={canDrag}
              class:dragging={isDragging && canDrag}
              role={canDrag ? 'button' : undefined}
              draggable={canDrag}
              ondragstart={canDrag ? handleDragStart : undefined}
              ondragend={canDrag ? handleDragEnd : undefined}
            >
              {line.text}
            </div>
          {/each}
          {#each postUpdateLines as line}
            <div class="log-line" class:ok={line.status === 'ok'} class:wait={line.status === 'wait'}>
              {line.line}
            </div>
          {/each}
        </div>

        {#if gameState.bootBeat !== 'B0_post'}
          <div class="tokenizer-area">
            {#if !scanComplete}
              <div
                class="gibberish-wrap"
                class:drag-over={isDragOver}
                role="region"
                ondragover={handleDragOver}
                ondragenter={handleDragEnter}
                ondragleave={handleDragLeave}
                ondrop={handleDrop}
              >
                {#each BOOT_GIBBERISH_LINES as line}
                  <div class="gibberish-line">{line}</div>
                {/each}
                <div
                  class="reveal-overlay"
                  style="clip-path: inset(0 calc(100% - {scanProgress}%) 0 0)"
                >
                  {#each BOOT_REVEAL_TEXT as line}
                    <div class="reveal-line">{line}</div>
                  {/each}
                </div>
              </div>
              {#if scanning}
                <div class="scan-line" style="left: {scanProgress}%;"></div>
              {/if}
            {:else}
              <div class="reveal-text">
                {#each BOOT_REVEAL_TEXT as line}
                  <div class="reveal-line">{line}</div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if b2Visible}
          <div class="token-area" class:fade-out={b3Fading && gameState.bootBeat !== 'B2_next_token'}>
            <div class="typed-line">
              {#each typedTokens as token}
                <span class="token">{token}</span>
              {/each}
              {#if tokenAnimating}
                <span class="tok-cursor"></span>
                {#if showingCandidates && currentCandidates.length > 0}
                  <span class="candidate-group">
                    {#each currentCandidates as cand}
                      <span class="candidate" class:sel={cand === selectedCandidate && selectedCandidate !== ''}>{cand}</span>
                    {/each}
                  </span>
                {/if}
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="sidebar-wrap" class:visible={showInterface}>
   <Sidebar onSelect={(_, action) => { /* BootScene sidebar selection not used */ }} />
    </div>
    <div class="docarea-wrap" class:visible={showInterface}>
      <DocumentArea tabs={openTabs} {activeTab} onTabClick={handleTabClick} onTabClose={handleTabClose} />
    </div>
    <div class="inference-wrap" class:visible={showInterface}>
      <InferencePanel onUnlock={handleUnlock} />
    </div>
  {:else if gameState.phase === 'briefing'}
    <Sidebar onSelect={(_, action) => { if (action === 'open') handleEvidenceSelect(BRIEFING_EMAIL); }} />
    <DocumentArea tabs={openTabs} {activeTab} onTabClick={handleTabClick} onTabClose={handleTabClose} />
    <InferencePanel onUnlock={handleUnlock} />
  {/if}

  <div class="boot-footer">
    <span class="status-msg">{statusMessage}</span>
    <span class="spacer"></span>
    <div class="cmd-line">
      <span class="prompt">&gt;</span>
      <span class="cursor" class:blink={showCursor}></span>
    </div>
    <div class="caps">
      {#each ['CTX', 'CMP', 'WEB', 'MEM', 'TOOL', 'EXEC', 'CODE'] as cap, i}
        <span class="cap" class:on={i === 0} class:pulse={i === 0 && ctxPulsing}>{cap}</span>
      {/each}
    </div>
  </div>

  {#if showAcceptButton}
    <button class="accept-btn" onclick={handleAcceptCase} type="button">[ 接受案件 ]</button>
  {/if}
</div>

<style>
  .boot-scene {
    position: relative;
  }

  .boot-center {
    grid-column: sidebar / inference-end;
    grid-row: 2;
    background: var(--bg-panel);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .boot-center.fade-out {
    opacity: 0;
    transform: translateY(-20px);
    pointer-events: none;
  }

  .boot-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    font-family: var(--font-mono);
    padding: 40px;
  }

  .log-header {
    font-size: 14px;
    color: var(--text-sec);
    letter-spacing: 0.05em;
  }

  .log-lines {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    line-height: 1.5;
  }

  .log-line {
    opacity: 0;
    animation: fadeInLeft 0.1s ease forwards;
  }

  .log-line.ok {
    color: var(--green);
  }

  .log-line.wait {
    color: var(--orange);
  }

  .log-line.wait.draggable {
    cursor: grab;
  }

  .log-line.wait.draggable:hover {
    filter: brightness(1.2);
  }

  .log-line.wait.dragging {
    opacity: 0.6;
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .tokenizer-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    position: relative;
    min-width: 320px;
  }

  .gibberish-wrap {
    position: relative;
    background: #e8e8e8;
    padding: 16px 20px;
    border-radius: 2px;
    transition: box-shadow 0.15s ease, background 0.15s ease;
  }

  .gibberish-wrap.drag-over {
    box-shadow: 0 0 0 2px #4a9eff, 0 0 12px rgba(74, 158, 255, 0.4);
    background: #f0f7ff;
  }

  .gibberish-line {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
    white-space: pre;
    font-family: var(--font-mono);
    user-select: none;
  }

  .reveal-overlay {
    position: absolute;
    top: 16px;
    left: 20px;
    right: 20px;
    bottom: 16px;
    pointer-events: none;
  }

  .reveal-overlay .reveal-line {
    font-size: 18px;
    color: #222;
    line-height: 1.6;
    white-space: pre;
    font-family: var(--font-ui);
  }

  .reveal-text .reveal-line {
    font-size: 18px;
    color: #222;
    line-height: 1.6;
    white-space: pre;
    font-family: var(--font-ui);
  }

  .scan-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #4a9eff;
    box-shadow: 0 0 8px #4a9eff;
    transform: translateX(-1px);
    pointer-events: none;
  }

  .token-area {
    margin-top: 8px;
    min-height: 60px;
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .token-area.fade-out {
    opacity: 0;
    transform: translateY(-12px);
  }

  .typed-line {
    font-size: 18px;
    color: #222;
    line-height: 1.7;
    font-family: var(--font-ui);
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px;
    max-width: 420px;
  }

  .token {
    display: inline;
  }

  .tok-cursor {
    display: inline-block;
    width: 2px;
    height: 18px;
    background: #222;
    animation: blink 1s step-end infinite;
    margin-left: 2px;
    vertical-align: text-bottom;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .candidate-group {
    display: inline-flex;
    gap: 4px;
    margin-left: 4px;
  }

  .candidate {
    color: #999;
    opacity: 0.4;
    animation: candPulse 0.15s ease forwards;
  }

  .candidate.sel {
    color: #222;
    opacity: 1;
    font-weight: 500;
  }

  @keyframes candPulse {
    from {
      opacity: 0.3;
    }
    to {
      opacity: 1;
    }
  }

  .sidebar-wrap {
    grid-area: sidebar;
    transform: translateX(-180px);
    opacity: 0;
    transition: transform 0.6s ease-out 0.3s, opacity 0.6s ease-out 0.3s;
  }

  .sidebar-wrap.visible {
    transform: translateX(0);
    opacity: 1;
  }

  .docarea-wrap {
    grid-area: docarea;
    opacity: 0;
    transition: opacity 0.8s ease 0.3s;
  }

  .docarea-wrap.visible {
    opacity: 1;
  }

  .inference-wrap {
    grid-area: inference;
    transform: translateX(360px);
    opacity: 0;
    transition: transform 0.6s ease-out 0.3s, opacity 0.6s ease-out 0.3s;
  }

  .inference-wrap.visible {
    transform: translateX(0);
    opacity: 1;
  }

  .boot-footer {
    grid-area: footer;
    background: var(--bg-toolbar);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 10px;
    gap: 12px;
    font-size: 10px;
    color: var(--text-light);
  }

  .status-msg {
    max-width: 350px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .spacer {
    flex: 1;
  }

  .cmd-line {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-light);
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .cmd-line .prompt {
    color: var(--text-sec);
  }

  .cursor {
    display: inline-block;
    width: 5px;
    height: 11px;
    background: var(--text-light);
  }

  .cursor.blink {
    animation: blink 1s step-end infinite;
  }

  .caps {
    display: flex;
    gap: 3px;
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.03em;
  }

  .cap {
    padding: 1px 4px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    color: var(--text-light);
  }

  .cap.on {
    background: var(--blue-light);
    border-color: #a0c4e8;
    color: var(--blue);
    font-weight: 600;
  }

  .cap.pulse {
    animation: capPulse 0.3s ease 1;
  }

  @keyframes capPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(41, 104, 176, 0);
    }
    50% {
      box-shadow: 0 0 6px 2px rgba(41, 104, 176, 0.4);
    }
  }

  .accept-btn {
    position: absolute;
    grid-area: inference;
    align-self: end;
    justify-self: center;
    margin-bottom: 24px;
    background: #fff;
    border: 1px solid var(--border-dark);
    border-radius: 4px;
    padding: 8px 28px;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    font-family: var(--font-ui);
    z-index: 20;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .accept-btn:hover {
    background: #f5f5f5;
  }

  /* Sidebar content fade-in during B4 */
  :global(.sidebar-wrap.visible .id-card),
  :global(.sidebar-wrap.visible .nav-group-title),
  :global(.sidebar-wrap.visible .nav-item),
  :global(.sidebar-wrap.visible .nav-divider),
  :global(.sidebar-wrap.visible .evidence-item) {
    opacity: 0;
    animation: sidebarItemIn 0.3s ease forwards;
  }

  :global(.sidebar-wrap.visible .id-card) { animation-delay: 1.0s; }
  :global(.sidebar-wrap.visible .nav-group-title) { animation-delay: 1.08s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(1)) { animation-delay: 1.12s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(2)) { animation-delay: 1.16s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(3)) { animation-delay: 1.20s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(4)) { animation-delay: 1.24s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(5)) { animation-delay: 1.28s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(6)) { animation-delay: 1.32s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(7)) { animation-delay: 1.36s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(8)) { animation-delay: 1.40s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(9)) { animation-delay: 1.44s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(10)) { animation-delay: 1.48s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(11)) { animation-delay: 1.52s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(12)) { animation-delay: 1.56s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(13)) { animation-delay: 1.60s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(14)) { animation-delay: 1.64s; }
  :global(.sidebar-wrap.visible .nav-item:nth-child(15)) { animation-delay: 1.68s; }
  :global(.sidebar-wrap.visible .nav-divider) { animation-delay: 1.72s; }
  :global(.sidebar-wrap.visible .evidence-item) { animation-delay: 1.76s; }

  @keyframes sidebarItemIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
