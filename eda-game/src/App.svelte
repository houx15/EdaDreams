<script lang="ts">
  import BootScene from './scenes/BootScene.svelte';
  import GameplayLayout from './scenes/GameplayLayout.svelte';
  import { gameState } from '$lib/state/game.svelte';
  import { contextState } from '$lib/state/context.svelte';

  let selectionButton = $state<{ x: number; y: number; text: string } | null>(null);
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  function globalMouseUp(): void {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';

    if (!text) {
      selectionButton = null;
      return;
    }

    const anchorNode = selection!.anchorNode;
    if (anchorNode) {
      const el = anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement;
      if (!el) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.closest('input, textarea')) {
        return;
      }
      if (el.closest('.nav-item') || el.closest('.doc-tab')) {
        return;
      }
    }

    const range = selection!.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();

    selectionButton = {
      x: rangeRect.left + rangeRect.width / 2,
      y: rangeRect.top - 36,
      text,
    };

    hideTimeout = setTimeout(() => {
      selectionButton = null;
    }, 3000);
  }

  function handleAddToContext(): void {
    if (!selectionButton) return;

    contextState.addBlock(selectionButton.text, 'evidence');
    selectionButton = null;

    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    window.getSelection()?.removeAllRanges();
  }

  $effect(() => {
    window.addEventListener('mouseup', globalMouseUp);
    return () => {
      window.removeEventListener('mouseup', globalMouseUp);
    };
  });
</script>

{#if gameState.phase === 'boot' || gameState.phase === 'briefing'}
  <BootScene />
{:else}
  <GameplayLayout />
{/if}

{#if selectionButton}
  <button
    class="global-selection-action"
    style="left: {selectionButton.x}px; top: {selectionButton.y}px;"
    onclick={handleAddToContext}
    type="button"
  >
    加入上下文
  </button>
{/if}

<style>
  .global-selection-action {
    position: fixed;
    background: var(--blue);
    color: #fff;
    border: 1px solid var(--blue-dark);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 500;
    padding: 4px 12px;
    cursor: pointer;
    white-space: nowrap;
    z-index: 9999;
    border-radius: 2px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transform: translateX(-50%);
    user-select: none;
    -webkit-user-select: none;
  }
  .global-selection-action:hover {
    background: #2458a0;
  }
</style>
