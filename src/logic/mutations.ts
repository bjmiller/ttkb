import { PRIORITY_TAG_KEY, type TodoItem } from '../parser/types';

type DateChanges = {
  creationDate: string | undefined;
  completionDate?: string;
};

const ISO_DATE_END_INDEX = 10;

const today = (): string => new Date().toISOString().slice(0, ISO_DATE_END_INDEX);

const withoutStatusDoing = (item: TodoItem): TodoItem['metadata'] => {
  return item.metadata.filter((tag) => !(tag.key === 'status' && tag.value === 'doing'));
};

const withoutPriorityTag = (metadata: TodoItem['metadata']): TodoItem['metadata'] => {
  return metadata.filter((tag) => tag.key !== PRIORITY_TAG_KEY);
};

const withPriorityTag = (metadata: TodoItem['metadata'], priority: string | undefined): TodoItem['metadata'] => {
  const withoutPriority = withoutPriorityTag(metadata);
  if (!priority) {
    return withoutPriority;
  }

  return [...withoutPriority, { key: PRIORITY_TAG_KEY, value: priority }];
};

const hasStatusDoing = (item: TodoItem): boolean => {
  return item.metadata.some((tag) => tag.key === 'status' && tag.value === 'doing');
};

const STATUS_DOING_TOKEN = 'status:doing';
const PRIORITY_TAG_TOKEN_PATTERN = /^pri:[A-Z]$/;

const withoutStatusDoingInDescription = (description: string): string => {
  const cleaned = description
    .split(/\s+/)
    .filter((token) => token.length > 0 && token !== STATUS_DOING_TOKEN)
    .join(' ')
    .trim();

  return cleaned;
};

const withoutPriorityTagInDescription = (description: string): string => {
  const cleaned = description
    .split(/\s+/)
    .filter((token) => token.length > 0 && !PRIORITY_TAG_TOKEN_PATTERN.test(token))
    .join(' ')
    .trim();

  return cleaned;
};

export const toggleCompletion = (item: TodoItem): TodoItem => {
  if (item.completed) {
    const { completionDate: _completionDate, ...withoutCompletionDate } = item;
    return {
      ...withoutCompletionDate,
      description: withoutPriorityTagInDescription(item.description),
      metadata: withoutPriorityTag(item.metadata),
      completed: false,
      dirty: true
    };
  }

  return {
    ...item,
    completed: true,
    completionDate: today(),
    metadata: withPriorityTag(withoutStatusDoing(item), item.priority),
    dirty: true
  };
};

export const addTask = (params: { lineNumber: number; description: string; priority?: string }): TodoItem => {
  const base: TodoItem = {
    kind: 'todo',
    lineNumber: params.lineNumber,
    raw: '',
    completed: false,
    creationDate: today(),
    description: params.description.trim(),
    projects: [],
    contexts: [],
    metadata: [],
    dirty: true
  };

  return params.priority ? { ...base, priority: params.priority } : base;
};

export const changePriority = (item: TodoItem, priority: string | undefined): TodoItem => {
  if (!priority) {
    const { priority: _priority, ...withoutPriority } = item;
    return {
      ...withoutPriority,
      metadata: withoutPriorityTag(item.metadata),
      dirty: true
    };
  }

  if (item.completed) {
    return {
      ...item,
      priority,
      metadata: withPriorityTag(item.metadata, priority),
      dirty: true
    };
  }

  return {
    ...item,
    priority,
    metadata: withoutPriorityTag(item.metadata),
    dirty: true
  };
};

export const changeDescription = (item: TodoItem, description: string): TodoItem => {
  return {
    ...item,
    description: description.trim(),
    dirty: true
  };
};

export const changeDates = (item: TodoItem, changes: DateChanges): TodoItem => {
  let nextItem: TodoItem;

  if (changes.creationDate) {
    nextItem = { ...item, creationDate: changes.creationDate, dirty: true };
  } else {
    const { creationDate: _creationDate, ...withoutCreationDate } = item;
    nextItem = { ...withoutCreationDate, dirty: true };
  }

  if (item.completed && changes.completionDate) {
    return {
      ...nextItem,
      completionDate: changes.completionDate,
      dirty: true
    };
  }

  return nextItem;
};

export const toggleDoing = (item: TodoItem): TodoItem => {
  if (hasStatusDoing(item)) {
    return {
      ...item,
      description: withoutStatusDoingInDescription(item.description),
      metadata: withoutStatusDoing(item),
      dirty: true
    };
  }

  return {
    ...item,
    metadata: [...withoutStatusDoing(item), { key: 'status', value: 'doing' }],
    dirty: true
  };
};

export const partitionCompleted = (items: TodoItem[]): { active: TodoItem[]; completed: TodoItem[] } => {
  const active: TodoItem[] = [];
  const completed: TodoItem[] = [];

  for (const item of items) {
    if (item.completed) {
      completed.push(item);
    } else {
      active.push(item);
    }
  }

  return { active, completed };
};
