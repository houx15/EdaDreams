<script lang="ts">
  const capabilities = [
    { id: 'CTX', label: 'CTX', active: true },
    { id: 'CMP', label: 'CMP', active: false },
    { id: 'WEB', label: 'WEB', active: false },
    { id: 'MEM', label: 'MEM', active: false },
    { id: 'TOOL', label: 'TOOL', active: false },
    { id: 'EXEC', label: 'EXEC', active: false },
    { id: 'CODE', label: 'CODE', active: false },
  ];
</script>

<div class="caps">
  {#each capabilities as cap}
    <div class="cap-item" class:active={cap.active}>
      <span class="cap-label">{cap.label}</span>
      <span class="cap-dot"></span>
    </div>
  {/each}
</div>

<style>
  .caps {
    display: flex;
    gap: 3px;
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.03em;
  }

  .cap-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 1px 4px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    color: var(--text-light);
  }

  .cap-item.active {
    background: var(--blue-light);
    border-color: #a0c4e8;
    color: var(--blue);
    font-weight: 600;
  }

  .cap-label {
    font-size: 8px;
    line-height: 1;
  }

  .cap-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-light);
  }

  .cap-item.active .cap-dot {
    background: var(--blue);
  }
</style>
