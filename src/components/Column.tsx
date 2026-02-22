import React from 'react';
import { Box, Text } from 'ink';

import type { DisplayTask } from '../logic/columns';
import { getVisibleCardCount } from '../logic/cardView';
import { TaskCard } from './TaskCard';
import { UnparseableTaskCard } from './UnparseableTaskCard';

type ColumnProps = {
  title: string;
  tasks: DisplayTask[];
  selectedIndex: number;
  selectedColumn: boolean;
  scrollOffset: number;
  visibleRows: number;
  cardContentWidth: number;
  width: number;
};

const ColumnComponent = ({
  title,
  tasks,
  selectedIndex,
  selectedColumn,
  scrollOffset,
  visibleRows,
  cardContentWidth,
  width
}: ColumnProps) => {
  const visibleCount = React.useMemo(
    () => getVisibleCardCount(tasks, scrollOffset, visibleRows, cardContentWidth),
    [cardContentWidth, tasks, scrollOffset, visibleRows]
  );

  const visibleTasks = React.useMemo(
    () => tasks.slice(scrollOffset, scrollOffset + visibleCount),
    [tasks, scrollOffset, visibleCount]
  );

  return (
    <Box flexDirection="column" width={width} paddingX={1}>
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

export const Column = React.memo(ColumnComponent, (prev, next) => {
  if (prev.title !== next.title) {
    return false;
  }

  if (prev.tasks !== next.tasks) {
    return false;
  }

  if (
    prev.scrollOffset !== next.scrollOffset ||
    prev.visibleRows !== next.visibleRows ||
    prev.cardContentWidth !== next.cardContentWidth ||
    prev.width !== next.width
  ) {
    return false;
  }

  if (prev.selectedColumn !== next.selectedColumn) {
    return false;
  }

  if (!prev.selectedColumn && !next.selectedColumn) {
    return true;
  }

  return prev.selectedIndex === next.selectedIndex;
});

Column.displayName = 'Column';
