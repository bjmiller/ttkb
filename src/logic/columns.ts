import type { TodoItem, UnparseableTodoItem } from '../parser/types';

export type ColumnKey = 'backlog' | 'doing' | 'done';

export type DisplayTask = { kind: 'todo'; item: TodoItem } | { kind: 'unparseable'; item: UnparseableTodoItem };

export type Columns = Record<ColumnKey, DisplayTask[]>;

const PRIORITY_BASE_CHAR_CODE = 64;
const NO_PRIORITY_RANK = 27;

const getStatusTag = (item: TodoItem): string | undefined => {
  return item.metadata.find((tag) => tag.key === 'status')?.value;
};

const compareTodoItems = (left: TodoItem, right: TodoItem): number => {
  const leftPriorityRank =
    left.priority == null ? NO_PRIORITY_RANK : left.priority.charCodeAt(0) - PRIORITY_BASE_CHAR_CODE;
  const rightPriorityRank =
    right.priority == null ? NO_PRIORITY_RANK : right.priority.charCodeAt(0) - PRIORITY_BASE_CHAR_CODE;
  if (leftPriorityRank !== rightPriorityRank) {
    return leftPriorityRank - rightPriorityRank;
  }

  const leftCreation = left.creationDate ?? '0000-00-00';
  const rightCreation = right.creationDate ?? '0000-00-00';
  if (leftCreation !== rightCreation) {
    return rightCreation.localeCompare(leftCreation);
  }

  return left.description.localeCompare(right.description);
};

export const buildColumns = (items: TodoItem[], errors: UnparseableTodoItem[], filter: string | undefined): Columns => {
  const normalizedFilter = filter?.trim().toLowerCase();

  const matchesFilter = (raw: string): boolean => {
    if (normalizedFilter == null || normalizedFilter.length === 0) {
      return true;
    }

    return raw.toLowerCase().includes(normalizedFilter);
  };

  const columns: Columns = {
    backlog: [],
    doing: [],
    done: []
  };

  const sortedTodos = [...items].toSorted(compareTodoItems);
  for (const item of sortedTodos) {
    if (!matchesFilter(item.raw)) {
      continue;
    }

    if (item.completed) {
      columns.done.push({ kind: 'todo', item });
      continue;
    }

    if (getStatusTag(item) === 'doing') {
      columns.doing.push({ kind: 'todo', item });
      continue;
    }

    columns.backlog.push({ kind: 'todo', item });
  }

  for (const error of errors) {
    if (matchesFilter(error.raw)) {
      columns.backlog.push({ kind: 'unparseable', item: error });
    }
  }

  return columns;
};
