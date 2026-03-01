import { useEffect } from 'react';

import type { ViewMode } from '../types';

type UseViewportSelectionSyncParams = {
  viewMode: ViewMode;
  tableRowsLength: number;
  tableSelectedIndex: number;
  setTableSelectedIndex: (value: number | ((current: number) => number)) => void;
  cardSelectedIndex: number;
  cardVisibleCount: number;
  tableVisibleCount: number;
  scrollOffset: number;
  setScrollOffset: (value: number) => void;
};

export const useViewportSelectionSync = ({
  viewMode,
  tableRowsLength,
  tableSelectedIndex,
  setTableSelectedIndex,
  cardSelectedIndex,
  cardVisibleCount,
  tableVisibleCount,
  scrollOffset,
  setScrollOffset
}: UseViewportSelectionSyncParams) => {
  useEffect(() => {
    setTableSelectedIndex((current) => {
      if (tableRowsLength === 0) {
        return 0;
      }

      return Math.min(current, tableRowsLength - 1);
    });
  }, [setTableSelectedIndex, tableRowsLength]);

  useEffect(() => {
    const selectedIndex = viewMode === 'table' ? tableSelectedIndex : cardSelectedIndex;
    const visibleCount = viewMode === 'table' ? tableVisibleCount : cardVisibleCount;

    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + visibleCount) {
      setScrollOffset(Math.max(selectedIndex - visibleCount + 1, 0));
    }
  }, [
    cardSelectedIndex,
    cardVisibleCount,
    scrollOffset,
    setScrollOffset,
    tableSelectedIndex,
    tableVisibleCount,
    viewMode
  ]);
};
