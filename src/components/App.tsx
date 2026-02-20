import React, { useMemo, useState } from 'react';
import { Box, useApp } from 'ink';

import type { CursorStyle } from '../config/types';

import { useCommandBar } from '../hooks/useCommandBar';
import { useKeyboardCommands } from '../hooks/useKeyboardCommands';
import { useEffectiveSelection, usePreserveSelection } from '../hooks/usePreserveSelection';
import { useSelection } from '../hooks/useSelection';
import { useTableCommands } from '../hooks/useTableCommands';
import { useTaskActions } from '../hooks/useTaskActions';
import { useTerminalCursorVisibility } from '../hooks/useTerminalCursorVisibility';
import { useTableViewState } from '../hooks/useTableViewState';
import { useTodoFile } from '../hooks/useTodoFile';
import { useViewportSelectionSync } from '../hooks/useViewportSelectionSync';
import { buildColumns } from '../logic/columns';
import { CommandBar } from './CommandBar';
import { ColumnLayout } from './ColumnLayout';
import { HelpOverlay } from './HelpOverlay';
import { TableView } from './TableView';

export { shouldClearFilterOnCancel } from '../hooks/useTableCommands';

type AppProps = {
  todoFilePath: string;
  cursorStyle?: CursorStyle;
};

const ESTIMATED_CARD_HEIGHT = 6;
const RESERVED_BOTTOM_ROWS = 4;
const DEFAULT_TERMINAL_HEIGHT = 24;
const TABLE_ROW_HEIGHT = 1;

export const App = ({ todoFilePath, cursorStyle }: AppProps) => {
  const { exit } = useApp();
  const terminalHeight = process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT;
  const [scrollOffset, setScrollOffset] = useState(0);

  const { items, errors, status: fileStatus, error: fileError, mutateTodos } = useTodoFile(todoFilePath);
  const commandBar = useCommandBar();

  const columns = useMemo(() => buildColumns(items, errors, commandBar.filter), [items, errors, commandBar.filter]);

  const selection = useSelection(columns);
  const {
    viewMode,
    tableSelectedIndex,
    tableSort,
    tableRows,
    setTableSelectedIndex,
    setTableSort,
    moveTableUp,
    moveTableDown,
    toggleView,
    buildTableRows
  } = useTableViewState({ columns, selection });

  const viewportRows = Math.max(1, terminalHeight - RESERVED_BOTTOM_ROWS);
  const cardVisibleCount = Math.max(1, Math.floor(viewportRows / ESTIMATED_CARD_HEIGHT));
  const tableVisibleCount = Math.max(1, Math.floor(viewportRows / TABLE_ROW_HEIGHT));

  useTerminalCursorVisibility();

  const { preserveSelection, pendingLineNumber } = usePreserveSelection({
    viewMode,
    tableRows,
    setTableSelectedIndex,
    columns,
    setCardSelection: selection.setColumnIndex
  });

  const effectiveSelection = useEffectiveSelection({
    viewMode,
    pendingLineNumber,
    columns,
    selection: {
      selectedColumnKey: selection.selectedColumnKey,
      selectedIndex: selection.selectedIndex
    },
    tableRows,
    tableSelectedIndex
  });

  const {
    applySubmit,
    toggleSelected,
    toggleSelectedDoing,
    cleanCompleted,
    openDeleteConfirm,
    deleteSelected,
    beginEditSelectedDescription,
    beginEditSelectedDates
  } = useTaskActions({
    todoFilePath,
    viewMode,
    tableRows,
    tableSelectedIndex: effectiveSelection.tableSelectedIndex,
    selectionSelectedItem: effectiveSelection.cardSelectedItem,
    mutateTodos,
    commandBar,
    onFilterApplied: () => setScrollOffset(0),
    preserveSelection,
    exit
  });

  const { clearFilter, toggleFilter, cancel, cycleTableSortColumn, toggleTableSortDirection, onToggleView } =
    useTableCommands({
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
      onViewModeChanged: (nextMode) => {
        setScrollOffset(0);
        commandBar.setStatusText(nextMode === 'table' ? 'Table view' : 'Card view');
      }
    });

  useViewportSelectionSync({
    viewMode,
    tableRowsLength: tableRows.length,
    tableSelectedIndex: effectiveSelection.tableSelectedIndex,
    setTableSelectedIndex,
    cardSelectedIndex: effectiveSelection.cardSelectedIndex,
    cardVisibleCount,
    tableVisibleCount,
    scrollOffset,
    setScrollOffset
  });

  useKeyboardCommands({
    state: commandBar.state,
    onMoveUp: viewMode === 'table' ? moveTableUp : selection.moveUp,
    onMoveDown: viewMode === 'table' ? moveTableDown : selection.moveDown,
    onMoveLeft: viewMode === 'table' ? () => {} : selection.moveLeft,
    onMoveRight: viewMode === 'table' ? () => {} : selection.moveRight,
    onToggleDone: toggleSelected,
    onToggleDoing: toggleSelectedDoing,
    onAdd: commandBar.openAdd,
    onEdit: beginEditSelectedDescription,
    onEditDates: beginEditSelectedDates,
    onPriority: commandBar.openChangePriority,
    onCycleTableSort: cycleTableSortColumn,
    onToggleTableSortDirection: toggleTableSortDirection,
    onFilter: toggleFilter,
    onToggleView: onToggleView,
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
          selectedIndex={effectiveSelection.tableSelectedIndex}
          scrollOffset={scrollOffset}
          visibleCount={tableVisibleCount}
          {...(tableSort ? { sort: tableSort } : {})}
        />
      ) : (
        <ColumnLayout
          columns={columns}
          selectedColumn={effectiveSelection.cardSelectedColumn}
          selectedIndex={effectiveSelection.cardSelectedIndex}
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
