/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from 'bun:test';

import {
  addTask,
  changeDates,
  changeDescription,
  changePriority,
  partitionCompleted,
  toggleCompletion,
  toggleDoing
} from '../mutations';
import { parseTodoLine, serializeTodoItems, type TodoItem } from '../../parser';

const makeTodo = (partial: Partial<TodoItem> = {}): TodoItem => ({
  kind: 'todo',
  lineNumber: 1,
  raw: 'Task',
  completed: false,
  description: 'Task',
  projects: [],
  contexts: [],
  metadata: [],
  dirty: false,
  ...partial
});

describe('toggleCompletion', () => {
  it('marks active task as completed and removes status:doing', () => {
    const source = makeTodo({
      metadata: [
        { key: 'status', value: 'doing' },
        { key: 'owner', value: 'me' }
      ]
    });

    const toggled = toggleCompletion(source);
    expect(toggled.completed).toBe(true);
    expect(toggled.completionDate).toBeDefined();
    expect(toggled.metadata).toEqual([{ key: 'owner', value: 'me' }]);
    expect(toggled.dirty).toBe(true);
  });

  it('marks completed task as active', () => {
    const source = makeTodo({ completed: true, completionDate: '2026-01-01' });

    const toggled = toggleCompletion(source);
    expect(toggled.completed).toBe(false);
    expect(toggled.completionDate).toBeUndefined();
    expect(toggled.dirty).toBe(true);
  });

  it('preserves priority and round-trips between pri tag (done) and parentheses (active)', () => {
    const parsedDone = parseTodoLine('x 2026-02-13 2026-02-01 Done task pri:B', 1);
    expect(parsedDone.kind).toBe('todo');
    if (parsedDone.kind !== 'todo') {
      return;
    }

    const activated = toggleCompletion(parsedDone);
    const activeLine = serializeTodoItems([activated]);
    expect(activeLine).toBe('(B) 2026-02-01 Done task');

    const completedAgain = toggleCompletion(activated);
    const doneLine = serializeTodoItems([completedAgain]);
    expect(doneLine).toContain(' pri:B');
    expect(doneLine).not.toContain('(B)');
  });
});

describe('addTask', () => {
  it('creates a new dirty task with trimmed description', () => {
    const created = addTask({ lineNumber: 5, description: '  New task  ', priority: 'B' });

    expect(created.lineNumber).toBe(5);
    expect(created.priority).toBe('B');
    expect(created.description).toBe('New task');
    expect(created.creationDate).toBeDefined();
    expect(created.dirty).toBe(true);
  });
});

describe('changePriority', () => {
  it('sets provided priority and marks dirty', () => {
    const changed = changePriority(makeTodo(), 'A');
    expect(changed.priority).toBe('A');
    expect(changed.dirty).toBe(true);
  });

  it('clears priority when undefined', () => {
    const changed = changePriority(makeTodo({ priority: 'C' }), undefined);
    expect(changed.priority).toBeUndefined();
    expect(changed.dirty).toBe(true);
  });
});

describe('changeDescription', () => {
  it('updates description while preserving priority and dates', () => {
    const source = makeTodo({
      priority: 'B',
      creationDate: '2026-01-01',
      completionDate: '2026-01-03'
    });

    const changed = changeDescription(source, '  Updated task  ');
    expect(changed.description).toBe('Updated task');
    expect(changed.priority).toBe('B');
    expect(changed.creationDate).toBe('2026-01-01');
    expect(changed.completionDate).toBe('2026-01-03');
    expect(changed.dirty).toBe(true);
  });
});

describe('changeDates', () => {
  it('updates creation date for active task', () => {
    const source = makeTodo({ creationDate: '2026-01-01' });

    const changed = changeDates(source, { creationDate: '2026-02-01' });
    expect(changed.creationDate).toBe('2026-02-01');
    expect(changed.completionDate).toBeUndefined();
    expect(changed.dirty).toBe(true);
  });

  it('clears creation date when undefined is provided', () => {
    const source = makeTodo({ creationDate: '2026-01-01' });

    const changed = changeDates(source, { creationDate: undefined });
    expect(changed.creationDate).toBeUndefined();
    expect(changed.dirty).toBe(true);
  });

  it('updates completion date for completed task', () => {
    const source = makeTodo({
      completed: true,
      creationDate: '2026-01-01',
      completionDate: '2026-01-02'
    });

    const changed = changeDates(source, {
      creationDate: '2026-01-01',
      completionDate: '2026-02-03'
    });
    expect(changed.creationDate).toBe('2026-01-01');
    expect(changed.completionDate).toBe('2026-02-03');
    expect(changed.dirty).toBe(true);
  });
});

describe('toggleDoing', () => {
  it('adds status:doing when task is in backlog', () => {
    const source = makeTodo({ metadata: [{ key: 'owner', value: 'me' }] });

    const changed = toggleDoing(source);
    expect(changed.metadata).toEqual([
      { key: 'owner', value: 'me' },
      { key: 'status', value: 'doing' }
    ]);
    expect(changed.dirty).toBe(true);
  });

  it('removes status:doing when task is in doing', () => {
    const source = makeTodo({
      description: 'Task status:doing',
      metadata: [
        { key: 'status', value: 'doing' },
        { key: 'owner', value: 'me' }
      ]
    });

    const changed = toggleDoing(source);
    expect(changed.description).toBe('Task');
    expect(changed.metadata).toEqual([{ key: 'owner', value: 'me' }]);
    expect(changed.dirty).toBe(true);
  });
});

describe('partitionCompleted', () => {
  it('splits active and completed tasks', () => {
    const tasks: TodoItem[] = [
      makeTodo({ lineNumber: 1, completed: false }),
      makeTodo({ lineNumber: 2, completed: true, completionDate: '2026-01-01' }),
      makeTodo({ lineNumber: 3, completed: false })
    ];

    const result = partitionCompleted(tasks);
    expect(result.active.map((task) => task.lineNumber)).toEqual([1, 3]);
    expect(result.completed.map((task) => task.lineNumber)).toEqual([2]);
  });
});
