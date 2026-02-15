import React from 'react';
import { render } from 'ink';

import { loadConfig } from './src/config/load';
import type { CursorShape, CursorStyle } from './src/config/types';
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

  process.on('SIGINT', () => {
    leaveAlternateScreen();
    app.unmount();
    process.exit(0);
  });

  await app.waitUntilExit();
  leaveAlternateScreen();
};

void main();
