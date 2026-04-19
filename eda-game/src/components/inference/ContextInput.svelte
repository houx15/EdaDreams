<script lang="ts">
  import type { ContextBlock as ContextBlockType, CapacityInfo } from '$lib/engine/types';
  import { contextState } from '$lib/state/context.svelte';
  import CapacityBar from './CapacityBar.svelte';
  import ContextBlock from './ContextBlock.svelte';

  interface Props {
    blocks: ContextBlockType[];
    capacity: CapacityInfo;
    onDeleteBlock: (id: string) => void;
  }

  let { blocks, capacity, onDeleteBlock }: Props = $props();

  let hasShownCapacityWarning = $state(false);
  let showCapacityWarning = $state(false);
  let warningTimeout: ReturnType<typeof setTimeout> | null = null;
  let isDragOver = $state(false);
  let showOverflowMessage = $state(false);
  let overflowTimeout: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const pct = capacity.percentage;
    if (pct >= 80 && !hasShownCapacityWarning) {
      hasShownCapacityWarning = true;
      showCapacityWarning = true;
      if (warningTimeout) clearTimeout(warningTimeout);
      warningTimeout = setTimeout(() => {
        showCapacityWarning = false;
      }, 3000);
    }
  });

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const text = e.dataTransfer?.getData('text/plain');
    if (!text || !text.trim()) return;

    if (contextState.canAddBlock(text)) {
      contextState.addBlock(text, 'evidence');
    } else {
      showOverflowMessage = true;
      if (overflowTimeout) clearTimeout(overflowTimeout);
      overflowTimeout = setTimeout(() => {
        showOverflowMessage = false;
      }, 2000);
    }
  }
</script>

<div
  class="inf-context"
  class:drag-over={isDragOver}
  role="region"
  aria-label="上下文输入区域"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <div class="panel-header">
    <span class="indicator on"></span>
    上下文输入
    <span class="extra">从左侧文档中选取关键信息拖入</span>
  </div>

  <CapacityBar {capacity} />

  <div class="ctx-blocks">
    {#if showCapacityWarning}
      <div class="capacity-warning">
        ⚠ 上下文容量已达 {Math.round(capacity.percentage)}% · Eda 的处理窗口有限，需精选关键信息
      </div>
    {/if}
    {#if showOverflowMessage}
      <div class="overflow-message">
        CONTEXT OVERFLOW
      </div>
    {/if}
    {#each blocks as block (block.id)}
      <ContextBlock {block} onDelete={onDeleteBlock} />
    {:else}
      <div class="ctx-hint">尚未添加上下文块</div>
    {/each}
  </div>
</div>

<style>
  .inf-context {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--border-dark);
    overflow: hidden;
  }

  .panel-header {
    background: linear-gradient(to bottom, #e8e9ec, #dddee2);
    border-bottom: 1px solid var(--border);
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 26px;
  }

  .panel-header .indicator {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-light);
  }

  .panel-header .indicator.on {
    background: var(--green);
  }

  .panel-header .extra {
    margin-left: auto;
    font-weight: 400;
    color: var(--text-sec);
    font-size: 10px;
  }

  .ctx-blocks {
    flex: 1;
    padding: 6px 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
  }

  .ctx-hint {
    padding: 4px 12px 2px;
    font-size: 10px;
    color: var(--text-light);
    font-style: italic;
  }

  .capacity-warning {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 10px;
    color: var(--text);
    background: #f5f5f5;
    border-left: 3px solid #ff9800;
    padding: 4px 8px;
    margin-bottom: 4px;
    animation: fadeIn 0.2s ease-out;
  }

  .overflow-message {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 10px;
    color: var(--red);
    background: #fff5f5;
    border-left: 3px solid var(--red);
    padding: 4px 8px;
    margin-bottom: 4px;
    animation: fadeIn 0.2s ease-out;
  }

  .inf-context.drag-over {
    border: 2px dashed #4a9eff;
    background: rgba(74, 158, 255, 0.05);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
