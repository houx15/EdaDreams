<div class="menubar">
  <div class="menu-item">文件</div>
  <div class="menu-item">编辑</div>
  <div class="menu-item">视图</div>
  <div class="menu-item">案件</div>
  <div class="menu-item">工具</div>
  <div class="menu-item">帮助</div>
</div>

<style>
  .menubar {
    grid-area: menubar;
    background: var(--bg-menubar);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: stretch;
    padding: 0 6px;
    font-size: 12px;
  }
  .menu-item {
    padding: 3px 10px;
    color: var(--text);
    cursor: default;
    display: flex;
    align-items: center;
  }
  .menu-item:hover {
    background: var(--blue);
    color: #fff;
  }
</style>
