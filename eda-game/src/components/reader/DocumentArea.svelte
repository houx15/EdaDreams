<script lang="ts">
  import WorkbenchArea from './WorkbenchArea.svelte';
  import type { EvidenceFile, WorkbenchTab } from '$lib/engine/types';

  interface Props {
    tabs: EvidenceFile[];
    activeTab: EvidenceFile | null;
    onTabClick: (evidence: EvidenceFile) => void;
    onTabClose: (evidence: EvidenceFile) => void;
  }

  let { tabs, activeTab, onTabClick, onTabClose }: Props = $props();

  const workbenchTabs = $derived(
    tabs.map((e): WorkbenchTab => ({
      id: e.id,
      type: 'document',
      title: e.filename,
      evidenceFile: e,
    }))
  );

  const workbenchActive = $derived(
    activeTab
      ? {
          id: activeTab.id,
          type: 'document' as const,
          title: activeTab.filename,
          evidenceFile: activeTab,
        }
      : null
  );

  function handleTabClick(tab: WorkbenchTab): void {
    if (tab.evidenceFile) onTabClick(tab.evidenceFile);
  }

  function handleTabClose(tab: WorkbenchTab): void {
    if (tab.evidenceFile) onTabClose(tab.evidenceFile);
  }
</script>

<WorkbenchArea
  tabs={workbenchTabs}
  activeTab={workbenchActive}
  onTabClick={handleTabClick}
  onTabClose={handleTabClose}
/>
