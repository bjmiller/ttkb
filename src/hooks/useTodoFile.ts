import { watch } from 'node:fs';
import path from 'node:path';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { readTodoFile, writeTextAtomic } from '../logic/persistence';
import type { ParsedTodoLine, TodoItem, UnparseableTodoItem } from '../parser/types';
import { byLineNumber } from '../logic/ordering';

const MAX_UNDO_DEPTH = 50;
const DONE_FILE_NAME = 'done.txt';

type UndoEntry = {
  todoLines: ParsedTodoLine[];
  doneContent: string;
};

export const useTodoFile = (filePath: string) => {
  const [lines, setLines] = useState<ParsedTodoLine[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<string>('Loading...');
  const skipWatchRef = useRef(false);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const doneFilePath = path.join(path.dirname(filePath), DONE_FILE_NAME);

  const load = useCallback(async () => {
    try {
      const parsed = await readTodoFile(filePath);
      const s = parsed.items.length === 1 ? '' : 's';
      const allLines = [...parsed.items, ...parsed.errors].toSorted(byLineNumber);
      setLines(allLines);
      setStatus(`${parsed.items.length} task${s}`);
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
        const normalizedChangedName = typeof changedName === 'string' ? changedName : undefined;

        if (normalizedChangedName != null && normalizedChangedName !== targetName) {
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
        await writeTextAtomic(filePath, nextLines);
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

      let doneContent: string = '';
      try {
        const doneFile = Bun.file(doneFilePath);
        doneContent = (await doneFile.exists()) ? await doneFile.text() : '';
      } catch {
        doneContent = '';
      }

      const nextMutatedLines = await mutator(items, errors);

      const nextLines = nextMutatedLines
        .map((line, index) => {
          line.lineNumber = index + 1;
          return line;
        })
        .toSorted(byLineNumber);

      undoStackRef.current.push({ todoLines: structuredClone(lines), doneContent });
      if (undoStackRef.current.length > MAX_UNDO_DEPTH) {
        undoStackRef.current.shift();
      }

      await persist(nextLines);
    },
    [lines, persist, doneFilePath]
  );

  const undo = useCallback(async () => {
    const snapshot = undoStackRef.current.pop();
    if (snapshot == null) {
      setStatus('Nothing to undo');
      return;
    }

    try {
      skipWatchRef.current = true;

      await writeTextAtomic(filePath, snapshot.todoLines);
      await writeTextAtomic(doneFilePath, snapshot.doneContent);

      setLines(snapshot.todoLines);
      setStatus('Undone');
      setError(undefined);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to write todo file';
      setError(message);
      setStatus('Undo failed');
    }
  }, [filePath, doneFilePath]);

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
    mutateTodos,
    undo
  };
};
