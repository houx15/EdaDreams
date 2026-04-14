<script lang="ts">
  import { commandState } from '$lib/state/command.svelte';

  interface Props {
    onCommand?: (cmd: 'exit' | 'help' | 'status' | 'clear' | null) => void;
  }

  let { onCommand }: Props = $props();

  let inputRef = $state<HTMLInputElement | null>(null);
  let showAutocomplete = $state(false);
  let selectedIndex = $state(0);

  function focusInput() {
    inputRef?.focus();
  }

  function handleInput() {
    const value = commandState.input;
    if (value.startsWith('/')) {
      showAutocomplete = true;
      selectedIndex = 0;
    } else {
      showAutocomplete = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!showAutocomplete) {
      if (e.key === 'Enter') {
        const result = commandState.execute();
        onCommand?.(result);
        showAutocomplete = false;
      }
      return;
    }

    const items = commandState.autocompleteItems;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        break;
      case 'Enter':
        e.preventDefault();
        commandState.setInput(items[selectedIndex]);
        const result = commandState.execute();
        onCommand?.(result);
        showAutocomplete = false;
        break;
      case 'Escape':
        showAutocomplete = false;
        break;
    }
  }

  function selectItem(item: string) {
    commandState.setInput(item);
    const result = commandState.execute();
    onCommand?.(result);
    showAutocomplete = false;
    inputRef?.focus();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="cmd" onclick={focusInput}>
  <span class="prompt">&gt;</span>
  <input
    bind:this={inputRef}
    bind:value={commandState.input}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    onblur={() => setTimeout(() => (showAutocomplete = false), 150)}
    class="cmd-input"
    type="text"
    autocomplete="off"
  />
  <span class="blink"></span>

  {#if showAutocomplete}
    <div class="autocomplete">
      {#each commandState.autocompleteItems as item, i}
        <div
          class="autocomplete-item"
          class:selected={i === selectedIndex}
          onmousedown={() => selectItem(item)}
          role="button"
          tabindex="0"
        >
          {item}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .cmd {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-light);
    display: flex;
    align-items: center;
    gap: 2px;
    position: relative;
    cursor: text;
  }

  .cmd .prompt {
    color: var(--text-sec);
  }

  .cmd-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: inherit;
    font-size: inherit;
    width: 120px;
    padding: 0;
    margin: 0;
  }

  .blink {
    display: inline-block;
    width: 5px;
    height: 11px;
    background: var(--text-light);
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .autocomplete {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 4px;
    background: #2d2d2d;
    border: 1px solid #444;
    border-radius: 2px;
    padding: 2px 0;
    min-width: 80px;
    z-index: 100;
  }

  .autocomplete-item {
    padding: 3px 8px;
    color: #fff;
    font-size: 10px;
    cursor: pointer;
    white-space: nowrap;
  }

  .autocomplete-item:hover,
  .autocomplete-item.selected {
    background: var(--blue);
  }
</style>
