import { useMemo, useState } from 'react';

import type { ColumnKey, Columns, DisplayTask } from '../logic/columns';
import { findCardSelectionByLineNumber, findTableSelectionIndexByLineNumber } from '../logic/selection';
import type { TableRow, TableSort } from '../logic/tableTypes';
import { sortTableRows } from '../logic/tableSort';
import type { ViewMode } from '../types';

type SelectionBridge = {
  selectedItem: DisplayTask | undefined;
  setColumnIndex: (column: ColumnKey, index: number) => void;
};

type UseTableViewStateParams = {
  columns: Columns;
  selection: SelectionBridge;
};

const buildTableRows = (columns: Columns): TableRow[] => {
  return [
    ...columns.backlog.map((task) => ({ status: 'backlog' as const, task })),
    ...columns.doing.map((task) => ({ status: 'doing' as const, task })),
    ...columns.done.map((task) => ({ status: 'done' as const, task }))
  ];
};

export const useTableViewState = ({ columns, selection }: UseTableViewStateParams) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [tableSelectedIndex, setTableSelectedIndex] = useState(0);
  const [tableSort, setTableSort] = useState<TableSort | undefined>();

  const tableRows = useMemo<TableRow[]>(() => {
    const rows = buildTableRows(columns);
    return sortTableRows(rows, tableSort);
  }, [columns, tableSort]);

  const setTableSelectionByLineNumber = (lineNumber: number, rows: TableRow[] = tableRows): boolean => {
    const nextSelectedIndex = findTableSelectionIndexByLineNumber(rows, lineNumber);
    if (nextSelectedIndex === undefined) {
      return false;
    }

    setTableSelectedIndex(nextSelectedIndex);
    return true;
  };

  const moveTableUp = () => {
    setTableSelectedIndex((current) => {
      const count = tableRows.length;
      if (count === 0) {
        return 0;
      }

      return (current - 1 + count) % count;
    });
  };

  const moveTableDown = () => {
    setTableSelectedIndex((current) => {
      const count = tableRows.length;
      if (count === 0) {
        return 0;
      }

      return (current + 1) % count;
    });
  };

  const toggleView = (): ViewMode => {
    if (viewMode === 'cards') {
      const selected = selection.selectedItem;
      if (selected) {
        setTableSelectionByLineNumber(selected.item.lineNumber);
      }

      setViewMode('table');
      return 'table';
    }

    const selected = tableRows[tableSelectedIndex]?.task;
    if (selected) {
      const nextSelection = findCardSelectionByLineNumber(columns, selected.item.lineNumber);
      if (nextSelection) {
        selection.setColumnIndex(nextSelection.column, nextSelection.index);
      }
    }

    setViewMode('cards');
    return 'cards';
  };

  return {
    viewMode,
    tableSelectedIndex,
    tableSort,
    tableRows,
    setViewMode,
    setTableSelectedIndex,
    setTableSort,
    moveTableUp,
    moveTableDown,
    toggleView,
    setTableSelectionByLineNumber,
    buildTableRows
  };
};
