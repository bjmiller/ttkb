import { useInput } from 'ink';

import type { CommandBarState } from './useCommandBar';

type KeyActions = {
  state: CommandBarState;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onToggleDone: () => void;
  onToggleDoing: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onEditDates: () => void;
  onPriority: () => void;
  onCycleTableSort: () => void;
  onToggleTableSortDirection: () => void;
  onFilter: () => void;
  onToggleView: () => void;
  onCleanDone: () => void;
  onHelp: () => void;
  onQuitConfirm: () => void;
  onDelete: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onCancel: () => void;
  onExit: () => void;
  onSubmit: () => void;
  onTab: () => void;
  onAppendInput: (text: string) => void;
  onBackspace: () => void;
  onDeleteCharForward: () => void;
  onMoveCursorLeft: () => void;
  onMoveCursorRight: () => void;
  onMoveCursorToStart: () => void;
  onMoveCursorToEnd: () => void;
  onMoveCursorWordLeft: () => void;
  onMoveCursorWordRight: () => void;
  onDeleteWordBackward: () => void;
  onDeleteToLineStart: () => void;
  onDeleteToLineEnd: () => void;
  onConfirmQuit: () => void;
  onConfirmDelete: () => void;
  onDismissHelp: () => void;
  onClearFilter: () => void;
  onUndo: () => void;
};

export const useKeyboardCommands = (actions: KeyActions) => {
  useInput((input, key) => {
    if (actions.state.mode === 'help') {
      actions.onDismissHelp();
      return;
    }

    if (actions.state.mode === 'confirm') {
      if (actions.state.kind === 'quit' && (input === 'y' || input === 'q' || input === 'Q')) {
        actions.onConfirmQuit();
        return;
      }

      if (actions.state.kind === 'delete' && (input === 'y' || input === 'Y')) {
        actions.onConfirmDelete();
        return;
      }

      if (input === 'n' || key.escape) {
        actions.onCancel();
      }
      return;
    }

    if (actions.state.mode === 'input') {
      if (key.return) {
        actions.onSubmit();
        return;
      }

      if (key.tab) {
        actions.onTab();
        return;
      }

      if (key.escape) {
        if (actions.state.kind === 'filter') {
          actions.onClearFilter();
        } else {
          actions.onCancel();
        }
        return;
      }

      if (key.backspace || key.delete) {
        actions.onBackspace();
        return;
      }

      if (key.leftArrow) {
        actions.onMoveCursorLeft();
        return;
      }

      if (key.rightArrow) {
        actions.onMoveCursorRight();
        return;
      }

      if (key.home) {
        actions.onMoveCursorToStart();
        return;
      }

      if (key.end) {
        actions.onMoveCursorToEnd();
        return;
      }

      if (key.ctrl && input === 'a') {
        actions.onMoveCursorToStart();
        return;
      }

      if (key.ctrl && input === 'e') {
        actions.onMoveCursorToEnd();
        return;
      }

      if (key.ctrl && input === 'b') {
        actions.onMoveCursorLeft();
        return;
      }

      if (key.ctrl && input === 'f') {
        actions.onMoveCursorRight();
        return;
      }

      if (key.meta && input === 'b') {
        actions.onMoveCursorWordLeft();
        return;
      }

      if (key.meta && input === 'f') {
        actions.onMoveCursorWordRight();
        return;
      }

      if (key.ctrl && input === 'w') {
        actions.onDeleteWordBackward();
        return;
      }

      if (key.ctrl && input === 'u') {
        actions.onDeleteToLineStart();
        return;
      }

      if (key.ctrl && input === 'k') {
        actions.onDeleteToLineEnd();
        return;
      }

      if (key.ctrl && input === 'd') {
        actions.onDeleteCharForward();
        return;
      }

      if (!key.ctrl && !key.meta && input.length > 0) {
        actions.onAppendInput(input);
      }

      return;
    }

    if (key.meta && key.upArrow) {
      actions.onMoveToTop();
      return;
    }

    if (key.meta && key.downArrow) {
      actions.onMoveToBottom();
      return;
    }

    if (key.upArrow) {
      actions.onMoveUp();
      return;
    }

    if (key.downArrow) {
      actions.onMoveDown();
      return;
    }

    if (key.leftArrow) {
      actions.onMoveLeft();
      return;
    }

    if (key.rightArrow) {
      actions.onMoveRight();
      return;
    }

    if (key.escape) {
      actions.onCancel();
      return;
    }

    if (process.platform === 'darwin' ? key.super && input === 'z' : key.ctrl && input === 'z') {
      actions.onUndo();
      return;
    }

    if (key.ctrl && input === 'c') {
      actions.onExit();
      return;
    }

    if (key.delete || (key.ctrl && input === 'd')) {
      actions.onDelete();
      return;
    }

    if (input === 'd' && !key.ctrl && !key.meta) {
      actions.onToggleDoing();
      return;
    }

    if (input === 'x' && !key.ctrl && !key.meta) {
      actions.onToggleDone();
      return;
    }

    if (input === 'a' && !key.ctrl && !key.meta) {
      actions.onAdd();
      return;
    }

    if (input === 'e' && !key.ctrl && !key.meta) {
      actions.onEdit();
      return;
    }

    if (input === ';' && !key.meta) {
      actions.onEditDates();
      return;
    }

    if (input === 'p' && !key.ctrl && !key.meta) {
      actions.onPriority();
      return;
    }

    if (input === 's' && !key.ctrl && !key.meta) {
      actions.onCycleTableSort();
      return;
    }

    if (input === '.' && !key.meta) {
      actions.onToggleTableSortDirection();
      return;
    }

    if (input === 'f' && !key.ctrl && !key.meta) {
      actions.onFilter();
      return;
    }

    if (input === 'v' && !key.ctrl && !key.meta) {
      actions.onToggleView();
      return;
    }

    if (input === 'c' && !key.ctrl && !key.meta) {
      actions.onCleanDone();
      return;
    }

    if (input === '?' && !key.meta) {
      actions.onHelp();
      return;
    }

    if (input === 'Q' && !key.ctrl && !key.meta) {
      actions.onQuitConfirm();
    }
  });
};
