import React from 'react';
import { Box } from 'ink';

import type { ColumnKey, Columns } from '../logic/columns';
import { Column } from './Column';

type ColumnLayoutProps = {
  columns: Columns;
  selectedColumn: ColumnKey;
  selectedIndex: number;
  scrollOffset: number;
  visibleCount: number;
};

export const ColumnLayout = ({
  columns,
  selectedColumn,
  selectedIndex,
  scrollOffset,
  visibleCount
}: ColumnLayoutProps) => {
  return (
    <Box flexDirection="row" flexGrow={1}>
      <Column
        title="Backlog"
        tasks={columns.backlog}
        selectedIndex={selectedIndex}
        selectedColumn={selectedColumn === 'backlog'}
        scrollOffset={scrollOffset}
        visibleCount={visibleCount}
      />
      <Column
        title="Doing"
        tasks={columns.doing}
        selectedIndex={selectedIndex}
        selectedColumn={selectedColumn === 'doing'}
        scrollOffset={scrollOffset}
        visibleCount={visibleCount}
      />
      <Column
        title="Done"
        tasks={columns.done}
        selectedIndex={selectedIndex}
        selectedColumn={selectedColumn === 'done'}
        scrollOffset={scrollOffset}
        visibleCount={visibleCount}
      />
    </Box>
  );
};
