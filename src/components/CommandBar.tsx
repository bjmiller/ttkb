import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

import type { CursorStyle } from '../config/types';
import type { CommandBarState } from '../hooks/useCommandBar';

type CommandBarProps = {
  state: CommandBarState;
  status: string;
  fileStatus: string;
  cursorStyle?: CursorStyle;
  fileError?: string;
  filter?: string;
};

const CURSOR_BLINK_INTERVAL_MS = 530;

const CURSOR_GLYPH_BY_STYLE: Record<CursorStyle['shape'], string> = {
  native: '█',
  block: '█',
  bar: '│',
  underline: '▁'
};

export const CommandBar = ({ state, status, fileStatus, cursorStyle, fileError, filter }: CommandBarProps) => {
  const resolvedCursorStyle: CursorStyle = cursorStyle ?? { shape: 'block', blink: false };
  const cursorGlyph = CURSOR_GLYPH_BY_STYLE[resolvedCursorStyle.shape];
  const [blinkVisible, setBlinkVisible] = useState(true);

  useEffect(() => {
    if (state.mode !== 'input' || !resolvedCursorStyle.blink) {
      setBlinkVisible(true);
      return;
    }

    const intervalId = setInterval(() => {
      setBlinkVisible((current) => !current);
    }, CURSOR_BLINK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [state.mode, resolvedCursorStyle.blink]);

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} minHeight={3}>
      {state.mode === 'input' ? (
        <Text>
          {state.prompt}
          <Text color="cyan">{state.value}</Text>
          {blinkVisible ? <Text color="cyan">{cursorGlyph}</Text> : null}
        </Text>
      ) : state.mode === 'confirm' ? (
        <Text color="yellow">{state.prompt}</Text>
      ) : state.mode === 'help' ? (
        <Text color="yellow">Press any key to dismiss help</Text>
      ) : (
        <Text>
          {status} | {fileStatus}
          {filter ? ` | filter:${filter}` : ''}
          {fileError ? ` | error:${fileError}` : ''}
        </Text>
      )}
    </Box>
  );
};
