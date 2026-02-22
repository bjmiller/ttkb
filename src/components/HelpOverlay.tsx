import React from 'react';
import { Box, Text } from 'ink';

type HelpOverlayProps = {
  maxRows?: number;
};

const OVERLAY_CHROME_ROWS = 2;
const TITLE_ROWS = 1;

const COMMAND_LINES = [
  'Arrows: navigate',
  'x: toggle completion',
  'd: toggle backlog/doing',
  'a: add task',
  'e: edit selected task description',
  'p: change priority',
  's: cycle table sort column',
  '.: toggle table sort direction',
  'f: filter tasks',
  'v: toggle card/table view',
  'c: clean done to done.txt',
  ';: edit selected task dates',
  'Delete: delete selected task (confirm)',
  'Tab: switch created/completed date while editing done task dates',
  'Shift-Q: quit confirmation',
  'Esc: dismiss input/filter, clear table sort',
  '?: help'
];

export const HelpOverlay = ({ maxRows }: HelpOverlayProps) => {
  const availableCommandRows =
    maxRows === undefined ? COMMAND_LINES.length : Math.max(1, maxRows - OVERLAY_CHROME_ROWS - TITLE_ROWS);

  const hasOverflow = COMMAND_LINES.length > availableCommandRows;
  const visibleCommandRows = hasOverflow ? Math.max(1, availableCommandRows - 1) : availableCommandRows;
  const commandsToRender = COMMAND_LINES.slice(0, visibleCommandRows);

  return (
    <Box borderStyle="round" borderColor="yellow" paddingX={1} flexDirection="column">
      <Text bold># ttkb commands</Text>
      {commandsToRender.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
      {hasOverflow ? <Text dimColor>...more (resize terminal)</Text> : null}
    </Box>
  );
};
