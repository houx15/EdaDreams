<script lang="ts">
  import type { WorkbenchTab } from '$lib/engine/types';

  interface Props {
    tabs: WorkbenchTab[];
    activeTab: WorkbenchTab | null;
    onTabClick: (tab: WorkbenchTab) => void;
    onTabClose: (tab: WorkbenchTab) => void;
  }

  let { tabs, activeTab, onTabClick, onTabClose }: Props = $props();

  const MAX_TAB_LABEL_LENGTH = 15;

  function truncateTitle(title: string): string {
    if (title.length <= MAX_TAB_LABEL_LENGTH) return title;
    return title.slice(0, MAX_TAB_LABEL_LENGTH) + '…';
  }

  function tabIcon(tab: WorkbenchTab): string {
    switch (tab.type) {
      case 'browser': return '🌐';
      case 'phone': return '☎';
      default: return '📄';
    }
  }
</script>

<div class="doc-tabs">
  {#each tabs as tab (tab.id)}
    <div
      class="doc-tab"
      class:active={activeTab?.id === tab.id}
      onclick={() => onTabClick(tab)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && onTabClick(tab)}
    >
      {tabIcon(tab)} {truncateTitle(tab.title)}
      <span
        class="x"
        onclick={(e) => {
          e.stopPropagation();
          onTabClose(tab);
        }}
        role="button"
        tabindex="0"
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            onTabClose(tab);
          }
        }}
      >
        ×
      </span>
    </div>
  {/each}
</div>

<style>
  .doc-tabs {
    display: flex;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    min-height: 28px;
    align-items: flex-end;
    padding: 0 4px;
  }
  .doc-tab {
    padding: 5px 14px;
    font-size: 11px;
    color: var(--text-sec);
    border: 1px solid transparent;
    border-bottom: none;
    cursor: default;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: -1px;
    max-width: 160px;
  }
  .doc-tab.active {
    background: var(--bg-white);
    border-color: var(--border);
    color: var(--text);
    font-weight: 500;
  }
  .doc-tab .x {
    color: var(--text-light);
    font-size: 10px;
    padding: 0 2px;
  }
  .doc-tab .x:hover {
    color: var(--text);
  }
</style>
