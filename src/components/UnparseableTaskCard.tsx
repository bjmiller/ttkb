import React from 'react';
import { Box, Text } from 'ink';

import type { UnparseableTodoItem } from '../parser/types';

type UnparseableTaskCardProps = {
  item: UnparseableTodoItem;
  selected: boolean;
};

const UnparseableTaskCardComponent = ({ item, selected }: UnparseableTaskCardProps) => {
  return (
    <Box
      borderStyle="round"
      borderColor={selected ? 'yellow' : 'red'}
      paddingX={1}
      flexDirection="column"
      marginBottom={1}
    >
      <Text color="red">Unparseable line {item.lineNumber}</Text>
      <Text>{item.raw || '(blank line)'}</Text>
      <Text color="red">{item.error}</Text>
    </Box>
  );
};

export const UnparseableTaskCard = React.memo(UnparseableTaskCardComponent, (prev, next) => {
  return prev.item === next.item && prev.selected === next.selected;
});

UnparseableTaskCard.displayName = 'UnparseableTaskCard';
