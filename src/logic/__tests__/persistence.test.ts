import { describe, expect, it } from 'bun:test';

import { writeTodoFileAtomic, appendLinesToFile, readTodoFile } from '../persistence';
import { parseTodoLine } from '../../parser';

const SECOND_LINE_NUMBER = 2;

const FIRST_TASK = '(A) 2026-02-01 First task +code';
const SECOND_TASK = 'x 2026-02-05 2026-02-03 Done task +misc';
const THIRD_TASK = '(B) 2026-02-10 Third task @home';

const makeTempPath = (suffix: string): string => {
  return `${process.cwd()}/.tmp-ttkb-persistence-${suffix}-${Date.now()}.txt`;
};

describe('writeTodoFileAtomic', () => {
  it('returns empty data when source file does not exist', async () => {
    const filePath = makeTempPath('missing');
    const parsed = await readTodoFile(filePath);

    expect(parsed.items).toHaveLength(0);
    expect(parsed.errors).toHaveLength(0);
  });

  it('writes serialized todo lines to the destination file', async () => {
    const filePath = makeTempPath('write');
    const lines = [parseTodoLine(FIRST_TASK, 1), parseTodoLine(SECOND_TASK, SECOND_LINE_NUMBER)];

    await writeTodoFileAtomic(filePath, lines);
    const content = await Bun.file(filePath).text();

    expect(content).toBe(`${FIRST_TASK}\n${SECOND_TASK}\n`);

    await Bun.file(filePath).delete();
  });
});

describe('appendLinesToFile', () => {
  it('appends lines with a single separator newline when needed', async () => {
    const filePath = makeTempPath('append');
    await Bun.write(filePath, FIRST_TASK);

    await appendLinesToFile(filePath, [parseTodoLine(THIRD_TASK, SECOND_LINE_NUMBER)]);
    const content = await Bun.file(filePath).text();

    expect(content).toBe(`${FIRST_TASK}\n${THIRD_TASK}\n`);

    await Bun.file(filePath).delete();
  });

  it('does nothing when there are no lines to append', async () => {
    const filePath = makeTempPath('noop');
    await Bun.write(filePath, FIRST_TASK);

    await appendLinesToFile(filePath, []);
    const content = await Bun.file(filePath).text();

    expect(content).toBe(FIRST_TASK);

    await Bun.file(filePath).delete();
  });
});
