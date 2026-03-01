import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { ColumnKey, Columns, DisplayTask } from '../logic/columns';
import { findCardSelectionByLineNumber, findTableSelectionIndexByLineNumber } from '../logic/selection';
import type { TableRow } from '../logic/tableTypes';
import type { ViewMode } from '../types';

type UsePreserveSelectionParams = {
  viewMode: ViewMode;
  tableRows: TableRow[];
  setTableSelectedIndex: (value: number | ((current: number) => number)) => void;
  columns: Columns;
  setCardSelection: (column: 'backlog' | 'doing' | 'done', index: number) => void;
};

type PendingSelection = {
  lineNumber: number;
  sourceKey: string;
};

type SelectionState = {
  selectedColumnKey: ColumnKey;
  selectedIndex: number;
};

type UseEffectiveSelectionParams = {
  viewMode: ViewMode;
  pendingLineNumber: number | undefined;
  columns: Columns;
  selection: SelectionState;
  tableRows: TableRow[];
  tableSelectedIndex: number;
};

type EffectiveSelection = {
  cardSelectedColumn: ColumnKey;
  cardSelectedIndex: number;
  cardSelectedItem: DisplayTask | undefined;
  tableSelectedIndex: number;
};

export const usePreserveSelection = ({
  viewMode,
  tableRows,
  setTableSelectedIndex,
  columns,
  setCardSelection
}: UsePreserveSelectionParams) => {
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | undefined>();

  const selectionKey = useMemo(() => {
    if (viewMode === 'table') {
      return `table:${tableRows.map((row) => row.task.item.lineNumber).join(',')}`;
    }

    return `cards:${columns.backlog
      .map((task) => task.item.lineNumber)
      .join(',')}|${columns.doing.map((task) => task.item.lineNumber).join(',')}|${columns.done
      .map((task) => task.item.lineNumber)
      .join(',')}`;
  }, [columns.backlog, columns.doing, columns.done, tableRows, viewMode]);

  const selectionKeyRef = useRef(selectionKey);

  useEffect(() => {
    selectionKeyRef.current = selectionKey;
  }, [selectionKey]);

  const preserveSelection = useCallback((lineNumber: number) => {
    setPendingSelection({
      lineNumber,
      sourceKey: selectionKeyRef.current
    });
  }, []);

  useLayoutEffect(() => {
    if (!pendingSelection) {
      return;
    }

    if (selectionKey === pendingSelection.sourceKey) {
      return;
    }

    if (viewMode === 'table') {
      const nextIndex = findTableSelectionIndexByLineNumber(tableRows, pendingSelection.lineNumber);
      if (nextIndex !== undefined) {
        setTableSelectedIndex(nextIndex);
      }

      setPendingSelection(undefined);
      return;
    }

    const nextCardSelection = findCardSelectionByLineNumber(columns, pendingSelection.lineNumber);
    if (nextCardSelection) {
      setCardSelection(nextCardSelection.column, nextCardSelection.index);
      setPendingSelection(undefined);
      return;
    }

    setPendingSelection(undefined);
  }, [
    columns.backlog,
    columns.doing,
    columns.done,
    pendingSelection,
    setCardSelection,
    setTableSelectedIndex,
    selectionKey,
    tableRows,
    viewMode
  ]);

  return {
    preserveSelection,
    pendingLineNumber: pendingSelection?.lineNumber
  };
};

export const useEffectiveSelection = ({
  viewMode,
  pendingLineNumber,
  columns,
  selection,
  tableRows,
  tableSelectedIndex
}: UseEffectiveSelectionParams): EffectiveSelection => {
  const pendingCardSelection = useMemo(() => {
    if (viewMode !== 'cards' || pendingLineNumber === undefined) {
      return undefined;
    }

    return findCardSelectionByLineNumber(columns, pendingLineNumber);
  }, [columns, pendingLineNumber, viewMode]);

  const cardSelectedColumn = pendingCardSelection?.column ?? selection.selectedColumnKey;
  const cardSelectedIndex = pendingCardSelection?.index ?? selection.selectedIndex;
  const cardSelectedItem = columns[cardSelectedColumn][cardSelectedIndex];

  const effectiveTableSelectedIndex = useMemo(() => {
    if (viewMode !== 'table' || pendingLineNumber === undefined) {
      return tableSelectedIndex;
    }

    const pendingIndex = findTableSelectionIndexByLineNumber(tableRows, pendingLineNumber);
    return pendingIndex ?? tableSelectedIndex;
  }, [pendingLineNumber, tableRows, tableSelectedIndex, viewMode]);

  return {
    cardSelectedColumn,
    cardSelectedIndex,
    cardSelectedItem,
    tableSelectedIndex: effectiveTableSelectedIndex
  };
};
