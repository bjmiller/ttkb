import type { ParsedTodoLine, TodoItem } from './types';

const serializeTodoItem = (item: TodoItem): string => {
  if (!item.dirty) {
    return item.raw;
  }

  const segments: string[] = [];

  if (item.completed) {
    segments.push('x');
  }

  if (item.priority) {
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
    segments.push(`${metadataTag.key}:${metadataTag.value}`);
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
