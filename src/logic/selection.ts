import type { ColumnKey, Columns } from './columns';
import type { TableRow } from './tableSort';

export type CardSelection = {
  column: ColumnKey;
  index: number;
};

export const findCardSelectionByLineNumber = (columns: Columns, lineNumber: number): CardSelection | undefined => {
  const backlogIndex = columns.backlog.findIndex((task) => task.item.lineNumber === lineNumber);
  if (backlogIndex >= 0) {
    return { column: 'backlog', index: backlogIndex };
  }

  const doingIndex = columns.doing.findIndex((task) => task.item.lineNumber === lineNumber);
  if (doingIndex >= 0) {
    return { column: 'doing', index: doingIndex };
  }

  const doneIndex = columns.done.findIndex((task) => task.item.lineNumber === lineNumber);
  if (doneIndex >= 0) {
    return { column: 'done', index: doneIndex };
  }

  return undefined;
};

export const findTableSelectionIndexByLineNumber = (tableRows: TableRow[], lineNumber: number): number | undefined => {
  const index = tableRows.findIndex((row) => row.task.item.lineNumber === lineNumber);
  return index >= 0 ? index : undefined;
};
