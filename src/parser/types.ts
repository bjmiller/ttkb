import { type } from 'arktype';

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const PRIORITY_PATTERN = /^[A-Z]$/;

export const MetadataTagSchema = type({
  key: 'string',
  value: 'string'
});

export const TodoItemSchema = type({
  kind: "'todo'",
  lineNumber: 'number',
  raw: 'string',
  completed: 'boolean',
  priority: 'string?',
  completionDate: 'string?',
  creationDate: 'string?',
  description: 'string',
  projects: 'string[]',
  contexts: 'string[]',
  metadata: MetadataTagSchema.array(),
  dirty: 'boolean'
});

export const UnparseableTodoItemSchema = type({
  kind: "'unparseable'",
  lineNumber: 'number',
  raw: 'string',
  error: 'string'
});

export type MetadataTag = typeof MetadataTagSchema.infer;
export type TodoItem = typeof TodoItemSchema.infer;
export type UnparseableTodoItem = typeof UnparseableTodoItemSchema.infer;
export type ParsedTodoLine = TodoItem | UnparseableTodoItem;

export type ParsedTodoFile = {
  items: TodoItem[];
  errors: UnparseableTodoItem[];
};
