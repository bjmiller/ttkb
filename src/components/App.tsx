import React, { useEffect, useMemo, useState } from 'react';
import path from 'node:path';
import { Box, useApp } from 'ink';

import type { CursorStyle } from '../config/types';

import { useCommandBar } from '../hooks/useCommandBar';
import { useKeyboardCommands } from '../hooks/useKeyboardCommands';
import { useSelection } from '../hooks/useSelection';
import { useTodoFile } from '../hooks/useTodoFile';
import { buildColumns } from '../logic/columns';
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
import { CommandBar } from './CommandBar';
import { ColumnLayout } from './ColumnLayout';
import { HelpOverlay } from './HelpOverlay';

type Props = {
  todoFilePath: string;
  cursorStyle?: CursorStyle;
};

const ESTIMATED_CARD_HEIGHT = 6;
const RESERVED_BOTTOM_ROWS = 4;
const DEFAULT_TERMINAL_HEIGHT = 24;
const DONE_FILE_NAME = 'done.txt';
const HIDE_CURSOR = '\u001b[?25l';
const SHOW_CURSOR = '\u001b[?25h';

const byLineNumber = <T extends { lineNumber: number }>(left: T, right: T) => left.lineNumber - right.lineNumber;

export const App = ({ todoFilePath, cursorStyle }: Props) => {
  const { exit } = useApp();
  const terminalHeight = process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT;
  const [scrollOffset, setScrollOffset] = useState(0);

  const { items, errors, status: fileStatus, error: fileError, mutateTodos } = useTodoFile(todoFilePath);
  const commandBar = useCommandBar();

  const columns = useMemo(() => buildColumns(items, errors, commandBar.filter), [items, errors, commandBar.filter]);

  const selection = useSelection(columns);
  const doneFilePath = useMemo(() => path.join(path.dirname(todoFilePath), DONE_FILE_NAME), [todoFilePath]);
  const viewportRows = Math.max(1, terminalHeight - RESERVED_BOTTOM_ROWS);
  const visibleCount = Math.max(1, Math.floor(viewportRows / ESTIMATED_CARD_HEIGHT));

  useEffect(() => {
    const selectedIndex = selection.selectedIndex;
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + visibleCount) {
      setScrollOffset(Math.max(selectedIndex - visibleCount + 1, 0));
    }
  }, [selection.selectedIndex, scrollOffset, visibleCount]);

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

    if (action.type === 'change-priority') {
      const selected = selection.selectedItem;
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
      const selected = selection.selectedItem;
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
      const selected = selection.selectedItem;
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
    const selected = selection.selectedItem;
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
    const selected = selection.selectedItem;
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
    const selected = selection.selectedItem;
    if (!selected) {
      commandBar.setStatusText('No selectable task');
      return;
    }

    const description = selected.kind === 'todo' ? selected.item.description : selected.item.raw;
    commandBar.openDeleteConfirm(description);
  };

  const deleteSelected = () => {
    const selected = selection.selectedItem;
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

  useKeyboardCommands({
    state: commandBar.state,
    onMoveUp: selection.moveUp,
    onMoveDown: selection.moveDown,
    onMoveLeft: selection.moveLeft,
    onMoveRight: selection.moveRight,
    onToggleDone: toggleSelected,
    onToggleDoing: toggleSelectedDoing,
    onAdd: commandBar.openAdd,
    onEdit: () => {
      const selected = selection.selectedItem;
      if (!selected || selected.kind !== 'todo') {
        commandBar.setStatusText('No selectable task');
        return;
      }

      commandBar.openEditDescription(selected.item.description);
    },
    onEditDates: () => {
      const selected = selection.selectedItem;
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
    onFilter: commandBar.toggleFilter,
    onCleanDone: cleanCompleted,
    onHelp: commandBar.openHelp,
    onQuitConfirm: commandBar.openQuitConfirm,
    onDelete: openDeleteConfirm,
    onCancel: commandBar.cancel,
    onSubmit: applySubmit,
    onTab: commandBar.tab,
    onAppendInput: commandBar.appendInput,
    onBackspace: commandBar.backspace,
    onConfirmQuit: exit,
    onConfirmDelete: deleteSelected,
    onDismissHelp: commandBar.dismissHelp,
    onClearFilter: commandBar.clearFilter
  });

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <ColumnLayout
        columns={columns}
        selectedColumn={selection.selectedColumnKey}
        selectedIndex={selection.selectedIndex}
        scrollOffset={scrollOffset}
        visibleCount={visibleCount}
      />
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
