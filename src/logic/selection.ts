import type { ColumnKey, Columns } from './columns';
import type { TableRow } from './tableTypes';

type CardSelection = {
  column: ColumnKey;
  index: number;
};

const COLUMN_KEYS: ColumnKey[] = ['backlog', 'doing', 'done'];

export const findCardSelectionByLineNumber = (columns: Columns, lineNumber: number): CardSelection | undefined => {
  for (const column of COLUMN_KEYS) {
    const index = columns[column].findIndex((task) => task.item.lineNumber === lineNumber);
    if (index >= 0) {
      return { column, index };
    }
  }

  return undefined;
};

export const findTableSelectionIndexByLineNumber = (tableRows: TableRow[], lineNumber: number): number | undefined => {
  const index = tableRows.findIndex((row) => row.task.item.lineNumber === lineNumber);
  return index >= 0 ? index : undefined;
};
