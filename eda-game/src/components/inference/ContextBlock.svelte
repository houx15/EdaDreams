<script lang="ts">
  import type { ContextBlock as ContextBlockType } from '$lib/engine/types';

  interface Props {
    block: ContextBlockType;
    onDelete: (id: string) => void;
  }

  let { block, onDelete }: Props = $props();
  let expanded = $state(false);

  function toggleExpand() {
    expanded = !expanded;
  }

  function handleDelete(e: Event) {
    e.stopPropagation();
    onDelete(block.id);
  }
</script>

<div
  class="ctx-block"
  class:expanded
  onclick={toggleExpand}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && toggleExpand()}>
  <span class="text">{block.text}</span>
  <span class="pct">[{block.percentage.toFixed(1)}%]</span>
  <button
    class="delete-btn"
    onclick={handleDelete}
    aria-label="删除上下文块"
    type="button"
  >
    ×
  </button>
</div>

<style>
  .ctx-block {
    background: var(--bg-white);
    border: 1px solid var(--border);
    padding: 3px 8px;
    font-size: 11px;
    color: var(--text);
    display: flex;
    align-items: flex-start;
    gap: 6px;
    cursor: pointer;
    border-radius: 2px;
    min-height: 24px;
  }

  .ctx-block:hover {
    border-color: var(--border-dark);
  }

  .ctx-block .text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
  }

  .ctx-block.expanded .text {
    -webkit-line-clamp: unset;
    white-space: pre-wrap;
    max-height: 120px;
    overflow-y: auto;
  }

  .ctx-block .pct {
    color: #999;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .delete-btn {
    color: var(--text-light);
    font-size: 14px;
    line-height: 1;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn:hover {
    color: var(--red);
  }
</style>
