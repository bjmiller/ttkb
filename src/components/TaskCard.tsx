import React from 'react';
import { Box, Text } from 'ink';

import type { TodoItem } from '../parser/types';

type Props = {
  item: TodoItem;
  selected: boolean;
};

export const TaskCard = ({ item, selected }: Props) => {
  const borderColor = selected ? 'greenBright' : 'white';
  const borderStyle = selected ? 'bold' : 'single';

  const doneLine = ['x', item.completionDate, item.creationDate, item.description]
    .filter((segment): segment is string => Boolean(segment))
    .join(' ');

  return (
    <Box borderStyle={borderStyle} borderColor={borderColor} paddingX={1} flexDirection="column" marginBottom={0}>
      <Text>
        {item.completed
          ? doneLine
          : `${item.priority ? `(${item.priority}) ` : ''}${item.creationDate ? `${item.creationDate} ` : ''}${item.description}`}
      </Text>
      {!item.completed && item.completionDate ? <Text color="green">done: {item.completionDate}</Text> : null}
      {item.projects.length > 0 ? (
        <Text color="blueBright">projects: {item.projects.map((value) => `+${value}`).join(' ')}</Text>
      ) : null}
      {item.contexts.length > 0 ? (
        <Text color="magenta">contexts: {item.contexts.map((value) => `@${value}`).join(' ')}</Text>
      ) : null}
      {item.metadata.length > 0 ? (
        <Text color="yellow">meta: {item.metadata.map((tag) => `${tag.key}:${tag.value}`).join(' ')}</Text>
      ) : null}
    </Box>
  );
};
