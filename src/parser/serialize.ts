import type { ParsedTodoLine, TodoItem } from './types';

const PRIORITY_TAG_KEY = 'pri';

const serializeTodoItem = (item: TodoItem): string => {
  if (!item.dirty) {
    return item.raw;
  }

  const segments: string[] = [];

  if (item.completed) {
    segments.push('x');
  }

  if (item.priority && !item.completed) {
    segments.push(`(${item.priority})`);
  }

  if (item.completed && item.completionDate) {
    segments.push(item.completionDate);
  }

  if (item.creationDate) {
    segments.push(item.creationDate);
  }

  segments.push(item.description);

  for (const project of item.projects) {
    segments.push(`+${project}`);
  }

  for (const context of item.contexts) {
    segments.push(`@${context}`);
  }

  for (const metadataTag of item.metadata) {
    if (metadataTag.key === PRIORITY_TAG_KEY) {
      continue;
    }

    segments.push(`${metadataTag.key}:${metadataTag.value}`);
  }

  if (item.completed && item.priority) {
    segments.push(`${PRIORITY_TAG_KEY}:${item.priority}`);
  }

  return segments.join(' ');
};

export const serializeTodoItems = (items: ParsedTodoLine[]): string => {
  return items
    .map((item) => {
      if (item.kind === 'unparseable') {
        return item.raw;
      }

      return serializeTodoItem(item);
    })
    .join('\n');
};
