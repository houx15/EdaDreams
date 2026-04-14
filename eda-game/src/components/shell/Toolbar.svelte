<div class="toolbar">
  <div class="tb-btn">📄 新建</div>
  <div class="tb-btn">💾 保存</div>
  <div class="tb-sep"></div>
  <div class="tb-btn">🔍 搜索</div>
  <div class="tb-btn">📋 剪贴板</div>
  <div class="tb-sep"></div>
  <div class="tb-btn">📊 统计</div>
  <div class="tb-btn">🖨️ 打印</div>
  <div class="tb-case">
    <span class="tb-status"></span>
    案件 <strong>CASE-2041-0001</strong> · 东海银行钓鱼事件
  </div>
</div>

<style>
  .toolbar {
    grid-area: toolbar;
    background: var(--bg-toolbar);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 2px;
  }
  .tb-btn {
    padding: 3px 8px;
    font-size: 11px;
    color: var(--text-sec);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 2px;
    cursor: default;
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
  }
  .tb-btn:hover {
    background: var(--bg-white);
    border-color: var(--border);
  }
  .tb-sep {
    width: 1px;
    height: 18px;
    background: var(--border);
    margin: 0 4px;
  }
  .tb-case {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-sec);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tb-case strong {
    color: var(--text);
    font-weight: 600;
  }
  .tb-status {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--green);
  }
</style>
