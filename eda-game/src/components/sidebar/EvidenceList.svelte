<script lang="ts">
  import { evidenceState } from '$lib/state';
  import { BRIEFING_EMAIL } from '$lib/data/case00';
  import { CASE01_EVIDENCE } from '$lib/data/case01';
  import type { EvidenceFile } from '$lib/engine/types';

  interface Props {
    onSelect?: (evidence: EvidenceFile) => void;
  }

  let { onSelect }: Props = $props();

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

  function handleClick(evidence: EvidenceFile): void {
    onSelect?.(evidence);
  }
</script>

<div class="evidence-list">
  {#each unlockedEvidence as evidence (evidence.id)}
    <div
      class="evidence-item"
      class:new={newlyUnlocked.has(evidence.id)}
      onclick={() => handleClick(evidence)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && handleClick(evidence)}
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

<style>
  .evidence-list {
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .evidence-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 3px;
    cursor: pointer;
    color: var(--text-sidebar);
    font-size: 11px;
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
