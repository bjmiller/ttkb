import type { TodoItem } from '../parser/types';

export const formatDoneLine = (item: TodoItem): string => {
  return ['x', item.completionDate, item.creationDate, item.description]
    .filter((segment): segment is string => Boolean(segment))
    .join(' ');
};

export const formatActiveLine = (item: TodoItem): string => {
  return `${item.priority ? `(${item.priority}) ` : ''}${item.creationDate ? `${item.creationDate} ` : ''}${item.description}`;
};

export const formatPrimaryLine = (item: TodoItem): string => {
  return item.completed ? formatDoneLine(item) : formatActiveLine(item);
};

export const formatDoneCallout = (item: TodoItem): string | undefined => {
  return !item.completed && item.completionDate ? `done: ${item.completionDate}` : undefined;
};

export const formatProjects = (projects: string[]): string => {
  return projects.map((value) => `+${value}`).join(' ');
};

export const formatContexts = (contexts: string[]): string => {
  return contexts.map((value) => `@${value}`).join(' ');
};

export const formatMeta = (metadata: TodoItem['metadata']): string => {
  return metadata.map((tag) => `${tag.key}:${tag.value}`).join(' ');
};
