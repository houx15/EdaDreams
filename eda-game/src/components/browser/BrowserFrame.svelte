<script lang="ts">
  import type { SearchResult, ToolId, ToolQueryMap, SearchEngineData, StateMachineData, GsxtQueryResult } from '$lib/engine/types-v2';
  import { search } from '$lib/engine/search';
  import { loadSearchEngine, loadToolQueryMap, loadTextContent } from '$lib/data/loaders';
import { evidenceManagerV2 } from '$lib/state/evidence-v2.svelte';
import { getSharedStateMachine } from '$lib/state/state-machine-shared';
import { setEvidenceContent } from '$lib/state/evidence-content-cache';
import { createToolEvidence, createPhoneEvidence, createForensicsEvidence } from '$lib/data/evidence-factory';
  import type { StateMachine } from '$lib/engine/state-machine';

  type BrowserView = 'search' | 'whois' | 'gsxt' | 'numquery' | 'ip_lookup' | 'bank' | 'telecom' | 'forensics' | 'police' | 'page';

  let url = $state('');
  let view = $state<BrowserView>('search');
  let query = $state('');
  let searchResults = $state<SearchResult[]>([]);
  let searchEngineData = $state<SearchEngineData | null>(null);
  let toolQueryMap = $state<ToolQueryMap | null>(null);
  let stateMachine = $state<StateMachine | null>(null);
  let toolResult = $state<string>('');
  let toolResultTitle = $state<string>('');
  let isLoading = $state(true);
  let gsxtResults = $state<GsxtQueryResult[]>([]);
  let pageSourceView = $state<BrowserView>('search');

  let bankQueryType = $state('客户信息');
  let bankQueryInput = $state('');

  $effect(() => {
    Promise.all([loadSearchEngine(), loadToolQueryMap(), getSharedStateMachine()]).then(([se, tq, sm]) => {
      searchEngineData = se;
      toolQueryMap = tq;
      stateMachine = sm;
      isLoading = false;
    });
  });

  function handleDragStart(e: DragEvent, text: string) {
    e.dataTransfer?.setData('text/plain', text);
    e.dataTransfer!.effectAllowed = 'copy';
  }

  function handleSearch() {
    if (!searchEngineData) return;
    searchResults = search(searchEngineData, query);
  }

  function navigateTo(newUrl: string, newView: BrowserView = 'search') {
    url = newUrl;
    view = newView;
    query = '';
    searchResults = [];
    toolResult = '';
    toolResultTitle = '';
    gsxtResults = [];

    // URL-based view routing for tool pages
    const lowerUrl = newUrl.toLowerCase();
    if (lowerUrl.includes('bank-sec.donghai') || (lowerUrl.includes('bank') && lowerUrl.includes('donghai'))) {
      if (stateMachine && !stateMachine.isUnlocked('bank_system')) {
        toolResult = '本工具需要委托方授权。请联络对接人申请开通。';
        toolResultTitle = '东海银行 · 安全调查协作系统';
      }
      view = 'bank';
    } else if (lowerUrl.includes('telecom') || lowerUrl.includes('通信记录')) {
      view = 'telecom';
    }
  }

  function openSearchResult(result: SearchResult) {
    if (result.opens === 'whois_tool') navigateTo('whois.cnnic-query.cn', 'whois');
    else if (result.opens === 'gsxt_tool') navigateTo('gsxt.gov.cn', 'gsxt');
    else if (result.opens === 'numquery_tool') navigateTo('numquery.telecom.cn', 'numquery');
    else if (result.opens === 'ip_lookup_tool') navigateTo('ipquery.cn', 'ip_lookup');
    else if (result.page_content) {
      toolResultTitle = result.title;
      toolResult = result.page_content;
      pageSourceView = 'search';
      view = 'page';
    }
  }

  function openGsxtResult(result: GsxtQueryResult) {
    if (!toolQueryMap || !result.is_target) return;
    const detailConfig = toolQueryMap.gsxt.detail_page?.[result.企业名称];
    if (detailConfig && detailConfig.full_content_file) {
      const path = extractResultPath(detailConfig.full_content_file);
      loadTextContent(`/data/content/case01/${path}`).then((content) => {
        toolResultTitle = result.企业名称;
        toolResult = content;
        pageSourceView = 'gsxt';
        view = 'page';
      });
    }
  }

  function runWhois() {
    if (!toolQueryMap) return;
    const match = toolQueryMap.whois.queries.find((q) =>
      q.match.some((m) => m !== '_default' && query.toLowerCase().includes(m.toLowerCase()))
    ) || toolQueryMap.whois.queries.find((q) => q.match.includes('_default'));

    if (match) {
      if (typeof match.result === 'string') {
        toolResult = match.result;
      } else {
        toolResult = Object.entries(match.result).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      toolResultTitle = `WHOIS 查询结果: ${query}`;

      const domain = query.trim();
      if (!toolResult.includes('未查询到')) {
        evidenceManagerV2.unlock(createToolEvidence(
          `whois_${domain}`,
          `whois_${domain}.txt`,
          `WHOIS: ${domain}`,
          'whois',
          domain,
          '1 KB',
          150
        ));
        setEvidenceContent(`whois_${domain}`, toolResult);
      }
    }
  }

  function runGsxt() {
    if (!toolQueryMap) return;
    const match = toolQueryMap.gsxt.queries.find((q) =>
      q.match.some((m) => m !== '_default' && (query.includes(m) || m.includes(query)))
    ) || toolQueryMap.gsxt.queries.find((q) => q.match.includes('_default'));

    if (!match) return;

    toolResultTitle = `工商查询结果: ${query}`;
    const evidenceId = `gsxt_${query.replace(/\s/g, '_')}`;

    if (typeof match.results === 'string') {
      gsxtResults = [];
      toolResult = match.results;
      setEvidenceContent(evidenceId, toolResult);
    } else {
      gsxtResults = match.results;
      toolResult = '';
      const formatted = match.results.map((r) => {
        const lines = Object.entries(r).map(([k, v]) => `  ${k}: ${v}`);
        return `企业信息\n${lines.join('\n')}`;
      }).join('\n\n');
      setEvidenceContent(evidenceId, formatted);
    }

    evidenceManagerV2.unlock(createToolEvidence(
      evidenceId,
      `${evidenceId}.txt`,
      `工商: ${query}`,
      'gsxt',
      query,
      '1 KB',
      200
    ));
  }

  function runNumquery() {
    if (!toolQueryMap) return;
    const normalizedQuery = query.replace(/-/g, '');
    const match = toolQueryMap.numquery.queries.find((q) =>
      q.match.some((m) => m !== '_default' && normalizedQuery.includes(m.replace(/-/g, '')))
    ) || toolQueryMap.numquery.queries.find((q) => q.match.includes('_default'));

    if (match) {
      if (typeof match.result === 'string') {
        toolResult = match.result;
      } else {
        toolResult = Object.entries(match.result).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      toolResultTitle = `号码归属查询: ${query}`;
      const evidenceId = `numquery_${normalizedQuery}`;
      evidenceManagerV2.unlock(createToolEvidence(
        evidenceId,
        `${evidenceId}.txt`,
        `号码: ${query}`,
        'numquery',
        query,
        '1 KB',
        150
      ));
      setEvidenceContent(evidenceId, toolResult);
    }
  }

  function runIpLookup() {
    if (!toolQueryMap) return;
    const match = toolQueryMap.ip_lookup.queries.find((q) =>
      q.match.some((m) => m !== '_default' && query.includes(m))
    ) || toolQueryMap.ip_lookup.queries.find((q) => q.match.includes('_default'));

    if (match) {
      if (typeof match.result === 'string') {
        toolResult = match.result;
      } else {
        toolResult = Object.entries(match.result).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      toolResultTitle = `IP 归属查询: ${query}`;
      const evidenceId = `ip_${query.replace(/\./g, '_')}`;
      evidenceManagerV2.unlock(createToolEvidence(
        evidenceId,
        `${evidenceId}.txt`,
        `IP: ${query}`,
        'ip_lookup',
        query,
        '1 KB',
        150
      ));
      setEvidenceContent(evidenceId, toolResult);
    }
  }

  function extractResultPath(resultFile: string): string {
    return resultFile.replace(/^content\/case01\//, '').split(' ')[0].trim();
  }

  function runBankQuery() {
    if (!toolQueryMap || !stateMachine) return;
    if (!stateMachine.isUnlocked('bank_system')) {
      toolResult = '本工具需要委托方授权。请联络对接人申请开通。';
      toolResultTitle = '东海银行 · 安全调查协作系统';
      return;
    }
    const match = toolQueryMap.bank.queries.find((q) =>
      q.match.some((m) => m !== '_default' && bankQueryInput.toLowerCase().includes(m.toLowerCase()))
    ) || toolQueryMap.bank.queries.find((q) => q.match.includes('_default'));

    if (match) {
      if (match.result_file) {
        const path = extractResultPath(match.result_file);
        loadTextContent(`/data/content/case01/${path}`).then((content) => {
          toolResult = content;
          toolResultTitle = `银行查询: ${bankQueryType} - ${bankQueryInput}`;
          const evidenceId = `bank_${bankQueryInput.replace(/\s/g, '_')}`;
          evidenceManagerV2.unlock(createToolEvidence(
            evidenceId,
            `${evidenceId}.txt`,
            `银行: ${bankQueryType} ${bankQueryInput}`,
            'bank',
            bankQueryInput,
            '2 KB',
            400
          ));
          setEvidenceContent(evidenceId, toolResult);
        });
      } else if (match.result_summary) {
        toolResult = match.result_summary;
        toolResultTitle = `银行查询: ${bankQueryType} - ${bankQueryInput}`;
      } else if (typeof match.result === 'string') {
        toolResult = match.result;
        toolResultTitle = `银行查询: ${bankQueryType} - ${bankQueryInput}`;
      }
    }
  }

  function runTelecomQuery() {
    if (!toolQueryMap || !stateMachine) return;
    const normalizedQuery = query.replace(/-/g, '');
    const requiredLock = normalizedQuery.includes('13827719403') ? 'telecom_138'
      : normalizedQuery.includes('18976543210') ? 'telecom_189'
      : null;

    if (requiredLock && !stateMachine.isUnlocked(requiredLock)) {
      toolResult = '该号码尚未获得调取授权。请联络对接人申请。';
      toolResultTitle = '通信记录查询';
      return;
    }

    const match = toolQueryMap.telecom.queries.find((q) =>
      q.match.some((m) => m !== '_default' && normalizedQuery.includes(m.replace(/-/g, '')))
    ) || toolQueryMap.telecom.queries.find((q) => q.match.includes('_default'));

    if (match) {
      if (match.result_file) {
        const path = extractResultPath(match.result_file);
        loadTextContent(`/data/content/case01/${path}`).then((content) => {
          toolResult = content;
          toolResultTitle = `通信记录查询: ${query}`;
          const evidenceId = `telecom_${normalizedQuery}`;
          evidenceManagerV2.unlock(createToolEvidence(
            evidenceId,
            `${evidenceId}.txt`,
            `通信记录: ${query}`,
            'telecom',
            query,
            '2 KB',
            400
          ));
          setEvidenceContent(evidenceId, toolResult);
        });
      } else if (match.result_summary) {
        toolResult = match.result_summary;
        toolResultTitle = `通信记录查询: ${query}`;
      } else if (match.locked_response) {
        toolResult = match.locked_response;
        toolResultTitle = `通信记录查询: ${query}`;
      }
    }
  }
</script>

<div class="browser-frame">
  <div class="address-bar">
    <span class="addr-label">地址</span>
    <input type="text" bind:value={url} placeholder="输入网址或搜索关键词" onkeydown={(e) => e.key === 'Enter' && navigateTo(url, 'search')} />
    <button onclick={() => navigateTo(url, 'search')}>前往</button>
  </div>

  <div class="browser-content">
    {#if isLoading}
      <div class="loading">加载中...</div>
    {:else if view === 'search'}
      <div class="search-page">
        <div class="search-box">
          <input type="text" bind:value={query} placeholder="输入搜索关键词" onkeydown={(e) => e.key === 'Enter' && handleSearch()} />
          <button onclick={handleSearch}>搜索</button>
        </div>
        {#if searchResults.length > 0}
          <div class="search-results">
            {#each searchResults as result}
              <div
                class="result-item"
                class:clickable={result.clickable || !!result.page_content || !!result.opens}
                onclick={() => openSearchResult(result)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && openSearchResult(result)}
                draggable="true"
                ondragstart={(e) => handleDragStart(e, result.summary)}
              >
                <div class="result-title">{result.title}</div>
                <div class="result-source">{result.source}</div>
                <div class="result-summary">{result.summary}</div>
                {#if result.page_content || result.opens}
                  <div class="result-expand-hint">▶</div>
                {/if}
              </div>
            {/each}
          </div>
        {:else if query}
          <div class="no-results">未找到相关结果</div>
        {/if}
      </div>
    {:else if view === 'whois'}
      <div class="tool-page">
        <h3>域名备案/WHOIS 查询</h3>
        <div class="tool-input">
          <input type="text" bind:value={query} placeholder="输入域名" onkeydown={(e) => e.key === 'Enter' && runWhois()} />
          <button onclick={runWhois}>查询</button>
        </div>
        {#if toolResult}<pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>{/if}
      </div>
    {:else if view === 'gsxt'}
      <div class="tool-page">
        <h3>国家企业信用信息公示系统</h3>
        <div class="tool-input">
          <input type="text" bind:value={query} placeholder="输入企业名称/法人姓名" onkeydown={(e) => e.key === 'Enter' && runGsxt()} />
          <button onclick={runGsxt}>查询</button>
        </div>
        {#if gsxtResults.length > 0}
          <div class="gsxt-results">
            {#each gsxtResults as result}
              <div
                class="gsxt-result-item"
                class:target={result.is_target}
                onclick={() => openGsxtResult(result)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && openGsxtResult(result)}
              >
                <div class="gsxt-result-name">{result.企业名称}</div>
                <div class="gsxt-result-info">法人: {result.法人 || '-'} | 成立: {result.成立日期 || '-'} | 地址: {result.地址 || '-'}</div>
                {#if result.is_target}
                  <div class="gsxt-result-hint">▶ 点击查看详情</div>
                {/if}
              </div>
            {/each}
          </div>
        {:else if toolResult}
          <pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>
        {/if}
      </div>
    {:else if view === 'numquery'}
      <div class="tool-page">
        <h3>号码归属查询</h3>
        <div class="tool-input">
          <input type="text" bind:value={query} placeholder="输入手机号/固话号" onkeydown={(e) => e.key === 'Enter' && runNumquery()} />
          <button onclick={runNumquery}>查询</button>
        </div>
        {#if toolResult}<pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>{/if}
      </div>
    {:else if view === 'ip_lookup'}
      <div class="tool-page">
        <h3>IP 归属地查询</h3>
        <div class="tool-input">
          <input type="text" bind:value={query} placeholder="输入 IP 地址" onkeydown={(e) => e.key === 'Enter' && runIpLookup()} />
          <button onclick={runIpLookup}>查询</button>
        </div>
        {#if toolResult}<pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>{/if}
      </div>
    {:else if view === 'bank'}
      <div class="tool-page">
        <h3>东海银行 · 安全调查协作系统</h3>
        <div class="tool-input bank-query">
          <select bind:value={bankQueryType}>
            <option>客户信息</option>
            <option>交易流水</option>
            <option>受影响客户名单</option>
          </select>
          <input type="text" bind:value={bankQueryInput} placeholder="输入查询条件" onkeydown={(e) => e.key === 'Enter' && runBankQuery()} />
          <button onclick={runBankQuery}>查询</button>
        </div>
        {#if toolResult}<pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>{/if}
      </div>
    {:else if view === 'telecom'}
      <div class="tool-page">
        <h3>通信记录查询</h3>
        <div class="tool-input">
          <input type="text" bind:value={query} placeholder="输入查询号码" onkeydown={(e) => e.key === 'Enter' && runTelecomQuery()} />
          <button onclick={runTelecomQuery}>查询</button>
        </div>
        {#if toolResult}<pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>{/if}
      </div>
    {:else if view === 'page'}
      <div class="tool-page">
        <div class="page-header">
          <button class="back-button" onclick={() => { view = pageSourceView; }}>← 返回搜索结果</button>
          <h3>{toolResultTitle}</h3>
        </div>
        <pre class="tool-result" draggable="true" ondragstart={(e) => handleDragStart(e, toolResult)}>{toolResult}</pre>
      </div>
    {/if}
  </div>
</div>

<style>
  .browser-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-white);
    border: 1px solid var(--border);
    margin: 4px;
    overflow: hidden;
  }
  .address-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
  }
  .addr-label {
    font-size: 11px;
    color: var(--text-sec);
  }
  .address-bar input {
    flex: 1;
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .address-bar button {
    padding: 4px 12px;
    font-size: 11px;
    background: var(--bg-toolbar);
    border: 1px solid var(--border);
    border-radius: 3px;
    cursor: pointer;
  }
  .browser-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  .loading, .no-results {
    padding: 40px;
    text-align: center;
    color: var(--text-light);
  }
  .search-box {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .search-box input {
    flex: 1;
    padding: 6px 10px;
    font-size: 13px;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .search-box button {
    padding: 6px 16px;
    font-size: 12px;
    background: var(--blue);
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  .result-item {
    padding: 12px;
    border-bottom: 1px solid var(--border);
    cursor: default;
    position: relative;
  }
  .result-item:hover {
    background: var(--bg-panel);
  }
  .result-item.clickable {
    cursor: pointer;
  }
  .result-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--blue);
    margin-bottom: 2px;
  }
  .result-source {
    font-size: 10px;
    color: var(--text-light);
    margin-bottom: 4px;
  }
  .result-summary {
    font-size: 12px;
    color: var(--text-sec);
  }
  .result-expand-hint {
    font-size: 10px;
    color: var(--text-light);
    margin-top: 4px;
    opacity: 0.6;
  }
  .tool-page h3 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .tool-input {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .tool-input input, .tool-input select {
    padding: 5px 8px;
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .tool-input input {
    flex: 1;
  }
  .tool-input button {
    padding: 5px 14px;
    font-size: 12px;
    background: var(--bg-toolbar);
    border: 1px solid var(--border);
    border-radius: 3px;
    cursor: pointer;
  }
  .bank-query select {
    min-width: 120px;
  }
  .tool-result {
    padding: 12px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    font-family: var(--font-ui);
  }
  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .page-header h3 {
    margin: 0;
    padding: 0;
    border: none;
    font-size: 14px;
    font-weight: 600;
  }
  .back-button {
    padding: 4px 10px;
    font-size: 11px;
    background: var(--bg-toolbar);
    border: 1px solid var(--border);
    border-radius: 3px;
    cursor: pointer;
    color: var(--text-sec);
  }
  .gsxt-results {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .gsxt-result-item {
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--bg-white);
    cursor: default;
  }
  .gsxt-result-item.target {
    cursor: pointer;
  }
  .gsxt-result-item.target:hover {
    background: var(--bg-panel);
  }
  .gsxt-result-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--blue);
    margin-bottom: 4px;
  }
  .gsxt-result-info {
    font-size: 11px;
    color: var(--text-sec);
  }
  .gsxt-result-hint {
    font-size: 10px;
    color: var(--text-light);
    margin-top: 4px;
    opacity: 0.7;
  }
</style>
