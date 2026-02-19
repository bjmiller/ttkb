import { buildColumns, type Columns } from '../logic/columns';
import {
  FIRST_SORT_COLUMN,
  TABLE_SORT_COLUMNS,
  type TableRow,
  type TableSort,
  sortTableRows
} from '../logic/tableSort';
import type { TodoItem, UnparseableTodoItem } from '../parser/types';
import type { CommandBarState } from './useCommandBar';

type ViewMode = 'cards' | 'table';

type CommandBarActions = {
  filter: string | undefined;
  state: CommandBarState;
  clearFilter: () => void;
  toggleFilter: () => void;
  cancel: () => void;
  setStatusText: (value: string) => void;
};

type UseTableCommandsParams = {
  viewMode: ViewMode;
  tableRows: TableRow[];
  tableSelectedIndex: number;
  tableSort: TableSort | undefined;
  setTableSelectedIndex: (value: number | ((current: number) => number)) => void;
  setTableSort: (value: TableSort | undefined) => void;
  columns: Columns;
  items: TodoItem[];
  errors: UnparseableTodoItem[];
  buildTableRows: (columns: Columns) => TableRow[];
  toggleView: () => ViewMode;
  commandBar: CommandBarActions;
  onViewModeChanged: (nextMode: ViewMode) => void;
};

export const shouldClearFilterOnCancel = (params: { hasFilter: boolean; state: CommandBarState }): boolean => {
  if (!params.hasFilter) {
    return false;
  }

  return params.state.mode === 'idle' || (params.state.mode === 'input' && params.state.kind === 'filter');
};

export const useTableCommands = ({
  viewMode,
  tableRows,
  tableSelectedIndex,
  tableSort,
  setTableSelectedIndex,
  setTableSort,
  columns,
  items,
  errors,
  buildTableRows,
  toggleView,
  commandBar,
  onViewModeChanged
}: UseTableCommandsParams) => {
  const clearFilter = () => {
    if (viewMode !== 'table') {
      commandBar.clearFilter();
      return;
    }

    const selected = tableRows[tableSelectedIndex]?.task;

    if (selected) {
      const unfilteredColumns = buildColumns(items, errors, undefined);
      const unfilteredRowsBase = buildTableRows(unfilteredColumns);
      const unfilteredRows = sortTableRows(unfilteredRowsBase, tableSort);
      const nextSelectedIndex = unfilteredRows.findIndex(
        (row) => row.task.item.lineNumber === selected.item.lineNumber
      );

      if (nextSelectedIndex >= 0) {
        setTableSelectedIndex(nextSelectedIndex);
      }
    }

    commandBar.clearFilter();
  };

  const toggleFilter = () => {
    if (viewMode === 'table' && commandBar.filter) {
      clearFilter();
      return;
    }

    commandBar.toggleFilter();
  };

  const cancel = () => {
    const isClearingFilter = shouldClearFilterOnCancel({
      hasFilter: Boolean(commandBar.filter),
      state: commandBar.state
    });

    if (viewMode === 'table' && isClearingFilter) {
      clearFilter();
      return;
    }

    if (viewMode === 'table' && commandBar.state.mode === 'idle' && tableSort) {
      const selected = tableRows[tableSelectedIndex]?.task;
      const unsortedRows = buildTableRows(columns);

      if (selected) {
        const nextSelectedIndex = unsortedRows.findIndex(
          (row) => row.task.item.lineNumber === selected.item.lineNumber
        );
        if (nextSelectedIndex >= 0) {
          setTableSelectedIndex(nextSelectedIndex);
        }
      }

      setTableSort(undefined);
      commandBar.setStatusText('Table sort cleared');
      return;
    }

    commandBar.cancel();
  };

  const cycleTableSortColumn = () => {
    if (viewMode !== 'table') {
      return;
    }

    const selected = tableRows[tableSelectedIndex]?.task;
    const baseRows = buildTableRows(columns);
    const nextSort: TableSort = (() => {
      if (!tableSort) {
        return { column: FIRST_SORT_COLUMN, direction: 'asc' };
      }

      const currentIndex = TABLE_SORT_COLUMNS.indexOf(tableSort.column);
      const nextIndex = (currentIndex + 1) % TABLE_SORT_COLUMNS.length;
      return { column: TABLE_SORT_COLUMNS[nextIndex] ?? FIRST_SORT_COLUMN, direction: 'asc' };
    })();

    const nextRows = sortTableRows(baseRows, nextSort);
    setTableSort(nextSort);

    if (selected) {
      const nextIndex = nextRows.findIndex((row) => row.task.item.lineNumber === selected.item.lineNumber);
      if (nextIndex >= 0) {
        setTableSelectedIndex(nextIndex);
      }
    }

    commandBar.setStatusText(`Sort: ${nextSort.column} (${nextSort.direction})`);
  };

  const toggleTableSortDirection = () => {
    if (viewMode !== 'table' || !tableSort) {
      return;
    }

    const selected = tableRows[tableSelectedIndex]?.task;

    const nextSort: TableSort = {
      column: tableSort.column,
      direction: tableSort.direction === 'asc' ? 'desc' : 'asc'
    };
    const baseRows = buildTableRows(columns);
    const nextRows = sortTableRows(baseRows, nextSort);
    setTableSort(nextSort);

    if (selected) {
      const nextIndex = nextRows.findIndex((row) => row.task.item.lineNumber === selected.item.lineNumber);
      if (nextIndex >= 0) {
        setTableSelectedIndex(nextIndex);
      }
    }

    commandBar.setStatusText(`Sort: ${nextSort.column} (${nextSort.direction})`);
  };

  const onToggleView = () => {
    const nextMode = toggleView();
    onViewModeChanged(nextMode);
  };

  return {
    clearFilter,
    toggleFilter,
    cancel,
    cycleTableSortColumn,
    toggleTableSortDirection,
    onToggleView
  };
};
