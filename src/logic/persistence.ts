import { rename, unlink } from 'node:fs/promises';
import path from 'node:path';

import { parseTodoFile, serializeTodoItems, type ParsedTodoLine } from '../parser';

const HASH_RADIX = 16;
const HASH_SLICE_START = 2;
const NEWLINE = '\n';

const ensureTrailingNewline = (content: string): string => {
  if (content.length === 0 || content.endsWith(NEWLINE)) {
    return content;
  }

  return `${content}${NEWLINE}`;
};

const createTempPath = (filePath: string): string => {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  return path.join(dir, `.${base}.tmp-${Date.now()}-${Math.random().toString(HASH_RADIX).slice(HASH_SLICE_START)}`);
};

const writeTextAtomic = async (filePath: string, content: string): Promise<void> => {
  const tempPath = createTempPath(filePath);
  await Bun.write(tempPath, content);

  try {
    await rename(tempPath, filePath);
  } catch {
    await Bun.write(filePath, await Bun.file(tempPath).text());
  } finally {
    if (await Bun.file(tempPath).exists()) {
      await unlink(tempPath);
    }
  }
};

export const readTodoFile = async (filePath: string) => {
  if (!(await Bun.file(filePath).exists())) {
    return {
      items: [],
      errors: []
    };
  }

  return parseTodoFile(filePath);
};

export const writeTodoFileAtomic = async (filePath: string, lines: ParsedTodoLine[]): Promise<void> => {
  await writeTextAtomic(filePath, ensureTrailingNewline(serializeTodoItems(lines)));
};

export const appendLinesToFile = async (filePath: string, lines: ParsedTodoLine[]): Promise<void> => {
  const contentToAppend = serializeTodoItems(lines);
  if (contentToAppend.length === 0) {
    return;
  }

  const existingFile = Bun.file(filePath);
  const existingContent = (await existingFile.exists()) ? await existingFile.text() : '';

  const separator = existingContent.length > 0 && !existingContent.endsWith(NEWLINE) ? NEWLINE : '';
  await writeTextAtomic(filePath, ensureTrailingNewline(`${existingContent}${separator}${contentToAppend}`));
};
