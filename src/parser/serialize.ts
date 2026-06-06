import type { ParsedTodoLine } from './types';

export const serializeTodoItems = (items: ParsedTodoLine[]): string => {
  return items.map((item) => item.raw).join('\n');
};
