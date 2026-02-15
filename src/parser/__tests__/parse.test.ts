import { describe, expect, it } from 'bun:test';

import { parseTodoFile, parseTodoLine } from '../parse';
import { serializeTodoItems } from '../serialize';

const EXPECTED_ITEM_COUNT = 2;
const SECOND_ITEM_LINE_NUMBER = 4;
const SECOND_SERIALIZED_LINE_NUMBER = 2;

describe('parseTodoLine', () => {
  it('parses active task with priority and date', () => {
    const parsed = parseTodoLine('(A) 2026-02-13 Do something +code @home', 1);
    expect(parsed.kind).toBe('todo');

    if (parsed.kind === 'todo') {
      expect(parsed.completed).toBe(false);
      expect(parsed.priority).toBe('A');
      expect(parsed.creationDate).toBe('2026-02-13');
      expect(parsed.projects).toEqual(['code']);
      expect(parsed.contexts).toEqual(['home']);
    }
  });

  it('parses completed task', () => {
    const parsed = parseTodoLine('x (C) 2026-02-13 2026-02-01 Do the thing +misc', 1);
    expect(parsed.kind).toBe('todo');

    if (parsed.kind === 'todo') {
      expect(parsed.completed).toBe(true);
      expect(parsed.priority).toBeUndefined();
      expect(parsed.completionDate).toBe('2026-02-13');
      expect(parsed.creationDate).toBe('2026-02-01');
    }
  });

  it('extracts metadata tags', () => {
    const parsed = parseTodoLine('(B) 2026-02-14 Build app status:doing owner:me', 1);
    expect(parsed.kind).toBe('todo');

    if (parsed.kind === 'todo') {
      expect(parsed.metadata).toEqual([
        { key: 'status', value: 'doing' },
        { key: 'owner', value: 'me' }
      ]);
    }
  });

  it('parses priority from pri tag for completed task', () => {
    const parsed = parseTodoLine('x 2026-02-13 2026-02-01 Do the thing pri:C owner:me', 1);
    expect(parsed.kind).toBe('todo');

    if (parsed.kind === 'todo') {
      expect(parsed.priority).toBe('C');
      expect(parsed.metadata).toEqual([
        { key: 'pri', value: 'C' },
        { key: 'owner', value: 'me' }
      ]);
    }
  });

  it('prefers parentheses priority for active tasks even if pri tag exists', () => {
    const parsed = parseTodoLine('(B) 2026-02-13 Active task pri:C', 1);
    expect(parsed.kind).toBe('todo');

    if (parsed.kind === 'todo') {
      expect(parsed.completed).toBe(false);
      expect(parsed.priority).toBe('B');
      expect(parsed.metadata).toEqual([{ key: 'pri', value: 'C' }]);
    }
  });

  it('returns unparseable for malformed priority', () => {
    const parsed = parseTodoLine('(AA) invalid priority', 1);
    expect(parsed.kind).toBe('unparseable');
  });

  it('returns unparseable for completed task missing date', () => {
    const parsed = parseTodoLine('x (A) missing date', 1);
    expect(parsed.kind).toBe('unparseable');
  });

  it('returns unparseable for blank lines', () => {
    const parsed = parseTodoLine('   ', 1);
    expect(parsed.kind).toBe('unparseable');
  });
});

describe('serializeTodoItems', () => {
  it('round-trips unchanged parsed lines', () => {
    const source = [
      '(A) 2026-02-13 Do something interesting +code @home',
      'x (C) 2026-02-13 2026-02-01 Do the thing +misc'
    ];
    const parsed = source.map((line, index) => parseTodoLine(line, index + 1));
    const serialized = serializeTodoItems(parsed);

    expect(serialized).toBe(source.join('\n'));
  });

  it('serializes completed priority as pri tag and active priority as parentheses', () => {
    const parsed = [
      parseTodoLine('(A) 2026-02-13 Active task', 1),
      parseTodoLine('x 2026-02-13 2026-02-01 Done task pri:B', SECOND_SERIALIZED_LINE_NUMBER)
    ];

    if (parsed[0]?.kind === 'todo') {
      parsed[0].dirty = true;
    }

    if (parsed[1]?.kind === 'todo') {
      parsed[1].dirty = true;
    }

    const serialized = serializeTodoItems(parsed);
    expect(serialized).toBe('(A) 2026-02-13 Active task\nx 2026-02-13 2026-02-01 Done task pri:B');
  });
});

describe('parseTodoFile', () => {
  it('skips blank lines', async () => {
    const tempPath = `${process.cwd()}/.tmp-ttkb-parse-${Date.now()}.txt`;
    await Bun.write(tempPath, '(A) 2026-02-13 First task\n\n   \n(B) 2026-02-14 Second task\n');

    const parsed = await parseTodoFile(tempPath);
    expect(parsed.items).toHaveLength(EXPECTED_ITEM_COUNT);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.items[0]?.lineNumber).toBe(1);
    expect(parsed.items[1]?.lineNumber).toBe(SECOND_ITEM_LINE_NUMBER);

    await Bun.file(tempPath).delete();
  });
});
