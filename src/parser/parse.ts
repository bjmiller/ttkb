import {
  DATE_PATTERN,
  PRIORITY_PATTERN,
  PRIORITY_TAG_KEY,
  type ParsedTodoFile,
  type ParsedTodoLine,
  type TodoItem,
  TodoItemSchema,
  type UnparseableTodoItem
} from './types';
import { extractTags } from './tags';

const priorityTokenPattern = /^\(([A-Z])\)$/;

const makeError = (raw: string, lineNumber: number, error: string): UnparseableTodoItem => ({
  kind: 'unparseable',
  raw,
  lineNumber,
  error
});

const isDate = (value: string): boolean => DATE_PATTERN.test(value);

export const parseTodoLine = (raw: string, lineNumber: number): ParsedTodoLine => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return makeError(raw, lineNumber, 'Line is blank or whitespace-only');
  }

  const tokens = trimmed.split(/\s+/);
  let index = 0;

  let completed = false;
  let parenthesizedPriority: string | undefined;
  let priTagPriority: string | undefined;
  let completionDate: string | undefined;
  let creationDate: string | undefined;

  if (tokens[index] === 'x') {
    completed = true;
    index += 1;
  }

  const priorityToken = tokens[index];
  const priorityMatch = priorityToken?.match(priorityTokenPattern);
  if (priorityMatch != null) {
    const [, parsedPriority] = priorityMatch;
    if (parsedPriority == null || !PRIORITY_PATTERN.test(parsedPriority)) {
      return makeError(raw, lineNumber, 'Invalid priority token');
    }

    parenthesizedPriority = parsedPriority;
    index += 1;
  } else if (priorityToken?.startsWith('(') === true) {
    return makeError(raw, lineNumber, 'Malformed priority token');
  }

  if (completed) {
    const maybeCompletionDate = tokens[index];
    if (maybeCompletionDate == null || !isDate(maybeCompletionDate)) {
      return makeError(raw, lineNumber, 'Completed task is missing a valid completion date');
    }

    completionDate = maybeCompletionDate;
    index += 1;
  }

  const maybeCreationDate = tokens[index];
  if (maybeCreationDate != null && isDate(maybeCreationDate)) {
    creationDate = maybeCreationDate;
    index += 1;
  }

  const descriptionTokens = tokens.slice(index);
  if (descriptionTokens.length === 0) {
    return makeError(raw, lineNumber, 'Task description is missing');
  }

  const extracted = extractTags(descriptionTokens.join(' '));
  const { description: joinedDescription, projects, contexts, metadata } = extracted;

  if (joinedDescription.length === 0) {
    return makeError(raw, lineNumber, 'Task description is missing');
  }

  const priTagIndex = metadata.findIndex((tag) => tag.key === PRIORITY_TAG_KEY && PRIORITY_PATTERN.test(tag.value));
  const priTag = priTagIndex >= 0 ? metadata[priTagIndex] : undefined;
  if (priTag != null && priTagPriority == null) {
    priTagPriority = priTag.value;
  }

  const descriptionWords = joinedDescription.split(/\s+/);

  const item: TodoItem = {
    kind: 'todo',
    lineNumber,
    raw,
    completed,
    description: descriptionWords.join(' '),
    projects,
    contexts,
    metadata
  };

  const priority = completed ? priTagPriority : parenthesizedPriority;

  if (priority != null) {
    item.priority = priority;
  }

  if (completionDate != null) {
    item.completionDate = completionDate;
  }

  if (creationDate != null) {
    item.creationDate = creationDate;
  }

  try {
    TodoItemSchema.assert(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid todo item';
    return makeError(raw, lineNumber, message);
  }

  return item;
};

export const parseTodoFile = async (filePath: string): Promise<ParsedTodoFile> => {
  const content = await Bun.file(filePath).text();
  const lines = content.split(/\r?\n/);

  const items: TodoItem[] = [];
  const errors: UnparseableTodoItem[] = [];

  for (const [index, line] of lines.entries()) {
    if (line.trim().length === 0) {
      continue;
    }

    const parsed = parseTodoLine(line, index + 1);
    if (parsed.kind === 'todo') {
      items.push(parsed);
    } else {
      errors.push(parsed);
    }
  }

  return { items, errors };
};
