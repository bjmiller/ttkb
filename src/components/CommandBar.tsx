import React, { useEffect, useMemo } from 'react';
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
  helpBuildInfo?: string;
};

const CURSOR_SHAPE_CODES: Record<string, string> = {
  block_blink: '\u001b[1 q',
  block_noblink: '\u001b[2 q',
  underline_blink: '\u001b[3 q',
  underline_noblink: '\u001b[4 q',
  bar_blink: '\u001b[5 q',
  bar_noblink: '\u001b[6 q'
};

const DEFAULT_TERMINAL_HEIGHT = 24;
const CONTENT_COLUMN_OFFSET = 3;

const getInputMode = (state: CommandBarState) => {
  if (state.mode === 'input') {
    return state;
  }
  return null;
};

export const CommandBar = ({
  state,
  status,
  fileStatus,
  cursorStyle,
  fileError,
  filter,
  helpBuildInfo
}: CommandBarProps) => {
  const resolvedCursorStyle: CursorStyle = cursorStyle ?? { shape: 'block', blink: false };

  const inputMode = getInputMode(state);

  const shapeCode = useMemo(() => {
    if (resolvedCursorStyle.shape === 'native') {
      return null;
    }
    const key = `${resolvedCursorStyle.shape}_${resolvedCursorStyle.blink ? 'blink' : 'noblink'}`;
    return CURSOR_SHAPE_CODES[key] ?? null;
  }, [resolvedCursorStyle.shape, resolvedCursorStyle.blink]);

  const terminalHeight = process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT;
  const cursorRow = inputMode != null ? terminalHeight - 1 : null;
  const cursorCol =
    inputMode != null ? CONTENT_COLUMN_OFFSET + inputMode.prompt.length + inputMode.cursorPosition : null;

  useEffect(() => {
    if (cursorRow == null || cursorCol == null) {
      process.stdout.write('\u001b[?25l');
      return;
    }

    const shape = shapeCode ?? '';
    process.stdout.write(`\u001b[${cursorRow};${cursorCol}H${shape}\u001b[?25h`);
  }, [cursorRow, cursorCol, shapeCode]);

  const renderInputText = () => {
    if (!inputMode) {
      return null;
    }

    const text = inputMode.value;
    const chars: React.ReactNode[] = [];

    for (let i = 0; i < text.length; i++) {
      chars.push(
        <Text key={i} color="cyan">
          {text[i]}
        </Text>
      );
    }

    return (
      <>
        {inputMode.prompt}
        {chars}
      </>
    );
  };

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} minHeight={3}>
      {inputMode != null ? (
        <Text>{renderInputText()}</Text>
      ) : state.mode === 'confirm' ? (
        <Text color="yellow">{state.prompt}</Text>
      ) : state.mode === 'help' ? (
        <Box width="100%" justifyContent="space-between">
          <Text color="yellow">Press any key to dismiss help</Text>
          {helpBuildInfo != null ? <Text dimColor>{helpBuildInfo}</Text> : null}
        </Box>
      ) : (
        <Text>
          {status} | {fileStatus}
          {filter != null ? ` | filter:${filter}` : ''}
          {fileError != null ? ` | error:${fileError}` : ''}
        </Text>
      )}
    </Box>
  );
};
