import React, { useEffect } from 'react';
import { render, Text, useApp } from 'ink';

const App = () => {
  const { exit } = useApp();
  useEffect(() => {
    exit();
  });
  return <Text>Placeholder</Text>;
};

render(<App />);
