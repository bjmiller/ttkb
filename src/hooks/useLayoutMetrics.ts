import { useMemo } from 'react';

import { getVisibleCardCount } from '../logic/cardView';
import type { ColumnKey, Columns } from '../logic/columns';

const RESERVED_BOTTOM_ROWS = 4;
const DEFAULT_TERMINAL_HEIGHT = 24;
const DEFAULT_TERMINAL_WIDTH = 80;
const TABLE_ROW_HEIGHT = 1;
const COLUMN_HEADER_ROWS = 1;
const COLUMN_COUNT = 3;
const DOUBLE_SIDE_MULTIPLIER = 2;
const SECOND_COLUMN_REMAINDER_THRESHOLD = 2;
const COLUMN_HORIZONTAL_PADDING = 1;
const CARD_BORDER_COLUMNS = 2;
const CARD_HORIZONTAL_PADDING = 1;

type UseLayoutMetricsParams = {
  columns: Columns;
  selectedColumn: ColumnKey;
  scrollOffset: number;
};

type LayoutMetrics = {
  terminalHeight: number;
  tableVisibleCount: number;
  cardVisibleRows: number;
  cardContentWidth: number;
  cardVisibleCount: number;
  columnWidths: {
    backlog: number;
    doing: number;
    done: number;
  };
};

export const useLayoutMetrics = ({ columns, selectedColumn, scrollOffset }: UseLayoutMetricsParams): LayoutMetrics => {
  const terminalHeight = process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT;
  const terminalWidth = process.stdout.columns ?? DEFAULT_TERMINAL_WIDTH;

  const viewportRows = Math.max(1, terminalHeight - RESERVED_BOTTOM_ROWS);
  const cardVisibleRows = Math.max(1, viewportRows - COLUMN_HEADER_ROWS);
  const tableVisibleCount = Math.max(1, Math.floor(viewportRows / TABLE_ROW_HEIGHT));

  const columnWidths = useMemo(() => {
    const baseWidth = Math.floor(terminalWidth / COLUMN_COUNT);
    const remainder = terminalWidth - baseWidth * COLUMN_COUNT;

    return {
      backlog: baseWidth + (remainder >= 1 ? 1 : 0),
      doing: baseWidth + (remainder >= SECOND_COLUMN_REMAINDER_THRESHOLD ? 1 : 0),
      done: baseWidth
    };
  }, [terminalWidth]);

  const selectedColumnWidth = columnWidths[selectedColumn];
  const cardContentWidth = Math.max(
    1,
    selectedColumnWidth -
      COLUMN_HORIZONTAL_PADDING * DOUBLE_SIDE_MULTIPLIER -
      CARD_BORDER_COLUMNS -
      CARD_HORIZONTAL_PADDING * DOUBLE_SIDE_MULTIPLIER
  );

  const cardVisibleCount = useMemo(() => {
    const selectedTasks = columns[selectedColumn];
    const visibleCount = getVisibleCardCount(selectedTasks, scrollOffset, cardVisibleRows, cardContentWidth);

    if (selectedTasks.length === 0) {
      return 1;
    }

    return Math.max(1, visibleCount);
  }, [cardContentWidth, cardVisibleRows, columns, scrollOffset, selectedColumn]);

  return {
    terminalHeight,
    tableVisibleCount,
    cardVisibleRows,
    cardContentWidth,
    cardVisibleCount,
    columnWidths
  };
};
