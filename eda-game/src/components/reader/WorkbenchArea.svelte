<script lang="ts">
  import TabBar from './TabBar.svelte';
  import DocumentViewer from './DocumentViewer.svelte';
  import BrowserFrame from '../browser/BrowserFrame.svelte';
  import PhoneFrame from '../phone/PhoneFrame.svelte';
  import type { WorkbenchTab, EvidenceFile } from '$lib/engine/types';

  interface Props {
    tabs: WorkbenchTab[];
    activeTab: WorkbenchTab | null;
    onTabClick: (tab: WorkbenchTab) => void;
    onTabClose: (tab: WorkbenchTab) => void;
  }

  let { tabs, activeTab, onTabClick, onTabClose }: Props = $props();
</script>

<div class="docarea">
  <TabBar {tabs} {activeTab} {onTabClick} {onTabClose} />
  <div class="tab-content">
    {#if activeTab}
      {#if activeTab.type === 'document' && activeTab.evidenceFile}
        <DocumentViewer evidence={activeTab.evidenceFile} />
      {:else if activeTab.type === 'browser'}
        <BrowserFrame />
      {:else if activeTab.type === 'phone'}
        <PhoneFrame />
      {:else}
        <div class="empty-state"><div class="empty-text">无法显示此标签页</div></div>
      {/if}
    {:else}
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-text">没有打开的文档</div>
        <div class="empty-hint">从左侧选择证据文件或工具进行查看</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .docarea {
    grid-area: docarea;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }
  .tab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    text-align: center;
    gap: 8px;
    background: var(--bg-white);
    border: 1px solid var(--border);
    margin: 4px;
  }
  .empty-icon {
    font-size: 28px;
    opacity: 0.15;
  }
  .empty-text {
    font-size: 13px;
    font-weight: 500;
  }
  .empty-hint {
    font-size: 11px;
    opacity: 0.7;
  }
</style>
