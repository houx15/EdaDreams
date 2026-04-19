import type {
  LuMingyuanDialogData,
  DialogEntry,
  DialogMessage,
  DialogTurnResult,
  PendingAction,
} from '$lib/engine/types-v2';
import type { StateMachine } from './state-machine';

function matchesDialog(message: string, entry: DialogEntry): boolean {
  const normalized = message.toLowerCase();
  return entry.match.some((pattern) => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(message);
    } catch {
      const alternatives = pattern.split('|').map((s) => s.trim().toLowerCase());
      return alternatives.some((alt) => normalized.includes(alt));
    }
  });
}

function matchesAdditionalKeywords(message: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) return true;
  const normalized = message.toLowerCase();
  return patterns.some((pattern) => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(message);
    } catch {
      const alternatives = pattern.split('|').map((s) => s.trim().toLowerCase());
      return alternatives.some((alt) => normalized.includes(alt));
    }
  });
}

function containsAnyKeyword(message: string, patternString: string): boolean {
  const normalized = message.toLowerCase();
  const alternatives = patternString.split('|').map((s) => s.trim());
  return alternatives.some((alt) => normalized.includes(alt.toLowerCase()));
}

export class DialogEngine {
  private data: LuMingyuanDialogData;
  private stateMachine: StateMachine;
  private pendingAction: PendingAction | null = null;

  constructor(data: LuMingyuanDialogData, stateMachine: StateMachine) {
    this.data = data;
    this.stateMachine = stateMachine;
  }

  get greeting(): string {
    return this.data._meta.greeting;
  }

  get farewell(): string {
    return this.data._meta.farewell;
  }

  get phoneNumber(): string {
    return this.data._meta.phone_number;
  }

  get hasPendingAction(): boolean {
    return this.pendingAction !== null;
  }

  clearPendingAction(): void {
    this.pendingAction = null;
  }

  processMessage(playerMessage: string): DialogTurnResult {
    if (this.pendingAction) {
      return this.handlePendingAction(playerMessage);
    }

    const matchedEntries: DialogEntry[] = [];
    for (const entry of this.data.dialogs) {
      if (matchesDialog(playerMessage, entry)) {
        matchedEntries.push(entry);
      }
    }

    if (matchedEntries.length === 0) {
      return {
        messages: [this.createLuMessage(this.data._meta.default_response)],
      };
    }

    matchedEntries.sort((a, b) => b.priority - a.priority);

    for (const entry of matchedEntries) {
      const prerequisiteCheck = entry.prerequisite_check;
      let skipEntry = false;

      if (prerequisiteCheck) {
        const isUnlocked = this.stateMachine.isUnlocked(prerequisiteCheck);
        if (!isUnlocked) {
          if (entry.prerequisite_not_met_response) {
            return {
              messages: [this.createLuMessage(entry.prerequisite_not_met_response)],
            };
          }
          if (entry.prerequisite_met === true) {
            skipEntry = true;
          }
        }
        if (!skipEntry && entry.prerequisite_met === false && isUnlocked) {
          if (entry.prerequisite_not_met_response) {
            return {
              messages: [this.createLuMessage(entry.prerequisite_not_met_response)],
            };
          }
          skipEntry = true;
        }
        if (!skipEntry && entry.prerequisite_met === true && entry.additional_match) {
          if (!matchesAdditionalKeywords(playerMessage, entry.additional_match)) {
            skipEntry = true;
          }
        }
      }

      if (skipEntry) {
        continue;
      }

      if (entry.context_check) {
        const keywords = this.parseContextCheckKeywords(entry.context_check);
        const hasContext = keywords.some((kw) => playerMessage.toLowerCase().includes(kw.toLowerCase()));

        if (hasContext) {
          const immediateMsg = entry.response_if_context_yes || '';
          const messages: DialogMessage[] = immediateMsg ? [this.createLuMessage(immediateMsg)] : [];

          if (entry.response_delay_seconds && entry.response_followup && entry.triggers_unlock) {
            return {
              messages,
              delayedFollowup: {
                delaySeconds: entry.response_delay_seconds,
                followupMessage: entry.response_followup,
                unlockOnComplete: entry.triggers_unlock,
              },
            };
          }
          return { messages };
        } else {
          return {
            messages: [this.createLuMessage(entry.response_if_context_no || '你要查什么？')],
          };
        }
      }

      if (entry.player_must_justify) {
        this.pendingAction = { type: 'justify', dialogId: entry.id };
        return {
          messages: [this.createLuMessage(entry.response || '')],
          pendingAction: this.pendingAction,
        };
      }

      if (entry.player_confirms) {
        this.pendingAction = { type: 'confirm', dialogId: entry.id };
        return {
          messages: [this.createLuMessage(entry.response || '')],
          pendingAction: this.pendingAction,
        };
      }

      if (entry.player_explains) {
        this.pendingAction = { type: 'explain', dialogId: entry.id };
        return {
          messages: [this.createLuMessage(entry.response || '')],
          pendingAction: this.pendingAction,
        };
      }

      return this.buildResponse(entry, playerMessage);
    }

    return {
      messages: [this.createLuMessage(this.data._meta.default_response)],
    };
  }

  private handlePendingAction(playerMessage: string): DialogTurnResult {
    if (!this.pendingAction) {
      return { messages: [this.createLuMessage(this.data._meta.default_response)] };
    }

    const entry = this.data.dialogs.find((d) => d.id === this.pendingAction!.dialogId);
    if (!entry) {
      this.pendingAction = null;
      return { messages: [this.createLuMessage(this.data._meta.default_response)] };
    }

    if (this.pendingAction.type === 'justify') {
      const justifications = entry.valid_justifications || [];
      const isValid = justifications.some((j) => playerMessage.toLowerCase().includes(j.toLowerCase()));
      if (isValid) {
        this.pendingAction = null;
        return this.buildResponse(entry, playerMessage, true);
      } else {
        return {
          messages: [this.createLuMessage('能再说具体一点吗？')],
          pendingAction: this.pendingAction,
        };
      }
    }

    if (this.pendingAction.type === 'confirm') {
      const positive = /是|对|好|没错|确认|嗯|行/.test(playerMessage);
      if (positive) {
        this.pendingAction = null;
        return this.buildResponse(entry, playerMessage, true);
      } else {
        this.pendingAction = null;
        return {
          messages: [this.createLuMessage('那算了，有需要再说。')],
        };
      }
    }

    if (this.pendingAction.type === 'explain') {
      this.pendingAction = null;
      return this.buildResponse(entry, playerMessage, true);
    }

    this.pendingAction = null;
    return { messages: [this.createLuMessage(this.data._meta.default_response)] };
  }

  private buildResponse(
    entry: DialogEntry,
    _playerMessage: string,
    useAfterResponse = false,
  ): DialogTurnResult {
    const messages: DialogMessage[] = [];
    let triggeredUnlock: string | undefined;
    let delayedFollowup: DialogTurnResult['delayedFollowup'];

    const baseResponse = useAfterResponse
      ? entry.response_after_explanation || entry.response_after_justification || entry.response_after_confirm || ''
      : entry.prerequisite_met_response || entry.response_immediate || entry.response || '';

    if (baseResponse) {
      messages.push(this.createLuMessage(baseResponse));
    }

    if (entry.follow_up) {
      messages.push(this.createLuMessage(entry.follow_up));
    }

    if (entry.response_delay_seconds && entry.response_followup && entry.triggers_unlock) {
      delayedFollowup = {
        delaySeconds: entry.response_delay_seconds,
        followupMessage: entry.response_followup,
        unlockOnComplete: entry.triggers_unlock,
      };
    } else if (entry.triggers_unlock) {
      const unlockResult = this.stateMachine.tryUnlock(entry.triggers_unlock, '');
      if (unlockResult.success) {
        triggeredUnlock = entry.triggers_unlock;
      }
    }

    return { messages, triggeredUnlock, delayedFollowup };
  }

  private parseContextCheckKeywords(contextCheck: string): string[] {
    const match = contextCheck.match(/['']([^'']+)['']/);
    if (match) {
      return match[1].split('|').map((s) => s.trim()).filter(Boolean);
    }
    return contextCheck.split('|').map((s) => s.trim()).filter(Boolean);
  }

  private createLuMessage(text: string): DialogMessage {
    return {
      speaker: 'lu_mingyuan',
      text,
      timestamp: Date.now(),
    };
  }
}
