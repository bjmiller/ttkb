/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from 'bun:test';

import { buildColumns } from '../columns';
import type { TodoItem, UnparseableTodoItem } from '../../parser';

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

describe('buildColumns', () => {
  it('assigns backlog, doing, and done columns', () => {
    const items: TodoItem[] = [
      todo({ lineNumber: 1, raw: '(A) 2026-01-01 Backlog task', description: 'Backlog task', priority: 'A' }),
      todo({
        lineNumber: 2,
        raw: '2026-01-02 Doing task status:doing',
        description: 'Doing task status:doing',
        metadata: [{ key: 'status', value: 'doing' }]
      }),
      todo({
        lineNumber: 3,
        raw: 'x 2026-01-03 2026-01-01 Done task',
        description: 'Done task',
        completed: true,
        completionDate: '2026-01-03'
      })
    ];

    const columns = buildColumns(items, [], undefined);
    expect(columns.backlog).toHaveLength(1);
    expect(columns.doing).toHaveLength(1);
    expect(columns.done).toHaveLength(1);
  });

  it('sorts by priority asc, creation desc, description asc', () => {
    const items: TodoItem[] = [
      todo({
        lineNumber: 1,
        raw: '(B) 2026-01-01 zeta',
        description: 'zeta',
        priority: 'B',
        creationDate: '2026-01-01'
      }),
      todo({
        lineNumber: 2,
        raw: '(A) 2026-01-03 beta',
        description: 'beta',
        priority: 'A',
        creationDate: '2026-01-03'
      }),
      todo({
        lineNumber: 3,
        raw: '(A) 2026-01-02 alpha',
        description: 'alpha',
        priority: 'A',
        creationDate: '2026-01-02'
      }),
      todo({
        lineNumber: 4,
        raw: '2026-01-04 no-priority',
        description: 'no-priority',
        creationDate: '2026-01-04'
      })
    ];

    const columns = buildColumns(items, [], undefined);
    const backlogDescriptions = columns.backlog.map((entry) =>
      entry.kind === 'todo' ? entry.item.description : entry.item.raw
    );

    expect(backlogDescriptions).toEqual(['beta', 'alpha', 'zeta', 'no-priority']);
  });

  it('filters by raw line and keeps unparseable items in backlog', () => {
    const items: TodoItem[] = [
      todo({ lineNumber: 1, raw: 'Task one +home', description: 'Task one +home' }),
      todo({ lineNumber: 2, raw: 'Task two +work', description: 'Task two +work' })
    ];

    const errors: UnparseableTodoItem[] = [
      {
        kind: 'unparseable',
        lineNumber: 3,
        raw: 'bad +home line',
        error: 'bad line'
      }
    ];

    const columns = buildColumns(items, errors, '+home');
    expect(columns.backlog).toHaveLength(2);
    expect(columns.doing).toHaveLength(0);
    expect(columns.done).toHaveLength(0);
    expect(columns.backlog[1]?.kind).toBe('unparseable');
  });
});
