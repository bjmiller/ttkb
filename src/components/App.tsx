import React, { useMemo, useState } from 'react';
import { Box, useApp } from 'ink';

import { HELP_BUILD_INFO } from '../buildInfo';
import type { CursorStyle } from '../config/types';

import { useCommandBar } from '../hooks/useCommandBar';
import { useKeyboardCommands } from '../hooks/useKeyboardCommands';
import { useLayoutMetrics } from '../hooks/useLayoutMetrics';
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

type AppProps = {
  todoFilePath: string;
  cursorStyle?: CursorStyle;
};

const COMMAND_BAR_ROWS = 3;

export const App = ({ todoFilePath, cursorStyle }: AppProps) => {
  const app = useApp();
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

  const { terminalHeight, tableVisibleCount, cardVisibleRows, cardContentWidth, cardVisibleCount, columnWidths } =
    useLayoutMetrics({
      columns,
      selectedColumn: effectiveSelection.cardSelectedColumn,
      scrollOffset
    });

  const helpRows = Math.max(1, terminalHeight - COMMAND_BAR_ROWS);

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
    exit: () => app.exit()
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
    onMoveToTop:
      viewMode === 'table'
        ? () => setTableSelectedIndex(0)
        : () => selection.setColumnIndex(selection.selectedColumnKey, 0),
    onMoveToBottom:
      viewMode === 'table'
        ? () => setTableSelectedIndex(Math.max(0, tableRows.length - 1))
        : () => {
            const tasks = columns[selection.selectedColumnKey];
            if (tasks.length > 0) {
              selection.setColumnIndex(selection.selectedColumnKey, tasks.length - 1);
            }
          },
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
    onDeleteCharForward: commandBar.deleteCharForward,
    onMoveCursorLeft: commandBar.moveCursorLeft,
    onMoveCursorRight: commandBar.moveCursorRight,
    onMoveCursorToStart: commandBar.moveCursorToStart,
    onMoveCursorToEnd: commandBar.moveCursorToEnd,
    onMoveCursorWordLeft: commandBar.moveCursorWordLeft,
    onMoveCursorWordRight: commandBar.moveCursorWordRight,
    onDeleteWordBackward: commandBar.deleteWordBackward,
    onDeleteToLineStart: commandBar.deleteToLineStart,
    onDeleteToLineEnd: commandBar.deleteToLineEnd,
    onConfirmQuit: () => app.exit(),
    onConfirmDelete: () => {
      deleteSelected();
      commandBar.cancel();
    },
    onDismissHelp: commandBar.dismissHelp,
    onClearFilter: clearFilter
  });

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {commandBar.state.mode === 'help' ? (
        <HelpOverlay maxRows={helpRows} />
      ) : viewMode === 'table' ? (
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
          visibleRows={cardVisibleRows}
          cardContentWidth={cardContentWidth}
          columnWidths={columnWidths}
        />
      )}
      <CommandBar
        state={commandBar.state}
        status={commandBar.statusText}
        fileStatus={fileStatus}
        helpBuildInfo={HELP_BUILD_INFO}
        {...(cursorStyle ? { cursorStyle } : {})}
        {...(fileError != null ? { fileError } : {})}
        {...(commandBar.filter != null ? { filter: commandBar.filter } : {})}
      />
    </Box>
  );
};
