// oxlint-disable no-control-regex
import type { CursorShape } from '../config/types';

const CURSOR_QUERY = '\u001bP$q q\u001b\\';
const RESPONSE_PATTERN = /\u001bP1\$r(\d+) q(?:\u001b\\|\u0007)/;
const PROBE_TIMEOUT_MS = 120;
const STEADY_BLOCK_CODE = 2;
const BLINKING_UNDERLINE_CODE = 3;
const STEADY_UNDERLINE_CODE = 4;
const BLINKING_BAR_CODE = 5;
const STEADY_BAR_CODE = 6;

type CursorProfile = {
  style: Exclude<CursorShape, 'native'>;
  blink: boolean;
};

const decodeCursorCode = (code: number): CursorProfile | undefined => {
  switch (code) {
    case 0:
    case 1:
      return { style: 'block', blink: true };
    case STEADY_BLOCK_CODE:
      return { style: 'block', blink: false };
    case BLINKING_UNDERLINE_CODE:
      return { style: 'underline', blink: true };
    case STEADY_UNDERLINE_CODE:
      return { style: 'underline', blink: false };
    case BLINKING_BAR_CODE:
      return { style: 'bar', blink: true };
    case STEADY_BAR_CODE:
      return { style: 'bar', blink: false };
    default:
      return undefined;
  }
};

export const detectTerminalCursor = (): Promise<CursorProfile | undefined> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return Promise.resolve(undefined);
  }

  const ttyStdin = process.stdin;
  const wasRaw = Boolean((ttyStdin as { isRaw?: boolean }).isRaw);

  return new Promise<CursorProfile | undefined>((resolve) => {
    let completed = false;
    let buffer = '';

    const cleanup = () => {
      ttyStdin.off('data', onData);
      if (!wasRaw && 'setRawMode' in ttyStdin && typeof ttyStdin.setRawMode === 'function') {
        ttyStdin.setRawMode(false);
      }
    };

    const finish = (result: CursorProfile | undefined) => {
      if (completed) {
        return;
      }

      completed = true;
      clearTimeout(timeoutId);
      cleanup();
      resolve(result);
    };

    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const match = buffer.match(RESPONSE_PATTERN);
      if (!match || !match[1]) {
        return;
      }

      const code = Number.parseInt(match[1], 10);
      finish(decodeCursorCode(code));
    };

    const timeoutId = setTimeout(() => {
      finish(undefined);
    }, PROBE_TIMEOUT_MS);

    if (!wasRaw && 'setRawMode' in ttyStdin && typeof ttyStdin.setRawMode === 'function') {
      ttyStdin.setRawMode(true);
    }

    ttyStdin.on('data', onData);
    process.stdout.write(CURSOR_QUERY);
  });
};
