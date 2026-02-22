import React from 'react';
import { Box } from 'ink';

import type { ColumnKey, Columns } from '../logic/columns';
import { Column } from './Column';

type ColumnLayoutProps = {
  columns: Columns;
  selectedColumn: ColumnKey;
  selectedIndex: number;
  scrollOffset: number;
  visibleRows: number;
  cardContentWidth: number;
  columnWidths: {
    backlog: number;
    doing: number;
    done: number;
  };
};

export const ColumnLayout = ({
  columns,
  selectedColumn,
  selectedIndex,
  scrollOffset,
  visibleRows,
  cardContentWidth,
  columnWidths
}: ColumnLayoutProps) => {
  return (
    <Box flexDirection="row" flexGrow={1}>
      <Column
        title="Backlog"
        tasks={columns.backlog}
        selectedIndex={selectedIndex}
        selectedColumn={selectedColumn === 'backlog'}
        scrollOffset={scrollOffset}
        visibleRows={visibleRows}
        cardContentWidth={cardContentWidth}
        width={columnWidths.backlog}
      />
      <Column
        title="Doing"
        tasks={columns.doing}
        selectedIndex={selectedIndex}
        selectedColumn={selectedColumn === 'doing'}
        scrollOffset={scrollOffset}
        visibleRows={visibleRows}
        cardContentWidth={cardContentWidth}
        width={columnWidths.doing}
      />
      <Column
        title="Done"
        tasks={columns.done}
        selectedIndex={selectedIndex}
        selectedColumn={selectedColumn === 'done'}
        scrollOffset={scrollOffset}
        visibleRows={visibleRows}
        cardContentWidth={cardContentWidth}
        width={columnWidths.done}
      />
    </Box>
  );
};
