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
  onCancel: () => void;
  onSubmit: () => void;
  onTab: () => void;
  onAppendInput: (text: string) => void;
  onBackspace: () => void;
  onConfirmQuit: () => void;
  onConfirmDelete: () => void;
  onDismissHelp: () => void;
  onClearFilter: () => void;
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

      if (!key.ctrl && !key.meta && input.length > 0) {
        actions.onAppendInput(input);
      }

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

    if (key.delete || (key.ctrl && input === 'd')) {
      actions.onDelete();
      return;
    }

    if (input === 'x') {
      actions.onToggleDone();
      return;
    }

    if (input === 'd' && !key.ctrl && !key.meta) {
      actions.onToggleDoing();
      return;
    }

    if (input === 'a') {
      actions.onAdd();
      return;
    }

    if (input === 'e') {
      actions.onEdit();
      return;
    }

    if (input === ';') {
      actions.onEditDates();
      return;
    }

    if (input === 'p') {
      actions.onPriority();
      return;
    }

    if (input === 's') {
      actions.onCycleTableSort();
      return;
    }

    if (input === '.') {
      actions.onToggleTableSortDirection();
      return;
    }

    if (input === 'f') {
      actions.onFilter();
      return;
    }

    if (input === 'v') {
      actions.onToggleView();
      return;
    }

    if (input === 'c') {
      actions.onCleanDone();
      return;
    }

    if (input === '?') {
      actions.onHelp();
      return;
    }

    if (input === 'Q') {
      actions.onQuitConfirm();
    }
  });
};
