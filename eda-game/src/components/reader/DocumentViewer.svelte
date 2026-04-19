<script lang="ts">
  import type { EvidenceFile } from '$lib/engine/types';

  interface Props {
    evidence: EvidenceFile | null;
  }

  let { evidence }: Props = $props();
  let selectedText = $state('');

  function handleMouseUp() {
    const selection = window.getSelection()?.toString() || '';
    selectedText = selection;
  }

  function handleDragStart(e: DragEvent) {
    const text = selectedText || window.getSelection()?.toString() || '';
    if (text) {
      e.dataTransfer?.setData('text/plain', text);
      e.dataTransfer!.effectAllowed = 'copy';
    } else {
      e.preventDefault();
    }
  }

  function parseContent(content: string): { meta: string[]; title: string; body: string } {
    const lines = content.split('\n');
    const meta: string[] = [];
    let title = '';
    let bodyStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('发件人:') || line.startsWith('发件:')) {
        meta.push(`发件: ${line.split(':')[1]?.trim() || ''}`);
      } else if (line.startsWith('收件人:') || line.startsWith('收件:')) {
        meta.push(`收件: ${line.split(':')[1]?.trim() || ''}`);
      } else if (line.startsWith('主题:')) {
        title = line.split(':')[1]?.trim() || '';
      } else if (line.startsWith('查询对象:')) {
        meta.push(`对象: ${line.split(':')[1]?.trim() || ''}`);
        if (lines[i + 1]?.startsWith('数据来源:')) {
          meta.push(`来源: ${lines[i + 1].split(':')[1]?.trim() || ''}`);
          i++;
        }
      } else if (line.startsWith('查询号码:')) {
        meta.push(`号码: ${line.split(':')[1]?.trim() || ''}`);
        if (lines[i + 1]?.startsWith('数据来源:')) {
          meta.push(`来源: ${lines[i + 1].split(':')[1]?.trim() || ''}`);
          i++;
        }
      } else if (line.startsWith('查询企业:')) {
        meta.push(`企业: ${line.split(':')[1]?.trim() || ''}`);
        if (lines[i + 1]?.startsWith('数据来源:')) {
          meta.push(`来源: ${lines[i + 1].split(':')[1]?.trim() || ''}`);
          i++;
        }
      } else if (line.startsWith('查询账户:')) {
        meta.push(`账户: ${line.split(':')[1]?.trim() || ''}`);
        if (lines[i + 1]?.startsWith('数据来源:')) {
          meta.push(`来源: ${lines[i + 1].split(':')[1]?.trim() || ''}`);
          i++;
        }
      } else if (line.trim() === '' && meta.length > 0 && !title) {
        continue;
      } else if (line.trim() !== '' && !title) {
        title = line.trim();
        bodyStart = i + 1;
        break;
      }
    }

    if (!title) {
      bodyStart = meta.length > 0 ? meta.length + 1 : 0;
      title = lines[bodyStart]?.trim() || '';
      bodyStart = bodyStart + 1;
    }

    const body = lines.slice(bodyStart).join('\n').trim();
    return { meta, title, body };
  }

  const parsed = $derived(evidence ? parseContent(evidence.content) : null);
</script>

<div class="doc-viewer" role="document">
  {#if evidence && parsed}
    <div class="doc-meta-row">
      {#if parsed.meta.length > 0}
        {#each parsed.meta as m}
          <span>{m}</span>
        {/each}
      {:else}
        <span>大小: {evidence.sizeLabel}</span>
      {/if}
    </div>
    <div class="doc-title-line">{parsed.title || evidence.filename}</div>
    <div
    class="doc-body selectable"
    role="textbox"
    tabindex="-1"
    draggable={!!selectedText}
    onmouseup={handleMouseUp}
    ondragstart={handleDragStart}
  >{parsed.body || evidence.content}</div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">📄</div>
      <div class="empty-text">没有打开的文档</div>
      <div class="empty-hint">从左侧选择证据文件进行查看</div>
    </div>
  {/if}
</div>

<style>
  .doc-viewer {
    flex: 1;
    background: var(--bg-white);
    border: 1px solid var(--border);
    margin: 4px;
    padding: 20px 24px;
    overflow-y: auto;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
  .doc-meta-row {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--text-sec);
    margin-bottom: 4px;
  }
  .doc-title-line {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .doc-body {
    font-size: 13px;
    line-height: 1.8;
    white-space: pre-wrap;
    color: var(--text);
    cursor: text;
    user-select: text;
  }

  .doc-body:active {
    cursor: text;
  }
  .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    text-align: center;
    gap: 8px;
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
