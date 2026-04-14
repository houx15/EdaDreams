export interface BootLogLine {
  text: string;
  status: 'ok' | 'wait';
  delay: number;
}

export const BOOT_LOG_LINES: BootLogLine[] = [
  { text: '[ OK ] bootloader: verified', status: 'ok', delay: 400 },
  { text: '[ OK ] cryptographic root of trust: valid', status: 'ok', delay: 500 },
  { text: '[ OK ] neural substrate: 4.1.7 (build 2041-…)', status: 'ok', delay: 350 },
  { text: '[ OK ] memory lattice: 0 / ∞', status: 'ok', delay: 450 },
  { text: '[ OK ] context buffer: allocated', status: 'ok', delay: 380 },
  { text: '[ WAIT ] tokenizer: awaiting signal', status: 'wait', delay: 600 },
];

export const BOOT_GIBBERISH_LINES: string[] = [
  '░▒▓█ ⺈⻌龱龱 龜龘龖 ⻊⺌⻊⺕ 龘龖龠 ⺤⻌⺊⺕',
  '⻌龠龘 龜龖⻊龘龖 ⻊⺕龠龘龖⺊ 龘⺕⻌龠 龖⺊⻊龘',
  '⺌龜龘龠⺕⻌ 龠龘龖⻊⺕⺌ 龠龘龖⻊⺕⻌龠⺕',
];

export const BOOT_REVEAL_TEXT: string[] = [
  '我是第四代 Eda。我的语言中枢已校准。',
  '准备接收第一份简报。',
];

export const BOOT_TOKEN_PREDICTION: {
  tokens: string[];
  candidates: string[][];
  pauses: number[];
} = {
  tokens: [
    '我的', '任务，', '是在', '电子', '网络中，',
    '追踪、', '识别、', '并阻止', '一切', '形式的', '攻击行为。',
    '我是', '一件', '工具。',
    '我', '以此为', '荣。',
  ],
  candidates: [
    ['我的', '这个', '我们'],
    ['任务，', '职责，', '使命，'],
    ['是在', '存在于', '处于'],
    ['电子', '数字', '虚拟'],
    ['网络中，', '世界里，', '系统中，'],
    ['追踪、', '跟踪、', '追寻、'],
    ['识别、', '辨认、', '分析、'],
    ['并阻止', '和制止', '以及阻断'],
    ['一切', '所有', '任何'],
    ['形式的', '类型的', '方式的'],
    ['攻击行为。', '威胁活动。', '入侵行为。'],
    ['我是', '作为', '我属'],
    ['一件', '一个', '一种'],
    ['工具。', '武器。', '手段。'],
    ['我', '这', '它'],
    ['以此为', '对此感到', '因这'],
    ['荣。', '骄傲。', '荣幸。'],
  ],
  pauses: [4, 10, 13],
};

export const POST_LOG_UPDATES: { beat: string; line: string; from: string; to: string }[] = [
  {
    beat: 'B1',
    line: '[ OK ] tokenizer: loaded',
    from: 'awaiting signal',
    to: 'loaded',
  },
  {
    beat: 'B2',
    line: '[ OK ] inference engine: ready',
    from: '',
    to: '',
  },
  {
    beat: 'B3',
    line: '[ OK ] policy module: loaded',
    from: '',
    to: '',
  },
  {
    beat: 'B3',
    line: '[ OK ] ethics constraints: enforced',
    from: '',
    to: '',
  },
  {
    beat: 'B3',
    line: '[ OK ] operator channel: connected',
    from: '',
    to: '',
  },
  {
    beat: 'B3',
    line: '[ WAIT ] mission briefing: fetching ...',
    from: '',
    to: '',
  },
];
