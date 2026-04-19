<script lang="ts">
  import { onMount } from 'svelte';
  import { evidenceManagerV2 } from '$lib/state/evidence-v2.svelte';
  import { MEMO_EVIDENCE } from '$lib/data/evidence-factory';
  import type { EvidenceItem } from '$lib/engine/types';
  import { getSharedStateMachine } from '$lib/state/state-machine-shared';
  import type { StateMachine } from '$lib/engine/state-machine';

  interface Props {
    onSelect?: (item: EvidenceItem, action: 'open' | 'browser' | 'phone') => void;
  }

  let { onSelect }: Props = $props();

  let evidenceExpanded = $state(true);
  let memoExpanded = $state(false);
  let toolsExpanded = $state(false);

  let stateMachine: StateMachine | null = $state(null);

  const toolLocks = $derived(
    stateMachine ? {
      bank_system: stateMachine.isUnlocked('bank_system'),
    } : {}
  );

  onMount(async () => {
    stateMachine = await getSharedStateMachine();
  });

  const unlockedEvidence = $derived(evidenceManagerV2.getAll());
  const memoItems = $derived([MEMO_EVIDENCE].filter((m) => evidenceManagerV2.isUnlocked(m.id)));

  const newlyUnlocked = $state<Set<string>>(new Set());

  $effect(() => {
    const current = new Set(evidenceManagerV2.getAll().map((i) => i.id));
    for (const id of current) {
      if (!newlyUnlocked.has(id)) {
        newlyUnlocked.add(id);
        setTimeout(() => {
          newlyUnlocked.delete(id);
        }, 3000);
      }
    }
  });

  function toggleEvidence(): void {
    evidenceExpanded = !evidenceExpanded;
  }

  function toggleMemo(): void {
    memoExpanded = !memoExpanded;
  }

  function toggleTools(): void {
    toolsExpanded = !toolsExpanded;
  }

  function handleEvidenceClick(item: EvidenceItem): void {
    onSelect?.(item, 'open');
  }

  function handleMemoClick(item: EvidenceItem): void {
    onSelect?.(item, 'open');
  }

  function handleBrowserClick(): void {
    onSelect?.(MEMO_EVIDENCE, 'browser');
  }

  function handlePhoneClick(): void {
    onSelect?.(MEMO_EVIDENCE, 'phone');
  }

  function handleBankToolClick(): void {
    if (!stateMachine?.isUnlocked('bank_system')) return;
    onSelect?.(MEMO_EVIDENCE, 'browser');
  }
</script>

<div class="nav-group">
  <div class="nav-group-title">工作台</div>

  <div class="nav-item" class:active={true}>
    <span class="ico">📋</span>
    案件概览
  </div>

  <div
    class="nav-item evidence-toggle"
    onclick={toggleEvidence}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && toggleEvidence()}
  >
    <span class="expand-icon" class:expanded={evidenceExpanded}>▶</span>
    <span class="ico">📁</span>
    证据材料
    <span class="badge">{unlockedEvidence.length}</span>
  </div>

  {#if evidenceExpanded && unlockedEvidence.length > 0}
    <div class="evidence-children">
      {#each unlockedEvidence as evidence (evidence.id)}
        <div
          class="evidence-item"
          class:new={newlyUnlocked.has(evidence.id)}
          onclick={() => handleEvidenceClick(evidence)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && handleEvidenceClick(evidence)}
        >
          <span class="evidence-icon">📄</span>
          <div class="evidence-info">
            <div class="evidence-filename">{evidence.displayName}</div>
            <div class="evidence-meta">
              {evidence.sizeLabel}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div
    class="nav-item evidence-toggle"
    onclick={toggleMemo}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && toggleMemo()}
  >
    <span class="expand-icon" class:expanded={memoExpanded}>▶</span>
    <span class="ico">📝</span>
    备忘
  </div>

  {#if memoExpanded && memoItems.length > 0}
    <div class="evidence-children">
      {#each memoItems as memo (memo.id)}
        <div
          class="evidence-item"
          onclick={() => handleMemoClick(memo)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && handleMemoClick(memo)}
        >
          <span class="evidence-icon">📝</span>
          <div class="evidence-info">
            <div class="evidence-filename">{memo.displayName}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<div class="nav-divider"></div>
<div class="nav-group">
  <div class="nav-group-title">工具</div>

  <div
    class="nav-item"
    onclick={handleBrowserClick}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && handleBrowserClick()}
  >
    <span class="ico">🌐</span>
    网页检索
  </div>

  <div
    class="nav-item"
    onclick={handlePhoneClick}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && handlePhoneClick()}
  >
    <span class="ico">☎</span>
    通话
  </div>

  <div
    class="nav-item tool-locked"
    class:tool-unlocked={toolLocks.bank_system}
    onclick={handleBankToolClick}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && handleBankToolClick()}
  >
    <span class="ico">🏦</span>
    银行系统
    {#if !toolLocks.bank_system}
      <span class="lock-icon">🔒</span>
    {:else}
      <span class="lock-icon">✅</span>
    {/if}
  </div>
</div>

<style>
  .nav-group {
    padding: 10px 6px 4px;
  }
  .nav-group-title {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.18em;
    padding: 0 8px 6px;
    text-transform: uppercase;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 3px;
    color: var(--text-sidebar);
    font-size: 12px;
    cursor: default;
    margin-bottom: 1px;
  }
  .nav-item:hover {
    background: var(--bg-sidebar-hover);
  }
  .nav-item.active {
    background: var(--bg-sidebar-active);
    color: var(--text-sidebar-active);
  }
  .nav-item .ico {
    width: 16px;
    text-align: center;
    font-size: 12px;
  }
  .nav-item .badge {
    margin-left: auto;
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.6);
    font-size: 9px;
    padding: 0px 6px;
    border-radius: 8px;
  }
  .nav-divider {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin: 6px 10px;
  }

  .evidence-toggle {
    cursor: pointer;
  }
  .evidence-toggle:hover {
    background: var(--bg-sidebar-hover);
  }

  .expand-icon {
    font-size: 8px;
    color: rgba(255, 255, 255, 0.5);
    width: 12px;
    text-align: center;
    transition: transform 0.15s ease;
    display: inline-block;
  }
  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  .evidence-children {
    overflow: hidden;
    animation: expand 0.2s ease-out;
  }
  @keyframes expand {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 500px;
    }
  }

  .evidence-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    padding-left: 24px;
    border-radius: 3px;
    cursor: pointer;
    color: var(--text-sidebar);
    font-size: 11px;
    margin-bottom: 1px;
  }
  .evidence-item:hover {
    background: var(--bg-sidebar-hover);
  }
  .evidence-item.new .evidence-filename {
    color: var(--accent);
  }
  .evidence-icon {
    font-size: 12px;
    opacity: 0.8;
  }
  .evidence-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .evidence-filename {
    font-size: 11px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 130px;
  }
  .evidence-meta {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
  }

  .tool-locked {
    opacity: 0.5;
    cursor: not-allowed !important;
  }
  .tool-unlocked {
    opacity: 1;
    cursor: pointer;
  }
  .lock-icon {
    margin-left: auto;
    font-size: 10px;
  }
</style>
