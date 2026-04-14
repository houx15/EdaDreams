<div class="titlebar">
  <div class="dots">
    <div class="dot r"></div>
    <div class="dot y"></div>
    <div class="dot g"></div>
  </div>
  <span class="win-title">EDA v4.1 — 网络安全智能分析平台</span>
</div>

<style>
  .titlebar {
    grid-area: titlebar;
    background: var(--bg-titlebar);
    display: flex;
    align-items: center;
    padding: 0 10px;
    gap: 8px;
  }
  .dots {
    display: flex;
    gap: 6px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .dot.r {
    background: #ec6a5e;
  }
  .dot.y {
    background: #f4bf4f;
  }
  .dot.g {
    background: #61c554;
  }
  .win-title {
    flex: 1;
    text-align: center;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.02em;
  }
</style>
