import path from 'node:path';

import type { DisplayTask } from '../logic/columns';
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
  DATE_PATTERN,
  DONE_FILE_NAME,
  PRIORITY_TOKEN_PATTERN,
  type TodoItem,
  type UnparseableTodoItem
} from '../parser/types';
import { byLineNumber } from '../logic/ordering';
import { type ViewMode } from '../types';

type MutateTodos = (
  updater: (
    todoItems: TodoItem[],
    parseErrors: UnparseableTodoItem[]
  ) => Promise<(TodoItem | UnparseableTodoItem)[]> | (TodoItem | UnparseableTodoItem)[]
) => Promise<void>;

type CommandBarActions = {
  submit: () =>
    | { type: 'none' }
    | { type: 'add'; priority?: string; description: string }
    | { type: 'change-priority'; priority?: string }
    | { type: 'change-description'; description: string }
    | { type: 'change-dates'; creationDate: string | undefined; completionDate?: string }
    | { type: 'set-filter'; value: string | undefined }
    | { type: 'quit' };
  setStatusText: (value: string) => void;
  openDeleteConfirm: (description: string) => void;
  openEditDescription: (description: string) => void;
  openEditDates: (params: { completed: boolean; creationDate?: string; completionDate?: string }) => void;
};

type UseTaskActionsParams = {
  todoFilePath: string;
  viewMode: ViewMode;
  tableRows: { task: DisplayTask }[];
  tableSelectedIndex: number;
  selectionSelectedItem: DisplayTask | undefined;
  mutateTodos: MutateTodos;
  commandBar: CommandBarActions;
  onFilterApplied: () => void;
  preserveSelection: (lineNumber: number) => void;
  exit: () => void;
};

export const useTaskActions = ({
  todoFilePath,
  viewMode,
  tableRows,
  tableSelectedIndex,
  selectionSelectedItem,
  mutateTodos,
  commandBar,
  onFilterApplied,
  preserveSelection,
  exit
}: UseTaskActionsParams) => {
  const doneFilePath = path.join(path.dirname(todoFilePath), DONE_FILE_NAME);

  const getActiveSelected = (): DisplayTask | undefined => {
    return viewMode === 'table' ? tableRows[tableSelectedIndex]?.task : selectionSelectedItem;
  };

  const withSelected = <T>(callback: (selected: DisplayTask & { kind: 'todo' }) => T): T | undefined => {
    const selected = getActiveSelected();
    if (selected?.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return undefined;
    }

    return callback(selected);
  };

  const mutateSelectedTask = (
    mutate: (item: TodoItem) => TodoItem,
    statusText: string,
    { preserve = false }: { preserve?: boolean } = {}
  ) => {
    withSelected((selected) => {
      if (preserve) {
        preserveSelection(selected.item.lineNumber);
      }

      void mutateTodos((todoItems, parseErrors) => {
        const nextTodoItems = todoItems.map((todoItem) =>
          todoItem.lineNumber === selected.item.lineNumber ? mutate(todoItem) : todoItem
        );

        commandBar.setStatusText(statusText);
        return [...nextTodoItems, ...parseErrors].toSorted(byLineNumber);
      });
    });
  };

  const applySubmit = () => {
    const action = commandBar.submit();
    if (action.type === 'quit') {
      exit();
      return;
    }

    if (action.type === 'change-priority') {
      mutateSelectedTask((item) => changePriority(item, action.priority), 'Priority updated');
      return;
    }

    if (action.type === 'change-description') {
      mutateSelectedTask((item) => changeDescription(item, action.description), 'Description updated');
      return;
    }

    if (action.type === 'change-dates') {
      mutateSelectedTask((item) => changeDates(item, action), 'Date updated');
      return;
    }

    if (action.type === 'add') {
      void mutateTodos((todoItems, parseErrors) => {
        const maxLine = [...todoItems, ...parseErrors].reduce((max, line) => Math.max(max, line.lineNumber), 0);
        const created = addTask({
          lineNumber: maxLine + 1,
          description: action.description,
          ...(action.priority != null ? { priority: action.priority } : {})
        });

        commandBar.setStatusText('Task added');
        return [...todoItems, ...parseErrors, created].toSorted(byLineNumber);
      });
      return;
    }

    if (action.type === 'set-filter') {
      onFilterApplied();
    }
  };

  const toggleSelected = () => {
    mutateSelectedTask(toggleCompletion, 'Toggled completion', { preserve: true });
  };

  const toggleSelectedDoing = () => {
    withSelected((selected) => {
      if (selected.item.completed) {
        commandBar.setStatusText('Only backlog/doing tasks can be toggled');
        return;
      }

      mutateSelectedTask(toggleDoing, 'Toggled doing status', { preserve: true });
    });
  };

  const cleanCompleted = () => {
    void mutateTodos(async (todoItems, parseErrors) => {
      const { active, completed } = partitionCompleted(todoItems);
      if (completed.length === 0) {
        commandBar.setStatusText('No completed tasks to clean');
        return [...active, ...parseErrors].toSorted(byLineNumber);
      }

      await appendLinesToFile(doneFilePath, completed);
      commandBar.setStatusText(`Moved ${completed.length} completed task(s)`);
      return [...active, ...parseErrors].toSorted(byLineNumber);
    });
  };

  const openDeleteConfirm = () => {
    const selected = getActiveSelected();
    if (selected == null) {
      commandBar.setStatusText('No selectable task');
      return;
    }

    const description = selected.kind === 'todo' ? selected.item.description : selected.item.raw;
    commandBar.openDeleteConfirm(description);
  };

  const deleteSelected = () => {
    const selected = getActiveSelected();
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

      return [...nextTodoItems, ...nextParseErrors].toSorted(byLineNumber);
    });
  };

  const extractBodyFromRaw = (item: TodoItem): string => {
    if (item.raw.length === 0) {
      const parts: string[] = [item.description];

      for (const project of item.projects) {
        parts.push(`+${project}`);
      }

      for (const context of item.contexts) {
        parts.push(`@${context}`);
      }

      for (const tag of item.metadata) {
        parts.push(`${tag.key}:${tag.value}`);
      }

      return parts.join(' ');
    }

    const tokens = item.raw.trim().split(/\s+/);
    const maybeDate = (index: number): string | undefined => {
      const token = tokens[index];
      if (token != null && DATE_PATTERN.test(token)) {
        return token;
      }

      return undefined;
    };

    let skip = 0;

    if (tokens[skip] === 'x') {
      skip += 1;
    }

    if (!item.completed) {
      const token = tokens[skip];
      if (token != null && PRIORITY_TOKEN_PATTERN.test(token)) {
        skip += 1;
      }
    }

    if (item.completed && maybeDate(skip) != null) {
      skip += 1;
    }

    if (maybeDate(skip) != null) {
      skip += 1;
    }

    return tokens.slice(skip).join(' ');
  };

  const beginEditSelectedDescription = () => {
    withSelected((selected) => {
      commandBar.openEditDescription(extractBodyFromRaw(selected.item));
    });
  };

  const beginEditSelectedDates = () => {
    withSelected((selected) => {
      commandBar.openEditDates({
        completed: selected.item.completed,
        ...(selected.item.creationDate != null ? { creationDate: selected.item.creationDate } : {}),
        ...(selected.item.completionDate != null ? { completionDate: selected.item.completionDate } : {})
      });
    });
  };

  return {
    applySubmit,
    toggleSelected,
    toggleSelectedDoing,
    cleanCompleted,
    openDeleteConfirm,
    deleteSelected,
    beginEditSelectedDescription,
    beginEditSelectedDates
  };
};
