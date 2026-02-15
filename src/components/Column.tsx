import React from 'react';
import { Box, Text } from 'ink';

import type { DisplayTask } from '../logic/columns';
import { TaskCard } from './TaskCard';
import { UnparseableTaskCard } from './UnparseableTaskCard';

type Props = {
  title: string;
  tasks: DisplayTask[];
  selectedIndex: number;
  selectedColumn: boolean;
  scrollOffset: number;
  visibleCount: number;
};

export const Column = ({ title, tasks, selectedIndex, selectedColumn, scrollOffset, visibleCount }: Props) => {
  const visibleTasks = tasks.slice(scrollOffset, scrollOffset + visibleCount);

  return (
    <Box flexDirection="column" width="33%" paddingX={1}>
      <Text bold>{title}</Text>
      <Box flexDirection="column" marginTop={0}>
        {visibleTasks.length === 0 ? <Text dimColor>(empty)</Text> : null}
        {visibleTasks.map((task, index) => {
          const absoluteIndex = scrollOffset + index;
          const selected = selectedColumn && absoluteIndex === selectedIndex;

          if (task.kind === 'unparseable') {
            return (
              <UnparseableTaskCard key={`unparseable-${task.item.lineNumber}`} item={task.item} selected={selected} />
            );
          }

          return <TaskCard key={`todo-${task.item.lineNumber}`} item={task.item} selected={selected} />;
        })}
      </Box>
    </Box>
  );
};
