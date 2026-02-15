import React from 'react';
import { render } from 'ink';

import { loadConfig, type CursorShape, type CursorStyle } from './src/config';
import { App } from './src/components/App';
import { detectTerminalCursor } from './src/terminal/detectCursor';

const enterAlternateScreen = () => {
  process.stdout.write('\u001b[?1049h\u001b[2J\u001b[H');
};

const leaveAlternateScreen = () => {
  process.stdout.write('\u001b[?1049l');
};

const DEFAULT_CURSOR_STYLE: Exclude<CursorShape, 'native'> = 'block';
const DEFAULT_CURSOR_BLINK = false;

const main = async () => {
  const config = await loadConfig();

  const explicitCursorShape = config.cursorStyle && config.cursorStyle !== 'native' ? config.cursorStyle : undefined;
  const explicitCursorBlink = config.cursorBlink;

  const detectedCursor = explicitCursorShape ? undefined : await detectTerminalCursor();
  const resolvedCursorStyle: CursorStyle = {
    shape: explicitCursorShape ?? detectedCursor?.style ?? DEFAULT_CURSOR_STYLE,
    blink: explicitCursorBlink ?? detectedCursor?.blink ?? DEFAULT_CURSOR_BLINK
  };

  enterAlternateScreen();
  const app = render(<App todoFilePath={config.todoFilePath} cursorStyle={resolvedCursorStyle} />);

  const cleanup = () => {
    leaveAlternateScreen();
  };

  process.on('SIGINT', () => {
    cleanup();
    app.unmount();
    process.exit(0);
  });

  await app.waitUntilExit();
  cleanup();
};

void main();
