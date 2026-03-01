import { formatContexts, formatDoneCallout, formatMeta, formatPrimaryLine, formatProjects } from './taskFormatting';
import type { TableRow, TableSort, TableSortColumn } from './tableTypes';

export type { TableRow, TableSort, TableSortColumn };

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
    return item.projects.length > 0 ? formatProjects(item.projects) : '-';
  }

  if (column === 'context') {
    return item.contexts.length > 0 ? formatContexts(item.contexts) : '-';
  }

  if (column === 'meta') {
    return item.metadata.length > 0 ? formatMeta(item.metadata) : '-';
  }

  const descriptionValue = formatPrimaryLine(item);
  const doneCallout = formatDoneCallout(item);

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
