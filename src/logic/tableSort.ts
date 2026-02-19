import type { ColumnKey, DisplayTask } from './columns';

export type TableRow = {
  status: ColumnKey;
  task: DisplayTask;
};

export type TableSortColumn = 'status' | 'priority' | 'created' | 'project' | 'context' | 'meta' | 'description';
export type TableSortDirection = 'asc' | 'desc';

export type TableSort = {
  column: TableSortColumn;
  direction: TableSortDirection;
};

export const TABLE_SORT_COLUMNS: TableSortColumn[] = [
  'status',
  'priority',
  'created',
  'project',
  'context',
  'meta',
  'description'
];

export const FIRST_SORT_COLUMN: TableSortColumn = 'status';

export const getSortValue = (row: TableRow, column: TableSortColumn): string => {
  if (column === 'status') {
    return row.status;
  }

  if (row.task.kind === 'unparseable') {
    if (column === 'priority') {
      return '!';
    }

    if (column === 'description') {
      return row.task.item.raw;
    }

    return '-';
  }

  const { item } = row.task;

  if (column === 'priority') {
    return item.priority ?? '-';
  }

  if (column === 'created') {
    return item.creationDate ?? '-';
  }

  if (column === 'project') {
    return item.projects.length > 0 ? item.projects.map((value) => `+${value}`).join(' ') : '-';
  }

  if (column === 'context') {
    return item.contexts.length > 0 ? item.contexts.map((value) => `@${value}`).join(' ') : '-';
  }

  if (column === 'meta') {
    return item.metadata.length > 0 ? item.metadata.map((tag) => `${tag.key}:${tag.value}`).join(' ') : '-';
  }

  const doneLine = ['x', item.completionDate, item.creationDate, item.description]
    .filter((segment): segment is string => Boolean(segment))
    .join(' ');
  const descriptionValue = item.completed
    ? doneLine
    : `${item.priority ? `(${item.priority}) ` : ''}${item.creationDate ? `${item.creationDate} ` : ''}${item.description}`;
  const doneCallout = !item.completed && item.completionDate ? `done: ${item.completionDate}` : undefined;

  return doneCallout ? `${descriptionValue} ${doneCallout}` : descriptionValue;
};

export const sortTableRows = (rows: TableRow[], sort: TableSort | undefined): TableRow[] => {
  if (!sort) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const leftValue = getSortValue(left, sort.column);
    const rightValue = getSortValue(right, sort.column);
    const byValue = leftValue.localeCompare(rightValue);

    if (byValue !== 0) {
      return sort.direction === 'asc' ? byValue : -byValue;
    }

    return left.task.item.lineNumber - right.task.item.lineNumber;
  });
};
