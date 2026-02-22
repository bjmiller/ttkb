import { useState } from 'react';

import { DATE_PATTERN } from '../parser/types';

type IdleMode = { mode: 'idle' };
type HelpMode = { mode: 'help' };
type ConfirmMode = { mode: 'confirm'; prompt: string; kind: 'quit' | 'delete' };
type TextInputMode = {
  mode: 'input';
  kind: 'add-priority' | 'add-description' | 'priority' | 'filter' | 'edit-description';
  prompt: string;
  value: string;
  addPriority?: string;
};

type DateField = 'creation' | 'completion';

type DateInputMode = {
  mode: 'input';
  kind: 'edit-date';
  prompt: string;
  value: string;
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
  const [state, setState] = useState<CommandBarState>({ mode: 'idle' });
  const [statusText, setStatusText] = useState<string>('Ready');
  const [filter, setFilter] = useState<string | undefined>();

  const clearFilter = () => {
    setFilter(undefined);
    setState({ mode: 'idle' });
    setStatusText('Filter cleared');
  };

  const openAdd = () => {
    setState({
      mode: 'input',
      kind: 'add-priority',
      prompt: 'Add task priority (A-Z, Enter to skip): ',
      value: ''
    });
  };

  const openChangePriority = () => {
    setState({
      mode: 'input',
      kind: 'priority',
      prompt: 'Set priority (A-Z, Enter to clear): ',
      value: ''
    });
  };

  const openFilter = () => {
    setState({
      mode: 'input',
      kind: 'filter',
      prompt: 'Filter tasks (Enter to apply, Esc to clear): ',
      value: filter ?? ''
    });
  };

  const openEditDescription = (description: string) => {
    setState({
      mode: 'input',
      kind: 'edit-description',
      prompt: 'Edit task description: ',
      value: description
    });
  };

  const openEditDates = (params: { completed: boolean; creationDate?: string; completionDate?: string }) => {
    const activeDateField: DateField = params.completed ? 'completion' : 'creation';
    const value = activeDateField === 'completion' ? (params.completionDate ?? '') : (params.creationDate ?? '');

    setState({
      mode: 'input',
      kind: 'edit-date',
      prompt: datePrompt(activeDateField, params.completed),
      value,
      completed: params.completed,
      activeDateField,
      ...(params.creationDate ? { creationDate: params.creationDate } : {}),
      ...(params.completionDate ? { completionDate: params.completionDate } : {})
    });
  };

  const openHelp = () => setState({ mode: 'help' });
  const openQuitConfirm = () => {
    setState({ mode: 'confirm', prompt: 'Quit? (y/q/Q to quit, n/Esc to cancel)', kind: 'quit' });
  };

  const openDeleteConfirm = (description: string) => {
    setState({
      mode: 'confirm',
      prompt: `Are you sure you want to delete task "${description}"? (y/Y to delete, Esc to cancel)`,
      kind: 'delete'
    });
  };

  const cancel = () => {
    if ((state.mode === 'input' && state.kind === 'filter') || (state.mode === 'idle' && filter)) {
      clearFilter();
      return;
    }

    setState({ mode: 'idle' });
  };

  const toggleFilter = () => {
    if (filter) {
      clearFilter();
      return;
    }

    openFilter();
  };

  const appendInput = (value: string) => {
    setState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const nextValue = `${current.value}${value}`;

      if (current.kind === 'edit-date') {
        if (current.activeDateField === 'completion') {
          if (!nextValue) {
            const { completionDate: _completionDate, ...withoutCompletionDate } = current;
            return {
              ...withoutCompletionDate,
              value: nextValue
            };
          }

          return {
            ...current,
            value: nextValue,
            completionDate: nextValue
          };
        }

        if (!nextValue) {
          const { creationDate: _creationDate, ...withoutCreationDate } = current;
          return {
            ...withoutCreationDate,
            value: nextValue
          };
        }

        return {
          ...current,
          value: nextValue,
          creationDate: nextValue
        };
      }

      return {
        ...current,
        value: nextValue
      };
    });
  };

  const backspace = () => {
    setState((current) => {
      if (current.mode !== 'input') {
        return current;
      }

      const nextValue = current.value.slice(0, Math.max(current.value.length - 1, 0));

      if (current.kind === 'edit-date') {
        if (current.activeDateField === 'completion') {
          if (!nextValue) {
            const { completionDate: _completionDate, ...withoutCompletionDate } = current;
            return {
              ...withoutCompletionDate,
              value: nextValue
            };
          }

          return {
            ...current,
            value: nextValue,
            completionDate: nextValue
          };
        }

        if (!nextValue) {
          const { creationDate: _creationDate, ...withoutCreationDate } = current;
          return {
            ...withoutCreationDate,
            value: nextValue
          };
        }

        return {
          ...current,
          value: nextValue,
          creationDate: nextValue
        };
      }

      return {
        ...current,
        value: nextValue
      };
    });
  };

  const tab = () => {
    setState((current) => {
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
    if (state.mode === 'confirm') {
      return { type: 'quit' };
    }

    if (state.mode !== 'input') {
      return { type: 'none' };
    }

    if (state.kind === 'filter') {
      const nextFilter = state.value.trim() || undefined;
      setFilter(nextFilter);
      setStatusText(nextFilter ? `Filter: ${nextFilter}` : 'Filter cleared');
      setState({ mode: 'idle' });
      return { type: 'set-filter', value: nextFilter };
    }

    if (state.kind === 'priority') {
      const letter = state.value.trim().toUpperCase();
      const priority = letter.length === 1 ? letter : undefined;
      setState({ mode: 'idle' });
      return priority ? { type: 'change-priority', priority } : { type: 'change-priority' };
    }

    if (state.kind === 'add-priority') {
      const letter = state.value.trim().toUpperCase();
      const addPriority = letter.length === 1 ? letter : undefined;

      setState({
        mode: 'input',
        kind: 'add-description',
        prompt: 'Task description: ',
        value: '',
        ...(addPriority ? { addPriority } : {})
      });
      return { type: 'none' };
    }

    if (state.kind === 'add-description') {
      const description = state.value.trim();
      if (!description) {
        setStatusText('Description is required');
        return { type: 'none' };
      }

      setState({ mode: 'idle' });
      return state.addPriority
        ? { type: 'add', priority: state.addPriority, description }
        : { type: 'add', description };
    }

    if (state.kind === 'edit-description') {
      const description = state.value.trim();
      if (!description) {
        setStatusText('Description is required');
        return { type: 'none' };
      }

      setState({ mode: 'idle' });
      return { type: 'change-description', description };
    }

    if (state.kind === 'edit-date') {
      const value = state.value.trim();

      const creationDate = state.activeDateField === 'creation' ? value || undefined : state.creationDate;
      const completionDate = state.activeDateField === 'completion' ? value || undefined : state.completionDate;

      if (creationDate && !DATE_PATTERN.test(creationDate)) {
        setState({
          ...state,
          prompt: datePromptWithError(state.activeDateField, state.completed, 'Invalid created date.')
        });
        setStatusText('Created date must be YYYY-MM-DD');
        return { type: 'none' };
      }

      if (state.completed) {
        if (!completionDate) {
          setState({
            ...state,
            prompt: datePromptWithError(state.activeDateField, state.completed, 'Completed date is required.')
          });
          setStatusText('Completed date is required for done tasks');
          return { type: 'none' };
        }

        if (!DATE_PATTERN.test(completionDate)) {
          setState({
            ...state,
            prompt: datePromptWithError(state.activeDateField, state.completed, 'Invalid completed date.')
          });
          setStatusText('Completed date must be YYYY-MM-DD');
          return { type: 'none' };
        }

        setState({ mode: 'idle' });
        return { type: 'change-dates', creationDate, completionDate };
      }

      setState({ mode: 'idle' });
      return { type: 'change-dates', creationDate };
    }

    return { type: 'none' };
  };

  return {
    state,
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
    tab,
    submit,
    clearFilter,
    dismissHelp: () => setState({ mode: 'idle' })
  };
};
