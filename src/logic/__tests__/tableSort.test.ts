/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from 'bun:test';

import type { DisplayTask } from '../columns';
import { getSortValue, sortTableRows, type TableRow } from '../tableSort';
import type { TodoItem, UnparseableTodoItem } from '../../parser/types';

const todo = (partial: Partial<TodoItem> & Pick<TodoItem, 'lineNumber' | 'raw' | 'description'>): TodoItem => {
  const { lineNumber, raw, description, ...overrides } = partial;

  return {
    kind: 'todo',
    lineNumber,
    raw,
    completed: false,
    description,
    projects: [],
    contexts: [],
    metadata: [],
    dirty: false,
    ...overrides
  };
};

const unparseable = (lineNumber: number, raw: string): UnparseableTodoItem => ({
  kind: 'unparseable',
  lineNumber,
  raw,
  error: 'unparseable'
});

const row = (status: TableRow['status'], task: DisplayTask): TableRow => ({ status, task });

describe('tableSort', () => {
  it('sorts by project in ascending and descending order', () => {
    const rows: TableRow[] = [
      row('backlog', {
        kind: 'todo',
        item: todo({ lineNumber: 1, raw: 'alpha', description: 'alpha', projects: ['z'] })
      }),
      row('backlog', {
        kind: 'todo',
        item: todo({ lineNumber: 2, raw: 'beta', description: 'beta', projects: ['a'] })
      }),
      row('backlog', { kind: 'todo', item: todo({ lineNumber: 3, raw: 'none', description: 'none' }) })
    ];

    const asc = sortTableRows(rows, { column: 'project', direction: 'asc' });
    const desc = sortTableRows(rows, { column: 'project', direction: 'desc' });

    expect(asc.map((entry) => entry.task.item.lineNumber)).toEqual([3, 2, 1]);
    expect(desc.map((entry) => entry.task.item.lineNumber)).toEqual([1, 2, 3]);
  });

  it('sorts by context and meta based on rendered values', () => {
    const rows: TableRow[] = [
      row('backlog', {
        kind: 'todo',
        item: todo({
          lineNumber: 1,
          raw: 'ctx-z',
          description: 'ctx-z',
          contexts: ['z'],
          metadata: [{ key: 'a', value: '1' }]
        })
      }),
      row('backlog', {
        kind: 'todo',
        item: todo({
          lineNumber: 2,
          raw: 'ctx-a',
          description: 'ctx-a',
          contexts: ['a'],
          metadata: [{ key: 'z', value: '9' }]
        })
      })
    ];

    const byContext = sortTableRows(rows, { column: 'context', direction: 'asc' });
    const byMeta = sortTableRows(rows, { column: 'meta', direction: 'asc' });

    expect(byContext.map((entry) => entry.task.item.lineNumber)).toEqual([2, 1]);
    expect(byMeta.map((entry) => entry.task.item.lineNumber)).toEqual([1, 2]);
  });

  it('uses lineNumber as tiebreaker when sort values match', () => {
    const rows: TableRow[] = [
      row('backlog', {
        kind: 'todo',
        item: todo({ lineNumber: 8, raw: 'same', description: 'same', projects: ['x'] })
      }),
      row('backlog', { kind: 'todo', item: todo({ lineNumber: 2, raw: 'same', description: 'same', projects: ['x'] }) })
    ];

    const sorted = sortTableRows(rows, { column: 'project', direction: 'asc' });
    expect(sorted.map((entry) => entry.task.item.lineNumber)).toEqual([2, 8]);
  });

  it('handles unparseable rows for priority and description sort values', () => {
    const errorRow: TableRow = row('backlog', { kind: 'unparseable', item: unparseable(5, 'broken task') });
    const todoRow: TableRow = row('backlog', {
      kind: 'todo',
      item: todo({ lineNumber: 6, raw: '(A) clean', description: 'clean', priority: 'A' })
    });

    expect(getSortValue(errorRow, 'priority')).toBe('!');
    expect(getSortValue(errorRow, 'description')).toBe('broken task');

    const byPriority = sortTableRows([todoRow, errorRow], { column: 'priority', direction: 'asc' });
    expect(byPriority.map((entry) => entry.task.item.lineNumber)).toEqual([5, 6]);
  });

  it('returns the original array when sort is undefined', () => {
    const rows: TableRow[] = [
      row('doing', { kind: 'todo', item: todo({ lineNumber: 1, raw: 'one', description: 'one' }) })
    ];

    expect(sortTableRows(rows, undefined)).toBe(rows);
  });
});
