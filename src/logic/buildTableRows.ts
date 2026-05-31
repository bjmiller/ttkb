import type { Columns } from './columns';
import type { TableRow } from './tableTypes';

export const buildTableRows = (columns: Columns): TableRow[] => {
  return [
    ...columns.backlog.map((task) => ({ status: 'backlog' as const, task })),
    ...columns.doing.map((task) => ({ status: 'doing' as const, task })),
    ...columns.done.map((task) => ({ status: 'done' as const, task }))
  ];
};
