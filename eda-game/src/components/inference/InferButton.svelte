<script lang="ts">
  interface Props {
    onInfer: () => void;
    onClear: () => void;
    loading?: boolean;
  }

  let { onInfer, onClear, loading = $bindable(false) }: Props = $props();
</script>

<div class="inf-divider">
  <span class="arrow">▼</span>
  <button class="btn-infer" onclick={onInfer} type="button" disabled={loading}>
    {loading ? '推理中...' : '推 理'}
  </button>
  <button class="btn-clear" onclick={onClear} type="button">清空</button>
  <span class="spacer"></span>
  <span class="label">上下文 → 分析</span>
</div>

<style>
  .inf-divider {
    background: linear-gradient(to bottom, #d8d9dc, #d0d1d5);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .inf-divider .arrow {
    color: var(--text-light);
    font-size: 14px;
  }

  .btn-infer {
    background: var(--blue);
    color: #fff;
    border: 1px solid var(--blue-dark);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 20px;
    cursor: pointer;
    letter-spacing: 0.05em;
  }

  .btn-infer:hover {
    background: #2458a0;
  }

  .btn-infer:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-clear {
    background: var(--bg-white);
    color: var(--text-sec);
    border: 1px solid var(--border);
    font-family: inherit;
    font-size: 11px;
    padding: 4px 12px;
    cursor: pointer;
  }

  .btn-clear:hover {
    background: var(--bg-panel);
  }

  .spacer {
    flex: 1;
  }

  .label {
    font-size: 10px;
    color: var(--text-light);
  }
</style>
