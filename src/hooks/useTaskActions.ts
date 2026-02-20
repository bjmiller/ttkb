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
import type { TodoItem, UnparseableTodoItem } from '../parser/types';

type ViewMode = 'cards' | 'table';

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

const DONE_FILE_NAME = 'done.txt';

const byLineNumber = <T extends { lineNumber: number }>(left: T, right: T) => left.lineNumber - right.lineNumber;

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

  const applySubmit = () => {
    const action = commandBar.submit();
    if (action.type === 'quit') {
      exit();
      return;
    }

    const activeSelected = getActiveSelected();

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
      onFilterApplied();
    }
  };

  const toggleSelected = () => {
    const selected = getActiveSelected();
    if (!selected || selected.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return;
    }

    preserveSelection(selected.item.lineNumber);

    void mutateTodos((todoItems, parseErrors) => {
      const nextTodoItems = todoItems.map((todoItem) =>
        todoItem.lineNumber === selected.item.lineNumber ? toggleCompletion(todoItem) : todoItem
      );

      commandBar.setStatusText('Toggled completion');
      return [...nextTodoItems, ...parseErrors].sort(byLineNumber);
    });
  };

  const toggleSelectedDoing = () => {
    const selected = getActiveSelected();
    if (!selected || selected.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return;
    }

    if (selected.item.completed) {
      commandBar.setStatusText('Only backlog/doing tasks can be toggled');
      return;
    }

    preserveSelection(selected.item.lineNumber);

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
    const selected = getActiveSelected();
    if (!selected) {
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

      return [...nextTodoItems, ...nextParseErrors].sort(byLineNumber);
    });
  };

  const beginEditSelectedDescription = () => {
    const selected = getActiveSelected();
    if (!selected || selected.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return;
    }

    commandBar.openEditDescription(selected.item.description);
  };

  const beginEditSelectedDates = () => {
    const selected = getActiveSelected();
    if (!selected || selected.kind !== 'todo') {
      commandBar.setStatusText('No selectable task');
      return;
    }

    commandBar.openEditDates({
      completed: selected.item.completed,
      ...(selected.item.creationDate ? { creationDate: selected.item.creationDate } : {}),
      ...(selected.item.completionDate ? { completionDate: selected.item.completionDate } : {})
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
