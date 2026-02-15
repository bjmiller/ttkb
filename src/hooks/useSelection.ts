import { useEffect, useMemo, useState } from 'react';

import type { ColumnKey, Columns } from '../logic/columns';

const ORDER: ColumnKey[] = ['backlog', 'doing', 'done'];
const DEFAULT_COLUMN_KEY: ColumnKey = 'backlog';

const getColumnKey = (index: number): ColumnKey => {
  return ORDER[index] ?? DEFAULT_COLUMN_KEY;
};

type SelectionState = {
  column: number;
  index: number;
};

const findFirstNonEmptyColumn = (columns: Columns): number => {
  for (const [index, key] of ORDER.entries()) {
    if (columns[key].length > 0) {
      return index;
    }
  }

  return 0;
};

export const useSelection = (columns: Columns) => {
  const [selection, setSelection] = useState<SelectionState>({
    column: 0,
    index: 0
  });

  useEffect(() => {
    setSelection((current) => {
      const currentColumnItems = columns[getColumnKey(current.column)];
      if (currentColumnItems.length > 0) {
        return {
          column: current.column,
          index: Math.min(current.index, currentColumnItems.length - 1)
        };
      }

      return {
        column: findFirstNonEmptyColumn(columns),
        index: 0
      };
    });
  }, [columns]);

  const moveUp = () => {
    setSelection((current) => ({
      ...current,
      index: Math.max(0, current.index - 1)
    }));
  };

  const moveDown = () => {
    setSelection((current) => {
      const count = columns[getColumnKey(current.column)].length;
      return {
        ...current,
        index: Math.min(Math.max(count - 1, 0), current.index + 1)
      };
    });
  };

  const moveHorizontal = (direction: -1 | 1) => {
    setSelection((current) => {
      let target = current.column + direction;
      while (target >= 0 && target < ORDER.length && columns[getColumnKey(target)].length === 0) {
        target += direction;
      }

      if (target < 0 || target >= ORDER.length) {
        return current;
      }

      const targetLength = columns[getColumnKey(target)].length;
      return {
        column: target,
        index: Math.min(current.index, Math.max(targetLength - 1, 0))
      };
    });
  };

  const setColumnIndex = (column: ColumnKey, index: number) => {
    const columnPosition = ORDER.indexOf(column);
    if (columnPosition === -1) {
      return;
    }

    setSelection({
      column: columnPosition,
      index
    });
  };

  const selectedColumnKey = getColumnKey(selection.column);
  const selectedItem = columns[selectedColumnKey][selection.index];

  return useMemo(
    () => ({
      selectedColumnKey,
      selectedIndex: selection.index,
      selectedItem,
      moveUp,
      moveDown,
      moveLeft: () => moveHorizontal(-1),
      moveRight: () => moveHorizontal(1),
      setColumnIndex
    }),
    [selectedColumnKey, selection.index, selectedItem]
  );
};
