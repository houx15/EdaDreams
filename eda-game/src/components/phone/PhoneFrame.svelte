<script lang="ts">
  import { onMount } from 'svelte';
  import type { LuMingyuanDialogData, DialogMessage } from '$lib/engine/types-v2';
  import { DialogEngine } from '$lib/engine/dialog';
  import { loadLuMingyuanDialog } from '$lib/data/loaders';
  import { getSharedStateMachine } from '$lib/state/state-machine-shared';
  import { evidenceManagerV2 } from '$lib/state/evidence-v2.svelte';
  import { createPhoneEvidence, createForensicsEvidence } from '$lib/data/evidence-factory';

  let phoneNumber = $state('');
  let isConnected = $state(false);
  let callDuration = $state(0);
  let messages = $state<DialogMessage[]>([]);
  let playerInput = $state('');
  let engine = $state<DialogEngine | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;
  let isLoading = $state(true);

  const FORENSICS_FILES = [
    { id: 'phone_forensics_report', filename: 'phone_forensics_report.txt', displayName: '手机取证报告.txt', size: '2.1 KB', tokens: 600 },
    { id: 'autoai_operation_log', filename: 'autoai_operation_log.txt', displayName: 'AutoAI 操作日志.txt', size: '1.8 KB', tokens: 500 },
    { id: 'autoai_chat_log', filename: 'autoai_chat_log.txt', displayName: 'AutoAI 聊天记录.txt', size: '4.2 KB', tokens: 800 },
    { id: 'autoai_screenshot_desc', filename: 'autoai_screenshot_desc.txt', displayName: 'AutoAI 截图描述.txt', size: '1.5 KB', tokens: 400 },
  ];

  onMount(() => {
    Promise.all([loadLuMingyuanDialog(), getSharedStateMachine()]).then(([dialogData, stateMachine]) => {
      engine = new DialogEngine(dialogData, stateMachine);
      isLoading = false;
    });
  });

  function dial() {
    if (phoneNumber.replace(/-/g, '') === '075588001234') {
      isConnected = true;
      messages = [createLuMessage(engine?.greeting || '你好，我是陆明远。')];
      callDuration = 0;
      timer = setInterval(() => {
        callDuration++;
      }, 1000);
    } else {
      messages = [createSystemMessage('无法接通：该号码不存在或暂时无法接通。')];
    }
  }

  function hangup() {
    isConnected = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    messages = [...messages, createLuMessage(engine?.farewell || '好，有事随时打。')];
    engine?.clearPendingAction();
  }

  function sendMessage() {
    if (!playerInput.trim() || !engine) return;

    const text = playerInput.trim();
    messages = [...messages, { speaker: 'player', text, timestamp: Date.now() }];
    playerInput = '';

    const result = engine.processMessage(text);

    if (result.pendingAction) {
      messages = [...messages, ...result.messages];
    } else {
      const delay = result.messages.length > 0 ? 800 : 0;
      setTimeout(() => {
        messages = [...messages, ...result.messages];

        if (result.triggeredUnlock) {
          handleUnlock(result.triggeredUnlock);
        }
      }, delay);
    }
  }

  function handleUnlock(lockId: string) {
    if (lockId === 'email_account') {
      evidenceManagerV2.unlock(createPhoneEvidence('email_account', 'email_account.txt', '邮箱账号信息.txt', 'email_account', '2.4 KB', 400));
    } else if (lockId === 'vps_records') {
      evidenceManagerV2.unlock(createPhoneEvidence('vps_login_records', 'vps_login_records.txt', 'VPS 登录记录.txt', 'vps_records', '1.2 KB', 300));
    } else if (lockId === 'phone_forensics') {
      for (const f of FORENSICS_FILES) {
        evidenceManagerV2.unlock(createForensicsEvidence(f.id, f.filename, f.displayName, f.size, f.tokens));
      }
    } else if (lockId === 'resident_info') {
      evidenceManagerV2.unlock(createPhoneEvidence('resident_info', 'resident_info.txt', '住户信息.txt', 'resident_info', '1.0 KB', 200));
    } else if (lockId === 'telecom_138') {
      evidenceManagerV2.unlock(createPhoneEvidence('phone_records', '04_phone_records.txt', '通信记录 (138).txt', 'telecom_138', '4.6 KB', 800));
    } else if (lockId === 'telecom_189') {
      evidenceManagerV2.unlock(createPhoneEvidence('phone_records_189', 'phone_records_189.txt', '通信记录 (189).txt', 'telecom_189', '1.5 KB', 250));
    } else if (lockId === 'bank_system') {
      // Bank system unlocks the tool, not an evidence file directly
    }
  }

  function createLuMessage(text: string): DialogMessage {
    return { speaker: 'lu_mingyuan', text, timestamp: Date.now() };
  }

  function createSystemMessage(text: string): DialogMessage {
    return { speaker: 'lu_mingyuan', text: `[系统] ${text}`, timestamp: Date.now() };
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
</script>

<div class="phone-frame">
  <div class="phone-header">
    <span class="phone-icon">☎</span>
    <span class="phone-title">通话</span>
  </div>

  {#if !isConnected}
    <div class="dialer">
      <div class="number-display">
        <input type="text" bind:value={phoneNumber} placeholder="输入电话号码" onkeydown={(e) => e.key === 'Enter' && dial()} />
        <button onclick={dial}>拨打</button>
      </div>
      {#if messages.length > 0}
        <div class="call-log">
          {#each messages as msg}
            <div class="msg system">{msg.text}</div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="call-info">
      <div class="call-peer">陆明远 · 东海银行 · 高级安全工程师</div>
      <div class="call-timer">{formatDuration(callDuration)}</div>
    </div>

    <div class="chat-history">
      {#each messages as msg}
        <div class="msg {msg.speaker}">
          <div class="msg-bubble">{msg.text}</div>
        </div>
      {/each}
    </div>

    <div class="chat-input">
      <input type="text" bind:value={playerInput} placeholder="输入要说的话..." onkeydown={(e) => e.key === 'Enter' && sendMessage()} />
      <button onclick={sendMessage}>发送</button>
      <button class="hangup" onclick={hangup}>挂断</button>
    </div>
  {/if}
</div>

<style>
  .phone-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-white);
    border: 1px solid var(--border);
    margin: 4px;
    overflow: hidden;
  }
  .phone-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
  }
  .phone-icon {
    font-size: 14px;
  }
  .phone-title {
    font-size: 12px;
    font-weight: 500;
  }
  .dialer {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .number-display {
    display: flex;
    gap: 8px;
  }
  .number-display input {
    flex: 1;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .number-display button {
    padding: 8px 20px;
    font-size: 13px;
    background: var(--green);
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  .call-log {
    padding: 12px;
    background: var(--bg-panel);
    border-radius: 3px;
  }
  .call-info {
    padding: 12px;
    text-align: center;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
  }
  .call-peer {
    font-size: 12px;
    font-weight: 500;
  }
  .call-timer {
    font-size: 11px;
    color: var(--text-sec);
    margin-top: 2px;
    font-family: var(--font-mono);
  }
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .msg {
    display: flex;
  }
  .msg.player {
    justify-content: flex-end;
  }
  .msg.system {
    justify-content: center;
  }
  .msg-bubble {
    max-width: 80%;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .msg.lu_mingyuan .msg-bubble {
    background: var(--bg-panel);
    border: 1px solid var(--border);
  }
  .msg.player .msg-bubble {
    background: var(--blue-light);
    border: 1px solid var(--blue);
  }
  .msg.system .msg-bubble,
  .msg.system {
    color: var(--text-light);
    font-size: 11px;
  }
  .chat-input {
    display: flex;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid var(--border);
    background: var(--bg-panel);
  }
  .chat-input input {
    flex: 1;
    padding: 6px 10px;
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .chat-input button {
    padding: 6px 14px;
    font-size: 12px;
    background: var(--bg-toolbar);
    border: 1px solid var(--border);
    border-radius: 3px;
    cursor: pointer;
  }
  .chat-input button.hangup {
    background: var(--red);
    color: white;
    border-color: var(--red);
  }
</style>
