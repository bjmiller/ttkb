import { useState } from 'react';

import { DATE_PATTERN } from '../parser/types';
import {
  applyAppendInputToState,
  applyBackspaceToState,
  applyDeleteCharForwardToState,
  moveCursorLeftByOne,
  moveCursorRightByOne,
  moveCursorToStartOfLine,
  moveCursorToEndOfLine,
  moveCursorWordLeftByOne,
  moveCursorWordRightByOne,
  deleteWordBackwardFromCursor,
  deleteToLineStartFromCursor,
  deleteToLineEndFromCursor,
  isDateInput
} from '../logic/inputEditing';

type IdleMode = { mode: 'idle' };
type HelpMode = { mode: 'help' };
type ConfirmMode = { mode: 'confirm'; prompt: string; kind: 'quit' | 'delete' };
type TextInputMode = {
  mode: 'input';
  kind: 'add-priority' | 'add-description' | 'priority' | 'filter' | 'edit-description';
  prompt: string;
  value: string;
  cursorPosition: number;
  addPriority?: string;
};

type DateField = 'creation' | 'completion';

type DateInputMode = {
  mode: 'input';
  kind: 'edit-date';
  prompt: string;
  value: string;
  cursorPosition: number;
  completed: boolean;
  activeDateField: DateField;
  creationDate?: string;
  completionDate?: string;
};

type InputMode = TextInputMode | DateInputMode;

export type CommandBarState = IdleMode | HelpMode | ConfirmMode | InputMode;

type SubmitAction =
  | { type: 'none' }
  | { type: 'add'; priority?: string; description: string }
  | { type: 'change-priority'; priority?: string }
  | { type: 'change-description'; description: string }
  | { type: 'change-dates'; creationDate: string | undefined; completionDate?: string }
  | { type: 'set-filter'; value: string | undefined }
  | { type: 'quit' };

const datePrompt = (activeDateField: DateField, completed: boolean): string => {
  if (!completed) {
    return 'Edit created date (YYYY-MM-DD, Enter to clear): ';
  }

  if (activeDateField === 'completion') {
    return 'Edit completed date (YYYY-MM-DD, Tab to switch to created): ';
  }

  return 'Edit created date (YYYY-MM-DD, Tab to switch to completed): ';
};

const datePromptWithError = (activeDateField: DateField, completed: boolean, errorMessage: string): string => {
  return `${errorMessage} ${datePrompt(activeDateField, completed)}`;
};

export const useCommandBar = () => {
  const [commandBarState, setCommandBarState] = useState<CommandBarState>({ mode: 'idle' });
  const [statusText, setStatusText] = useState<string>('Ready');
  const [filter, setFilter] = useState<string | undefined>();

  const clearFilter = () => {
    setFilter(undefined);
    setCommandBarState({ mode: 'idle' });
    setStatusText('Filter cleared');
  };

  const openAdd = () => {
    setCommandBarState({
      mode: 'input',
      kind: 'add-priority',
      prompt: 'Add task priority (A-Z, Enter to skip): ',
      value: '',
      cursorPosition: 0
    });
  };

  const openChangePriority = () => {
    setCommandBarState({
      mode: 'input',
      kind: 'priority',
      prompt: 'Set priority (A-Z, Enter to clear): ',
      value: '',
      cursorPosition: 0
    });
  };

  const openFilter = () => {
    setCommandBarState({
      mode: 'input',
      kind: 'filter',
      prompt: 'Filter tasks (Enter to apply, Esc to clear): ',
      value: filter ?? '',
      cursorPosition: (filter ?? '').length
    });
  };

  const openEditDescription = (description: string) => {
    setCommandBarState({
      mode: 'input',
      kind: 'edit-description',
      prompt: 'Edit task description: ',
      value: description,
      cursorPosition: description.length
    });
  };

  const openEditDates = (params: { completed: boolean; creationDate?: string; completionDate?: string }) => {
    const activeDateField: DateField = params.completed ? 'completion' : 'creation';
    const value = activeDateField === 'completion' ? (params.completionDate ?? '') : (params.creationDate ?? '');

    setCommandBarState({
      mode: 'input',
      kind: 'edit-date',
      prompt: datePrompt(activeDateField, params.completed),
      value,
      cursorPosition: value.length,
      completed: params.completed,
      activeDateField,
      ...(params.creationDate != null ? { creationDate: params.creationDate } : {}),
      ...(params.completionDate != null ? { completionDate: params.completionDate } : {})
    });
  };

  const openHelp = () => setCommandBarState({ mode: 'help' });
  const openQuitConfirm = () => {
    setCommandBarState({ mode: 'confirm', prompt: 'Quit? (y/q/Q to quit, n/Esc to cancel)', kind: 'quit' });
  };

  const openDeleteConfirm = (description: string) => {
    setCommandBarState({
      mode: 'confirm',
      prompt: `Are you sure you want to delete task "${description}"? (y/Y to delete, Esc to cancel)`,
      kind: 'delete'
    });
  };

  const cancel = () => {
    if (
      (commandBarState.mode === 'input' && commandBarState.kind === 'filter') ||
      (commandBarState.mode === 'idle' && filter != null)
    ) {
      clearFilter();
      return;
    }

    if (commandBarState.mode === 'idle') {
      return;
    }

    setStatusText('Operation cancelled');
    setCommandBarState({ mode: 'idle' });
  };

  const toggleFilter = () => {
    if (filter != null) {
      clearFilter();
      return;
    }

    openFilter();
  };

  const appendInput = (value: string) => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = applyAppendInputToState(inputState, value);

      return {
        ...current,
        value: nextInputState.value,
        cursorPosition: nextInputState.cursorPosition,
        ...(isDateInput(nextInputState)
          ? { creationDate: nextInputState.creationDate, completionDate: nextInputState.completionDate }
          : {})
      };
    });
  };

  const backspace = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = applyBackspaceToState(inputState);

      return {
        ...current,
        value: nextInputState.value,
        cursorPosition: nextInputState.cursorPosition,
        ...(isDateInput(nextInputState)
          ? { creationDate: nextInputState.creationDate, completionDate: nextInputState.completionDate }
          : {})
      };
    });
  };

  const deleteCharForward = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = applyDeleteCharForwardToState(inputState);

      return {
        ...current,
        value: nextInputState.value,
        ...(isDateInput(nextInputState)
          ? { creationDate: nextInputState.creationDate, completionDate: nextInputState.completionDate }
          : {})
      };
    });
  };

  const moveCursorLeft = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = moveCursorLeftByOne(inputState);

      return {
        ...current,
        cursorPosition: nextInputState.cursorPosition
      };
    });
  };

  const moveCursorRight = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = moveCursorRightByOne(inputState);

      return {
        ...current,
        cursorPosition: nextInputState.cursorPosition
      };
    });
  };

  const moveCursorToStart = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = moveCursorToStartOfLine(inputState);

      return {
        ...current,
        cursorPosition: nextInputState.cursorPosition
      };
    });
  };

  const moveCursorToEnd = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = moveCursorToEndOfLine(inputState);

      return {
        ...current,
        cursorPosition: nextInputState.cursorPosition
      };
    });
  };

  const moveCursorWordLeft = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = moveCursorWordLeftByOne(inputState);

      return {
        ...current,
        cursorPosition: nextInputState.cursorPosition
      };
    });
  };

  const moveCursorWordRight = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = moveCursorWordRightByOne(inputState);

      return {
        ...current,
        cursorPosition: nextInputState.cursorPosition
      };
    });
  };

  const deleteWordBackward = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = deleteWordBackwardFromCursor(inputState);

      return {
        ...current,
        value: nextInputState.value,
        cursorPosition: nextInputState.cursorPosition,
        ...(isDateInput(nextInputState)
          ? { creationDate: nextInputState.creationDate, completionDate: nextInputState.completionDate }
          : {})
      };
    });
  };

  const deleteToLineStart = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = deleteToLineStartFromCursor(inputState);

      return {
        ...current,
        value: nextInputState.value,
        cursorPosition: nextInputState.cursorPosition,
        ...(isDateInput(nextInputState)
          ? { creationDate: nextInputState.creationDate, completionDate: nextInputState.completionDate }
          : {})
      };
    });
  };

  const deleteToLineEnd = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const inputState = isDateInput(current)
        ? current
        : {
            kind: current.kind,
            value: current.value,
            cursorPosition: current.cursorPosition,
            ...(current.addPriority !== undefined ? { addPriority: current.addPriority } : {})
          };

      const nextInputState = deleteToLineEndFromCursor(inputState);

      return {
        ...current,
        value: nextInputState.value,
        cursorPosition: nextInputState.cursorPosition,
        ...(isDateInput(nextInputState)
          ? { creationDate: nextInputState.creationDate, completionDate: nextInputState.completionDate }
          : {})
      };
    });
  };

  const tab = () => {
    setCommandBarState((current) => {
      if (current.mode !== 'input' || current.kind !== 'edit-date' || !current.completed) {
        return current;
      }

      const nextActiveDateField: DateField = current.activeDateField === 'completion' ? 'creation' : 'completion';
      const nextValue =
        nextActiveDateField === 'completion' ? (current.completionDate ?? '') : (current.creationDate ?? '');

      return {
        ...current,
        activeDateField: nextActiveDateField,
        prompt: datePrompt(nextActiveDateField, current.completed),
        value: nextValue
      };
    });
  };

  const submit = (): SubmitAction => {
    if (commandBarState.mode === 'confirm') {
      return { type: 'quit' };
    }

    if (commandBarState.mode !== 'input') {
      return { type: 'none' };
    }

    if (commandBarState.kind === 'filter') {
      const trimmedFilter = commandBarState.value.trim();
      const nextFilter = trimmedFilter.length === 0 ? undefined : trimmedFilter;
      setFilter(nextFilter);
      setStatusText(nextFilter == null ? 'Filter cleared' : `Filter: ${nextFilter}`);
      setCommandBarState({ mode: 'idle' });
      return { type: 'set-filter', value: nextFilter };
    }

    if (commandBarState.kind === 'priority') {
      const letter = commandBarState.value.trim().toUpperCase();
      const priority = letter.length === 1 ? letter : undefined;
      setCommandBarState({ mode: 'idle' });
      return priority == null ? { type: 'change-priority' } : { type: 'change-priority', priority };
    }

    if (commandBarState.kind === 'add-priority') {
      const letter = commandBarState.value.trim().toUpperCase();
      const addPriority = letter.length === 1 ? letter : undefined;

      setCommandBarState({
        mode: 'input',
        kind: 'add-description',
        prompt: 'Task description: ',
        value: '',
        cursorPosition: 0,
        ...(addPriority != null ? { addPriority } : {})
      });
      return { type: 'none' };
    }

    if (commandBarState.kind === 'add-description') {
      const description = commandBarState.value.trim();
      if (description.length === 0) {
        setStatusText('Description is required');
        return { type: 'none' };
      }

      setCommandBarState({ mode: 'idle' });
      return commandBarState.addPriority != null
        ? { type: 'add', priority: commandBarState.addPriority, description }
        : { type: 'add', description };
    }

    if (commandBarState.kind === 'edit-description') {
      const description = commandBarState.value.trim();
      if (description.length === 0) {
        setStatusText('Description is required');
        return { type: 'none' };
      }

      setCommandBarState({ mode: 'idle' });
      return { type: 'change-description', description };
    }

    if (commandBarState.kind === 'edit-date') {
      const value = commandBarState.value.trim();

      const creationDate =
        commandBarState.activeDateField === 'creation'
          ? value.length === 0
            ? undefined
            : value
          : commandBarState.creationDate;
      const completionDate =
        commandBarState.activeDateField === 'completion'
          ? value.length === 0
            ? undefined
            : value
          : commandBarState.completionDate;

      if (creationDate != null && !DATE_PATTERN.test(creationDate)) {
        setCommandBarState({
          ...commandBarState,
          prompt: datePromptWithError(
            commandBarState.activeDateField,
            commandBarState.completed,
            'Invalid created date.'
          )
        });
        setStatusText('Created date must be YYYY-MM-DD');
        return { type: 'none' };
      }

      if (commandBarState.completed) {
        if (completionDate == null) {
          setCommandBarState({
            ...commandBarState,
            prompt: datePromptWithError(
              commandBarState.activeDateField,
              commandBarState.completed,
              'Completed date is required.'
            )
          });
          setStatusText('Completed date is required for done tasks');
          return { type: 'none' };
        }

        if (!DATE_PATTERN.test(completionDate)) {
          setCommandBarState({
            ...commandBarState,
            prompt: datePromptWithError(
              commandBarState.activeDateField,
              commandBarState.completed,
              'Invalid completed date.'
            )
          });
          setStatusText('Completed date must be YYYY-MM-DD');
          return { type: 'none' };
        }

        setCommandBarState({ mode: 'idle' });
        return { type: 'change-dates', creationDate, completionDate };
      }

      setCommandBarState({ mode: 'idle' });
      return { type: 'change-dates', creationDate };
    }

    return { type: 'none' };
  };

  return {
    state: commandBarState,
    statusText,
    setStatusText,
    filter,
    openAdd,
    openChangePriority,
    openEditDescription,
    openEditDates,
    openFilter,
    toggleFilter,
    openHelp,
    openQuitConfirm,
    openDeleteConfirm,
    cancel,
    appendInput,
    backspace,
    deleteCharForward,
    moveCursorLeft,
    moveCursorRight,
    moveCursorToStart,
    moveCursorToEnd,
    moveCursorWordLeft,
    moveCursorWordRight,
    deleteWordBackward,
    deleteToLineStart,
    deleteToLineEnd,
    tab,
    submit,
    clearFilter,
    dismissHelp: () => setCommandBarState({ mode: 'idle' })
  };
};
