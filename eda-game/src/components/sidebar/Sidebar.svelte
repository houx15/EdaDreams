<script lang="ts">
  import IdentityCard from './IdentityCard.svelte';
  import NavTree from './NavTree.svelte';
  import type { EvidenceItem } from '$lib/engine/types';

  interface Props {
    onSelect?: (item: EvidenceItem, action: 'open' | 'browser' | 'phone') => void;
  }

  let { onSelect }: Props = $props();
</script>

<div class="sidebar">
  <IdentityCard />
  <NavTree {onSelect} />
</div>

<style>
  .sidebar {
    grid-area: sidebar;
    background: var(--bg-sidebar);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right: 1px solid #1a2a44;
  }
</style>
