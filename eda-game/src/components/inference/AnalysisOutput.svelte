<script lang="ts">
  import type { InferenceResult } from '$lib/engine/types';

  interface Props {
    output: InferenceResult | null;
  }

  let { output }: Props = $props();
</script>

<div class="inf-output">
  <div class="panel-header">
    <span class="indicator"></span>
    分析输出
  </div>
  <div class="output-body">
    {#if output}
      <pre class="output-text">{output.output}</pre>
    {:else}
      <div class="output-empty">
        <div class="big">▽</div>
        <p>填入上下文后点击「推理」<br />分析结果将在此显示</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .inf-output {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    background: linear-gradient(to bottom, #e8e9ec, #dddee2);
    border-bottom: 1px solid var(--border);
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 26px;
  }

  .panel-header .indicator {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-light);
  }

  .output-body {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    background: var(--bg-white);
    margin: 4px;
    border: 1px solid var(--border);
  }

  .output-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    text-align: center;
    gap: 8px;
    font-size: 12px;
  }

  .output-empty .big {
    font-size: 28px;
    opacity: 0.15;
  }

  .output-text {
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--text);
    margin: 0;
  }
</style>
