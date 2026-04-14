<script lang="ts">
  import { gameState } from '$lib/state/game.svelte';
  import { contextState } from '$lib/state/context.svelte';
  import CommandLine from '../common/CommandLine.svelte';

  interface Props {
    onExit?: () => void;
    onClear?: () => void;
  }

  let { onExit, onClear }: Props = $props();

  let commandMessage = $state<string | null>(null);
  let caseClosedTimerDone = $state(false);

  const baseStatusMessage = $derived.by(() => {
    if (gameState.phase === 'case_closed') {
      return caseClosedTimerDone ? '输入流 · 新案件待分配 ...' : 'case_001: CLOSED';
    }
    if (gameState.phase === 'gameplay' && gameState.currentCase === 1) {
      return `案件 CASE-2041-0001 · 步骤 ${gameState.currentStep + 1}/12 · 等待推理`;
    }
    return '就绪 · case_001 简报已接收 · 等待分析';
  });

  const displayMessage = $derived(commandMessage ?? baseStatusMessage);

  $effect(() => {
    if (gameState.phase === 'case_closed') {
      const timer = setTimeout(() => {
        caseClosedTimerDone = true;
      }, 3000);
      return () => clearTimeout(timer);
    }
    caseClosedTimerDone = false;
  });

  function handleCommand(cmd: 'exit' | 'help' | 'status' | 'clear' | null): void {
    switch (cmd) {
      case 'exit':
        onExit?.();
        break;
      case 'help':
        commandMessage = '可用命令: /help, /status, /clear';
        setTimeout(() => {
          commandMessage = null;
        }, 3000);
        break;
      case 'status':
        if (gameState.currentCase === 1) {
          const pct = Math.round(contextState.capacityInfo.percentage);
          commandMessage = `案件 CASE-2041-0001 · 步骤 ${gameState.currentStep + 1}/12 · 上下文 ${pct}%`;
        } else {
          commandMessage = '就绪 · 无活动案件';
        }
        setTimeout(() => {
          commandMessage = null;
        }, 3000);
        break;
      case 'clear':
        onClear?.();
        commandMessage = '分析输出已清除';
        setTimeout(() => {
          commandMessage = null;
        }, 2000);
        break;
    }
  }
</script>

<div class="footer">
  <span class="msg">{displayMessage}</span>
  <span class="spacer"></span>
  <CommandLine onCommand={handleCommand} />
  <span class="caps">
    <span class="on">CTX</span>
    <span>CMP</span>
    <span>WEB</span>
    <span>MEM</span>
    <span>TOOL</span>
    <span>EXEC</span>
    <span>CODE</span>
  </span>
</div>

<style>
  .footer {
    grid-area: footer;
    background: var(--bg-toolbar);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 10px;
    gap: 12px;
    font-size: 10px;
    color: var(--text-light);
  }
  .msg {
    max-width: 350px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .spacer {
    flex: 1;
  }
  .caps {
    display: flex;
    gap: 3px;
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.03em;
  }
  .caps span {
    padding: 1px 4px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    color: var(--text-light);
  }
  .caps span.on {
    background: var(--blue-light);
    border-color: #a0c4e8;
    color: var(--blue);
    font-weight: 600;
  }
</style>
