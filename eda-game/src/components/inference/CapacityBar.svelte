<script lang="ts">
  import type { CapacityInfo } from '$lib/engine/types';

  interface Props {
    capacity: CapacityInfo;
  }

  let { capacity }: Props = $props();

  function getFillColor(color: string): string {
    switch (color) {
      case 'blue':
        return 'var(--ctx-blue)';
      case 'orange':
        return 'var(--ctx-orange)';
      case 'red':
        return 'var(--ctx-red)';
      default:
        return 'var(--ctx-blue)';
    }
  }
</script>

<div class="ctx-bar-row">
  <span class="ctx-bar-label">容量</span>
  <div class="ctx-bar">
    <div
      class="ctx-bar-fill"
      style="width: {Math.min(capacity.percentage, 100)}%; background: {getFillColor(capacity.color)}"
    ></div>
  </div>
  <span class="ctx-pct" style="color: {getFillColor(capacity.color)}">
    {capacity.percentage.toFixed(1)}%
  </span>
</div>

<style>
  .ctx-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px 4px;
  }

  .ctx-bar-label {
    font-size: 10px;
    color: var(--text-sec);
  }

  .ctx-bar {
    flex: 1;
    height: 8px;
    background: #d0d2d8;
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .ctx-bar-fill {
    height: 100%;
    background: var(--ctx-blue);
    transition: width 0.2s ease, background 0.2s ease;
  }

  .ctx-pct {
    font-size: 11px;
    color: var(--ctx-blue);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 28px;
    text-align: right;
  }
</style>
