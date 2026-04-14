<script lang="ts">
  import TabBar from './TabBar.svelte';
  import DocumentViewer from './DocumentViewer.svelte';
  import type { EvidenceFile } from '$lib/engine/types';

  interface Props {
    tabs: EvidenceFile[];
    activeTab: EvidenceFile | null;
    onTabClick: (evidence: EvidenceFile) => void;
    onTabClose: (evidence: EvidenceFile) => void;
  }

  let { tabs, activeTab, onTabClick, onTabClose }: Props = $props();
</script>

<div class="docarea">
  <TabBar {tabs} {activeTab} {onTabClick} {onTabClose} />
  <DocumentViewer evidence={activeTab} />
</div>

<style>
  .docarea {
    grid-area: docarea;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }
</style>
