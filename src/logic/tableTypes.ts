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
