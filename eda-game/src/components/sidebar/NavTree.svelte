<script lang="ts">
  import { evidenceState } from '$lib/state';
  import { BRIEFING_EMAIL } from '$lib/data/case00';
  import { CASE01_EVIDENCE } from '$lib/data/case01';
  import type { EvidenceFile } from '$lib/engine/types';

  interface Props {
    onSelect?: (evidence: EvidenceFile) => void;
  }

  let { onSelect }: Props = $props();

  let evidenceExpanded = $state(false);

  const allEvidence = $derived([BRIEFING_EMAIL, ...CASE01_EVIDENCE]);
  const unlockedEvidence = $derived(
    allEvidence.filter((e) => evidenceState.isUnlocked(e.id))
  );

  const newlyUnlocked = $state<Set<string>>(new Set());

  $effect(() => {
    const current = new Set(evidenceState.unlockedIds);
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

  function handleEvidenceClick(evidence: EvidenceFile): void {
    onSelect?.(evidence);
  }

  const workbenchItems = [
    { icon: '📋', label: '案件概览', active: true },
  ];

  const toolItems: { icon: string; label: string; locked: boolean }[] = [];
</script>

<div class="nav-group">
  <div class="nav-group-title">工作台</div>
  {#each workbenchItems as item}
    <div class="nav-item" class:active={item.active}>
      <span class="ico">{item.icon}</span>
      {item.label}
    </div>
  {/each}

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
    <span class="badge">{evidenceState.badgeCount}</span>
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
            <div class="evidence-filename">{evidence.filename}</div>
            <div class="evidence-meta">
              {evidence.caseNumber} · 证据 #{String(evidence.evidenceNumber).padStart(2, '0')} · {evidence.sizeLabel}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if toolItems.length > 0}
  <div class="nav-divider"></div>
  <div class="nav-group">
    <div class="nav-group-title">工具</div>
    {#each toolItems as item}
      <div class="nav-item locked">
        <span class="ico">{item.icon}</span>
        {item.label}
        <span class="lock">🔒</span>
      </div>
    {/each}
  </div>
{/if}

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
  .nav-item.locked {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .nav-item.locked .lock {
    margin-left: auto;
    font-size: 9px;
    opacity: 0.5;
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
</style>
