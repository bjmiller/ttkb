import React from 'react';
import { Box, Text } from 'ink';

export const HelpOverlay = () => {
  return (
    <Box borderStyle="round" borderColor="yellow" padding={1} flexDirection="column">
      <Text bold># ttkb commands</Text>
      <Text>Arrows: navigate</Text>
      <Text>x: toggle completion</Text>
      <Text>d: toggle backlog/doing</Text>
      <Text>a: add task</Text>
      <Text>e: edit selected task description</Text>
      <Text>p: change priority</Text>
      <Text>f: filter tasks</Text>
      <Text>c: clean done to done.txt</Text>
      <Text>;: edit selected task dates</Text>
      <Text>Delete: delete selected task (confirm)</Text>
      <Text>Tab: switch created/completed date while editing done task dates</Text>
      <Text>Shift-Q: quit confirmation</Text>
      <Text>Esc: dismiss input/filter</Text>
      <Text>?: help</Text>
    </Box>
  );
};
