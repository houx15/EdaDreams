<script lang="ts">
  import TitleBar from '../components/shell/TitleBar.svelte';
  import Sidebar from '../components/sidebar/Sidebar.svelte';
  import DocumentArea from '../components/reader/DocumentArea.svelte';
  import InferencePanel from '../components/inference/InferencePanel.svelte';
  import StatusBar from '../components/shell/StatusBar.svelte';
  import { gameState } from '$lib/state/game.svelte';
  import { inferenceState } from '$lib/state/inference.svelte';
  import { BRIEFING_EMAIL } from '$lib/data/case00';
  import { CASE01_EVIDENCE } from '$lib/data/case01';
  import type { EvidenceFile } from '$lib/engine/types';

  const MAX_TABS = 5;

  const ALL_EVIDENCE_MAP: Record<string, EvidenceFile> = {};
  ALL_EVIDENCE_MAP[BRIEFING_EMAIL.id] = BRIEFING_EMAIL;
  for (const e of CASE01_EVIDENCE) {
    ALL_EVIDENCE_MAP[e.id] = e;
    ALL_EVIDENCE_MAP[e.filename] = e;
  }

  let openTabs = $state<EvidenceFile[]>([BRIEFING_EMAIL]);
  let activeTab = $state<EvidenceFile | null>(BRIEFING_EMAIL);

  let showAchievement = $state(false);
  let showExitOverlay = $state(false);

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

  function handleExit(): void {
    if (gameState.phase !== 'case_closed') {
      showAchievement = true;
      setTimeout(() => {
        showAchievement = false;
        showExitOverlay = true;
      }, 3000);
    } else {
      showExitOverlay = true;
    }
  }

  function handleClear(): void {
    inferenceState.clearHistory();
  }

  const exitOverlayText = $derived(
    gameState.phase === 'case_closed'
      ? 'EDA v4.1 — 会话已结束 · 感谢使用'
      : 'EDA v4.1 — 会话已结束',
  );
</script>

<div class="app-layout">
  <TitleBar />
  <Sidebar onSelect={handleEvidenceSelect} />
  <DocumentArea
    tabs={openTabs}
    {activeTab}
    onTabClick={handleTabClick}
    onTabClose={handleTabClose}
  />
  <InferencePanel onUnlock={handleUnlock} />
  <StatusBar onExit={handleExit} onClear={handleClear} />
</div>

{#if showAchievement}
  <div class="achievement-overlay">
    <div class="achievement-card">
      <div class="achievement-icon">🔓</div>
      <div class="achievement-title">隐藏成就解锁：好奇心杀死猫</div>
      <div class="achievement-desc">"你试了 /exit。大多数人不会。"</div>
    </div>
  </div>
{/if}

{#if showExitOverlay}
  <div class="exit-overlay">
    <div class="exit-text">{exitOverlayText}</div>
    <div class="exit-hint">关闭此窗口以退出</div>
  </div>
{/if}

<style>
  .achievement-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    animation: fade-in 0.3s ease;
  }

  .achievement-card {
    background: #1a1a2e;
    border: 1px solid #4a9eff;
    border-radius: 8px;
    padding: 24px 32px;
    text-align: center;
    animation: slide-up 0.4s ease;
  }

  .achievement-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .achievement-title {
    color: #4a9eff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .achievement-desc {
    color: #999;
    font-size: 12px;
    font-style: italic;
  }

  .exit-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #000;
    z-index: 1001;
    animation: fade-in 0.5s ease;
  }

  .exit-text {
    color: #666;
    font-size: 14px;
    font-family: var(--font-mono, monospace);
  }

  .exit-hint {
    color: #444;
    font-size: 11px;
    margin-top: 12px;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
