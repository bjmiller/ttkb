import React from 'react';
import { Text } from 'ink';
import { DATE_PATTERN, type TodoItem } from '../parser/types';

const IMPENDING_THRESHOLD_DAYS = 3;

export type DueDateStatus = 'invalid' | 'overdue' | 'today' | 'impending' | 'future';

const getDaysBetween = (a: Date, b: Date): number => {
  const MS_PER_DAY = 86_400_000;
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
};

export const getDueDateStatus = (value: string): DueDateStatus => {
  if (!DATE_PATTERN.test(value)) {
    return 'invalid';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${value}T00:00:00`);
  const diffDays = getDaysBetween(due, today);

  if (diffDays < 0) {
    return 'overdue';
  }
  if (diffDays === 0) {
    return 'today';
  }
  if (diffDays <= IMPENDING_THRESHOLD_DAYS) {
    return 'impending';
  }
  return 'future';
};

const DUE_DATE_COLORS: Record<DueDateStatus, string> = {
  invalid: 'gray',
  overdue: 'redBright',
  today: 'redBright',
  impending: 'yellow',
  future: 'green'
};

export const getDueDateColor = (value: string): string => {
  return DUE_DATE_COLORS[getDueDateStatus(value)];
};

const getTagColor = (tag: TodoItem['metadata'][number]): string => {
  if (tag.key === 'due') {
    return getDueDateColor(tag.value);
  }
  if (tag.key === 'pri') {
    return 'gray';
  }
  if (tag.key === 'status' && tag.value === 'doing') {
    return 'gray';
  }
  return 'cyan';
};

const sortMetadataTags = (metadata: TodoItem['metadata']): TodoItem['metadata'][number][] => {
  const due: TodoItem['metadata'][number][] = [];
  const rest: TodoItem['metadata'][number][] = [];

  for (const tag of metadata) {
    if (tag.key === 'due') {
      due.push(tag);
    } else {
      rest.push(tag);
    }
  }

  return [...due, ...rest];
};

export const renderColoredMeta = (metadata: TodoItem['metadata']): React.ReactNode => {
  const sorted = sortMetadataTags(metadata);
  return sorted.map((tag, i) => (
    <Text key={`${tag.key}:${tag.value}`} color={getTagColor(tag)}>
      {`${tag.key}:${tag.value}${i < sorted.length - 1 ? ' ' : ''}`}
    </Text>
  ));
};

export const getMetaBanner = (metadata: TodoItem['metadata']): { text: string; color: string } | null => {
  const dueTag = metadata.find((tag) => tag.key === 'due');
  if (dueTag == null) {
    return null;
  }

  const status = getDueDateStatus(dueTag.value);
  if (status === 'today' || status === 'impending') {
    return { text: 'IMPENDING', color: 'yellowBright' };
  }
  if (status === 'overdue') {
    return { text: 'OVERDUE', color: 'redBright' };
  }

  return null;
};
