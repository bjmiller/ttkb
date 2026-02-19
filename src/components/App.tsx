import React, { useEffect, useMemo, useState } from 'react';
import path from 'node:path';
import { Box, useApp } from 'ink';

import type { CursorStyle } from '../config/types';

import { type CommandBarState, useCommandBar } from '../hooks/useCommandBar';
import { useKeyboardCommands } from '../hooks/useKeyboardCommands';
import { useSelection } from '../hooks/useSelection';
import { useTodoFile } from '../hooks/useTodoFile';
import { type Columns, buildColumns } from '../logic/columns';
import {
  addTask,
  changeDates,
  changeDescription,
  changePriority,
  partitionCompleted,
  toggleCompletion,
  toggleDoing
} from '../logic/mutations';
import { appendLinesToFile } from '../logic/persistence';
import {
  type TableRow,
  type TableSort,
  FIRST_SORT_COLUMN,
  TABLE_SORT_COLUMNS,
  sortTableRows
} from '../logic/tableSort';
import { CommandBar } from './CommandBar';
import { ColumnLayout } from './ColumnLayout';
import { HelpOverlay } from './HelpOverlay';
import { TableView } from './TableView';

type AppProps = {
  todoFilePath: string;
  cursorStyle?: CursorStyle;
};

const ESTIMATED_CARD_HEIGHT = 6;
const RESERVED_BOTTOM_ROWS = 4;
const DEFAULT_TERMINAL_HEIGHT = 24;
const DONE_FILE_NAME = 'done.txt';
const HIDE_CURSOR = '\u001b[?25l';
const SHOW_CURSOR = '\u001b[?25h';
const TABLE_ROW_HEIGHT = 1;

type ViewMode = 'cards' | 'table';

const byLineNumber = <T extends { lineNumber: number }>(left: T, right: T) => left.lineNumber - right.lineNumber;

const buildTableRows = (columns: Columns): TableRow[] => {
  return [
    ...columns.backlog.map((task) => ({ status: 'backlog' as const, task })),
    ...columns.doing.map((task) => ({ status: 'doing' as const, task })),
    ...columns.done.map((task) => ({ status: 'done' as const, task }))
  ];
};

const findCardSelectionByLineNumber = (
  columns: Columns,
  lineNumber: number
): { column: 'backlog' | 'doing' | 'done'; index: number } | undefined => {
  const backlogIndex = columns.backlog.findIndex((task) => task.item.lineNumber === lineNumber);
  if (backlogIndex >= 0) {
    return { column: 'backlog', index: backlogIndex };
  }

  const doingIndex = columns.doing.findIndex((task) => task.item.lineNumber === lineNumber);
  if (doingIndex >= 0) {
    return { column: 'doing', index: doingIndex };
  }

  const doneIndex = columns.done.findIndex((task) => task.item.lineNumber === lineNumber);
  if (doneIndex >= 0) {
    return { column: 'done', index: doneIndex };
  }

  return undefined;
};

export const shouldClearFilterOnCancel = (params: { hasFilter: boolean; state: CommandBarState }): boolean => {
  if (!params.hasFilter) {
    return false;
  }

  return params.state.mode === 'idle' || (params.state.mode === 'input' && params.state.kind === 'filter');
};

export const App = ({ todoFilePath, cursorStyle }: AppProps) => {
  const { exit } = useApp();
  const terminalHeight = process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT;
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [tableSelectedIndex, setTableSelectedIndex] = useState(0);
  const [tableSort, setTableSort] = useState<TableSort | undefined>();

  const { items, errors, status: fileStatus, error: fileError, mutateTodos } = useTodoFile(todoFilePath);
  const commandBar = useCommandBar();

  const columns = useMemo(() => buildColumns(items, errors, commandBar.filter), [items, errors, commandBar.filter]);

  const selection = useSelection(columns);
  const tableRows = useMemo<TableRow[]>(() => {
    const rows = buildTableRows(columns);
    return sortTableRows(rows, tableSort);
  }, [columns, tableSort]);

  const doneFilePath = useMemo(() => path.join(path.dirname(todoFilePath), DONE_FILE_NAME), [todoFilePath]);
  const viewportRows = Math.max(1, terminalHeight - RESERVED_BOTTOM_ROWS);
  const cardVisibleCount = Math.max(1, Math.floor(viewportRows / ESTIMATED_CARD_HEIGHT));
  const tableVisibleCount = Math.max(1, Math.floor(viewportRows / TABLE_ROW_HEIGHT));

  useEffect(() => {
    setTableSelectedIndex((current) => {
      if (tableRows.length === 0) {
        return 0;
      }

      return Math.min(current, tableRows.length - 1);
    });
  }, [tableRows]);

  useEffect(() => {
    const selectedIndex = viewMode === 'table' ? tableSelectedIndex : selection.selectedIndex;
    const visibleCount = viewMode === 'table' ? tableVisibleCount : cardVisibleCount;

    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + visibleCount) {
      setScrollOffset(Math.max(selectedIndex - visibleCount + 1, 0));
    }
  }, [cardVisibleCount, scrollOffset, selection.selectedIndex, tableSelectedIndex, tableVisibleCount, viewMode]);

  useEffect(() => {
    process.stdout.write(HIDE_CURSOR);

    return () => {
      process.stdout.write(SHOW_CURSOR);
    };
  }, []);

  const applySubmit = () => {
    const action = commandBar.submit();
    if (action.type === 'quit') {
      exit();
      return;
    }

    const activeSelected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;

    if (action.type === 'change-priority') {
      const selected = activeSelected;
      if (!selected || selected.kind !== 'todo') {
        commandBar.setStatusText('No selectable task');
        return;
      }

      void mutateTodos((todoItems, parseErrors) => {
        const nextTodoItems = todoItems.map((todoItem) =>
          todoItem.lineNumber === selected.item.lineNumber ? changePriority(todoItem, action.priority) : todoItem
        );

        commandBar.setStatusText('Priority updated');
        return [...nextTodoItems, ...parseErrors].sort(byLineNumber);
      });
      return;
    }

    if (action.type === 'change-description') {
      const selected = activeSelected;
      if (!selected || selected.kind !== 'todo') {
        commandBar.setStatusText('No selectable task');
        return;
      }

      void mutateTodos((todoItems, parseErrors) => {
        const nextTodoItems = todoItems.map((todoItem) =>
          todoItem.lineNumber === selected.item.lineNumber ? changeDescription(todoItem, action.description) : todoItem
        );

        commandBar.setStatusText('Description updated');
        return [...nextTodoItems, ...parseErrors].sort(byLineNumber);
      });
      return;
    }

    if (action.type === 'change-dates') {
      const selected = activeSelected;
      if (!selected || selected.kind !== 'todo') {
        commandBar.setStatusText('No selectable task');
        return;
      }

      void mutateTodos((todoItems, parseErrors) => {
        const nextTodoItems = todoItems.map((todoItem) =>
          todoItem.lineNumber === selected.item.lineNumber ? changeDates(todoItem, action) : todoItem
        );

        commandBar.setStatusText('Date updated');
        return [...nextTodoItems, ...parseErrors].sort(byLineNumber);
      });
      return;
    }

    if (action.type === 'add') {
      void mutateTodos((todoItems, parseErrors) => {
        const maxLine = [...todoItems, ...parseErrors].reduce((max, line) => Math.max(max, line.lineNumber), 0);
        const created = addTask({
          lineNumber: maxLine + 1,
          description: action.description,
          ...(action.priority ? { priority: action.priority } : {})
        });

        commandBar.setStatusText('Task added');
        return [...todoItems, ...parseErrors, created].sort(byLineNumber);
      });
      return;
    }

    if (action.type === 'set-filter') {
      setScrollOffset(0);
    }
  };

  const toggleSelected = () => {
    const selected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;
    if (!selected || selected.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return;
    }

    void mutateTodos((todoItems, parseErrors) => {
      const nextTodoItems = todoItems.map((todoItem) =>
        todoItem.lineNumber === selected.item.lineNumber ? toggleCompletion(todoItem) : todoItem
      );

      commandBar.setStatusText('Toggled completion');
      return [...nextTodoItems, ...parseErrors].sort(byLineNumber);
    });
  };

  const toggleSelectedDoing = () => {
    const selected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;
    if (!selected || selected.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return;
    }

    if (selected.item.completed) {
      commandBar.setStatusText('Only backlog/doing tasks can be toggled');
      return;
    }

    void mutateTodos((todoItems, parseErrors) => {
      const nextTodoItems = todoItems.map((todoItem) =>
        todoItem.lineNumber === selected.item.lineNumber ? toggleDoing(todoItem) : todoItem
      );

      commandBar.setStatusText('Toggled doing status');
      return [...nextTodoItems, ...parseErrors].sort(byLineNumber);
    });
  };

  const cleanCompleted = () => {
    void mutateTodos(async (todoItems, parseErrors) => {
      const { active, completed } = partitionCompleted(todoItems);
      if (completed.length === 0) {
        commandBar.setStatusText('No completed tasks to clean');
        return [...active, ...parseErrors].sort(byLineNumber);
      }

      await appendLinesToFile(doneFilePath, completed);
      commandBar.setStatusText(`Moved ${completed.length} completed task(s)`);
      return [...active, ...parseErrors].sort(byLineNumber);
    });
  };

  const openDeleteConfirm = () => {
    const selected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;
    if (!selected) {
      commandBar.setStatusText('No selectable task');
      return;
    }

    const description = selected.kind === 'todo' ? selected.item.description : selected.item.raw;
    commandBar.openDeleteConfirm(description);
  };

  const deleteSelected = () => {
    const selected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;
    if (!selected) {
      commandBar.setStatusText('No selectable task');
      return;
    }

    const selectedLineNumber = selected.item.lineNumber;

    void mutateTodos((todoItems, parseErrors) => {
      const nextTodoItems = todoItems.filter((todoItem) => todoItem.lineNumber !== selectedLineNumber);
      const nextParseErrors = parseErrors.filter((parseError) => parseError.lineNumber !== selectedLineNumber);

      const wasRemoved = nextTodoItems.length !== todoItems.length || nextParseErrors.length !== parseErrors.length;
      commandBar.setStatusText(wasRemoved ? 'Task deleted' : 'Task no longer exists');

      return [...nextTodoItems, ...nextParseErrors].sort(byLineNumber);
    });
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
    if (viewMode !== 'table') {
      return;
    }

    if (!tableSort) {
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

  const toggleView = () => {
    if (viewMode === 'cards') {
      const selected = selection.selectedItem;

      if (selected) {
        const nextSelectedIndex = tableRows.findIndex((row) => row.task.item.lineNumber === selected.item.lineNumber);
        if (nextSelectedIndex >= 0) {
          setTableSelectedIndex(nextSelectedIndex);
        }
      }

      setViewMode('table');
      setScrollOffset(0);
      commandBar.setStatusText('Table view');
      return;
    }

    const selected = tableRows[tableSelectedIndex]?.task;
    if (selected) {
      const nextSelection = findCardSelectionByLineNumber(columns, selected.item.lineNumber);
      if (nextSelection) {
        selection.setColumnIndex(nextSelection.column, nextSelection.index);
      }
    }

    setViewMode('cards');
    setScrollOffset(0);
    commandBar.setStatusText('Card view');
  };

  useKeyboardCommands({
    state: commandBar.state,
    onMoveUp: viewMode === 'table' ? moveTableUp : selection.moveUp,
    onMoveDown: viewMode === 'table' ? moveTableDown : selection.moveDown,
    onMoveLeft: viewMode === 'table' ? () => {} : selection.moveLeft,
    onMoveRight: viewMode === 'table' ? () => {} : selection.moveRight,
    onToggleDone: toggleSelected,
    onToggleDoing: toggleSelectedDoing,
    onAdd: commandBar.openAdd,
    onEdit: () => {
      const selected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;
      if (!selected || selected.kind !== 'todo') {
        commandBar.setStatusText('No selectable task');
        return;
      }

      commandBar.openEditDescription(selected.item.description);
    },
    onEditDates: () => {
      const selected = viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selection.selectedItem;
      if (!selected || selected.kind !== 'todo') {
        commandBar.setStatusText('No selectable task');
        return;
      }

      commandBar.openEditDates({
        completed: selected.item.completed,
        ...(selected.item.creationDate ? { creationDate: selected.item.creationDate } : {}),
        ...(selected.item.completionDate ? { completionDate: selected.item.completionDate } : {})
      });
    },
    onPriority: commandBar.openChangePriority,
    onCycleTableSort: cycleTableSortColumn,
    onToggleTableSortDirection: toggleTableSortDirection,
    onFilter: toggleFilter,
    onToggleView: toggleView,
    onCleanDone: cleanCompleted,
    onHelp: commandBar.openHelp,
    onQuitConfirm: commandBar.openQuitConfirm,
    onDelete: openDeleteConfirm,
    onCancel: cancel,
    onSubmit: applySubmit,
    onTab: commandBar.tab,
    onAppendInput: commandBar.appendInput,
    onBackspace: commandBar.backspace,
    onConfirmQuit: exit,
    onConfirmDelete: deleteSelected,
    onDismissHelp: commandBar.dismissHelp,
    onClearFilter: clearFilter
  });

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {viewMode === 'table' ? (
        <TableView
          rows={tableRows}
          selectedIndex={tableSelectedIndex}
          scrollOffset={scrollOffset}
          visibleCount={tableVisibleCount}
          {...(tableSort ? { sort: tableSort } : {})}
        />
      ) : (
        <ColumnLayout
          columns={columns}
          selectedColumn={selection.selectedColumnKey}
          selectedIndex={selection.selectedIndex}
          scrollOffset={scrollOffset}
          visibleCount={cardVisibleCount}
        />
      )}
      {commandBar.state.mode === 'help' ? <HelpOverlay /> : null}
      <CommandBar
        state={commandBar.state}
        status={commandBar.statusText}
        fileStatus={fileStatus}
        {...(cursorStyle ? { cursorStyle } : {})}
        {...(fileError ? { fileError } : {})}
        {...(commandBar.filter ? { filter: commandBar.filter } : {})}
      />
    </Box>
  );
};
