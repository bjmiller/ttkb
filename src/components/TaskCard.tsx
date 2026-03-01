import React from 'react';
import { Box, Text } from 'ink';

import {
  formatContexts,
  formatDoneCallout,
  formatMeta,
  formatPrimaryLine,
  formatProjects
} from '../logic/taskFormatting';
import type { TodoItem } from '../parser/types';

type TaskCardProps = {
  item: TodoItem;
  selected: boolean;
};

const TaskCardComponent = ({ item, selected }: TaskCardProps) => {
  const borderColor = selected ? 'greenBright' : 'white';
  const borderStyle = selected ? 'bold' : 'single';

  const primaryLine = formatPrimaryLine(item);
  const doneCallout = formatDoneCallout(item);

  return (
    <Box borderStyle={borderStyle} borderColor={borderColor} paddingX={1} flexDirection="column" marginBottom={0}>
      <Text>{primaryLine}</Text>
      {doneCallout ? <Text color="green">{doneCallout}</Text> : null}
      {item.projects.length > 0 ? <Text color="blueBright">projects: {formatProjects(item.projects)}</Text> : null}
      {item.contexts.length > 0 ? <Text color="magenta">contexts: {formatContexts(item.contexts)}</Text> : null}
      {item.metadata.length > 0 ? <Text color="yellow">meta: {formatMeta(item.metadata)}</Text> : null}
    </Box>
  );
};

export const TaskCard = React.memo(TaskCardComponent, (prev, next) => {
  return prev.item === next.item && prev.selected === next.selected;
});

TaskCard.displayName = 'TaskCard';
