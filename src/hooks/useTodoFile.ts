import { watch } from 'node:fs';
import path from 'node:path';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { readTodoFile, writeTodoFileAtomic } from '../logic/persistence';
import type { ParsedTodoLine, TodoItem, UnparseableTodoItem } from '../parser';

const byLineNumber = (left: ParsedTodoLine, right: ParsedTodoLine): number => left.lineNumber - right.lineNumber;

export const useTodoFile = (filePath: string) => {
  const [lines, setLines] = useState<ParsedTodoLine[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<string>('Loading...');
  const skipWatchRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const parsed = await readTodoFile(filePath);
      const allLines = [...parsed.items, ...parsed.errors].sort(byLineNumber);
      setLines(allLines);
      setStatus(`Loaded ${parsed.items.length} tasks`);
      setError(undefined);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load todo file';
      setError(message);
      setStatus('Load failed');
    }
  }, [filePath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const directory = path.dirname(filePath);
    const targetName = path.basename(filePath);

    let watcher: ReturnType<typeof watch> | undefined;

    try {
      watcher = watch(directory, (_eventType, changedName) => {
        const normalizedChangedName =
          typeof changedName === 'string' ? changedName : changedName ? changedName.toString() : undefined;

        if (normalizedChangedName && normalizedChangedName !== targetName) {
          return;
        }

        if (skipWatchRef.current) {
          skipWatchRef.current = false;
          return;
        }

        void load();
      });
    } catch {
      return;
    }

    return () => watcher?.close();
  }, [filePath, load]);

  const persist = useCallback(
    async (nextLines: ParsedTodoLine[]) => {
      try {
        skipWatchRef.current = true;
        await writeTodoFileAtomic(filePath, nextLines);
        setLines(nextLines);
        setStatus('Saved');
        setError(undefined);
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : 'Failed to write todo file';
        setError(message);
        setStatus('Save failed');
      }
    },
    [filePath]
  );

  const mutateTodos = useCallback(
    async (
      mutator: (items: TodoItem[], errors: UnparseableTodoItem[]) => ParsedTodoLine[] | Promise<ParsedTodoLine[]>
    ) => {
      const items: TodoItem[] = [];
      const errors: UnparseableTodoItem[] = [];

      for (const line of lines) {
        if (line.kind === 'todo') {
          items.push(line);
        } else {
          errors.push(line);
        }
      }

      const nextMutatedLines = await mutator(items, errors);

      const nextLines = nextMutatedLines
        .map((line, index) => ({
          ...line,
          lineNumber: index + 1
        }))
        .sort(byLineNumber);

      await persist(nextLines);
    },
    [lines, persist]
  );

  const items = useMemo(() => lines.filter((line): line is TodoItem => line.kind === 'todo'), [lines]);
  const errors = useMemo(
    () => lines.filter((line): line is UnparseableTodoItem => line.kind === 'unparseable'),
    [lines]
  );

  return {
    lines,
    items,
    errors,
    status,
    error,
    reload: load,
    mutateTodos
  };
};
