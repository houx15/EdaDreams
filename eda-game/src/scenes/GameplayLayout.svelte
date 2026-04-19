<script lang="ts">
  import TitleBar from '../components/shell/TitleBar.svelte';
  import Sidebar from '../components/sidebar/Sidebar.svelte';
  import WorkbenchArea from '../components/reader/WorkbenchArea.svelte';
  import InferencePanel from '../components/inference/InferencePanel.svelte';
  import StatusBar from '../components/shell/StatusBar.svelte';
  import { gameState } from '$lib/state/game.svelte';
  import { inferenceState } from '$lib/state/inference.svelte';
import { evidenceManagerV2 } from '$lib/state/evidence-v2.svelte';
import { INITIAL_EVIDENCE, MEMO_EVIDENCE, ATTACHMENT_EVIDENCE } from '$lib/data/evidence-factory';
import { loadTextContent } from '$lib/data/loaders';
import { getEvidenceContent, clearEvidenceContentCache } from '$lib/state/evidence-content-cache';
  import type { EvidenceFile, WorkbenchTab, EvidenceItem } from '$lib/engine/types';
  import { onMount } from 'svelte';

  const MAX_TABS = 5;

  let evidenceCache = $state<Record<string, EvidenceFile>>({});
  let openTabs = $state<WorkbenchTab[]>([]);
  let activeTab = $state<WorkbenchTab | null>(null);
  let showAchievement = $state(false);
  let showExitOverlay = $state(false);

  onMount(() => {
    evidenceManagerV2.reset();
    clearEvidenceContentCache();
    for (const item of INITIAL_EVIDENCE) {
      evidenceManagerV2.unlock(item);
    }
    evidenceManagerV2.unlock(MEMO_EVIDENCE);
    evidenceManagerV2.unlock(ATTACHMENT_EVIDENCE);

    loadEvidenceContent(INITIAL_EVIDENCE[0]).then((file) => {
      const briefingTab: WorkbenchTab = {
        id: 'briefing_001',
        type: 'document',
        title: 'briefing_001.eml',
        evidenceFile: file,
      };
      openTabs = [briefingTab];
      activeTab = briefingTab;
    });
  });

  async function loadEvidenceContent(item: EvidenceItem): Promise<EvidenceFile> {
    if (evidenceCache[item.id]) {
      return evidenceCache[item.id];
    }

    const cachedContent = getEvidenceContent(item.id);
    const content = cachedContent ?? await loadTextContent(`/data/content/case01/${item.filename}`);
    const file: EvidenceFile = {
      id: item.id,
      filename: item.displayName,
      content,
      sizeLabel: item.sizeLabel,
      caseNumber: 'CASE-2041-0001',
      evidenceNumber: 0,
      tokenEstimate: item.tokenEstimate,
      percentageEstimate: item.percentageEstimate,
    };
    evidenceCache[item.id] = file;
    return file;
  }

  async function openEvidenceTab(item: EvidenceItem): Promise<void> {
    const existingTab = openTabs.find((t) => t.id === item.id);
    if (existingTab) {
      activeTab = existingTab;
      return;
    }

    if (openTabs.length >= MAX_TABS) {
      const removed = openTabs[0];
      openTabs = openTabs.slice(1);
      if (activeTab?.id === removed.id) {
        activeTab = openTabs[0] || null;
      }
    }

    const file = await loadEvidenceContent(item);
    const newTab: WorkbenchTab = {
      id: item.id,
      type: 'document',
      title: item.displayName,
      evidenceFile: file,
    };
    openTabs = [...openTabs, newTab];
    activeTab = newTab;
  }

  function openBrowserTab(url = '', title = '网页检索'): void {
    const existingTab = openTabs.find((t) => t.type === 'browser' && t.browserUrl === url);
    if (existingTab) {
      activeTab = existingTab;
      return;
    }

    if (openTabs.length >= MAX_TABS) {
      const removed = openTabs[0];
      openTabs = openTabs.slice(1);
      if (activeTab?.id === removed.id) {
        activeTab = openTabs[0] || null;
      }
    }

    const newTab: WorkbenchTab = {
      id: `browser_${Date.now()}`,
      type: 'browser',
      title,
      browserUrl: url,
    };
    openTabs = [...openTabs, newTab];
    activeTab = newTab;
  }

  function openPhoneTab(): void {
    const existingTab = openTabs.find((t) => t.type === 'phone');
    if (existingTab) {
      activeTab = existingTab;
      return;
    }

    if (openTabs.length >= MAX_TABS) {
      const removed = openTabs[0];
      openTabs = openTabs.slice(1);
      if (activeTab?.id === removed.id) {
        activeTab = openTabs[0] || null;
      }
    }

    const newTab: WorkbenchTab = {
      id: `phone_${Date.now()}`,
      type: 'phone',
      title: '通话',
    };
    openTabs = [...openTabs, newTab];
    activeTab = newTab;
  }

  function handleTabClick(tab: WorkbenchTab): void {
    activeTab = tab;
  }

  function handleTabClose(tab: WorkbenchTab): void {
    const index = openTabs.findIndex((t) => t.id === tab.id);
    if (index === -1) return;

    const newTabs = openTabs.filter((t) => t.id !== tab.id);
    openTabs = newTabs;

    if (activeTab?.id === tab.id) {
      if (newTabs.length > 0) {
        const newIndex = Math.min(index, newTabs.length - 1);
        activeTab = newTabs[newIndex];
      } else {
        activeTab = null;
      }
    }
  }

  function handleSidebarSelect(item: EvidenceItem, action: 'open' | 'browser' | 'phone'): void {
    if (action === 'open') {
      openEvidenceTab(item);
    } else if (action === 'browser') {
      openBrowserTab();
    } else if (action === 'phone') {
      openPhoneTab();
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
  <Sidebar onSelect={handleSidebarSelect} />
  <WorkbenchArea
    tabs={openTabs}
    {activeTab}
    onTabClick={handleTabClick}
    onTabClose={handleTabClose}
  />
  <InferencePanel />
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
