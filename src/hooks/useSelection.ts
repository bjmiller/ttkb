import { useEffect, useMemo, useState } from 'react';

import { getWrappedHorizontalColumnIndex, getWrappedVerticalIndex } from '../logic/selectionNavigation';
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
    setSelection((current) => {
      const count = columns[getColumnKey(current.column)].length;
      if (count === 0) {
        return current;
      }

      return {
        ...current,
        index: getWrappedVerticalIndex(current.index, count, -1)
      };
    });
  };

  const moveDown = () => {
    setSelection((current) => {
      const count = columns[getColumnKey(current.column)].length;
      if (count === 0) {
        return current;
      }

      return {
        ...current,
        index: getWrappedVerticalIndex(current.index, count, 1)
      };
    });
  };

  const moveHorizontal = (direction: -1 | 1) => {
    setSelection((current) => {
      const nextColumn = getWrappedHorizontalColumnIndex(
        current.column,
        direction,
        ORDER.map((key) => columns[key].length)
      );
      if (nextColumn === undefined) {
        return current;
      }

      const targetLength = columns[getColumnKey(nextColumn)].length;
      return {
        column: nextColumn,
        index: Math.min(current.index, targetLength - 1)
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
