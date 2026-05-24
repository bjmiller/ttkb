import { useState, useEffect } from 'react';

const DEFAULT_TERMINAL_HEIGHT = 24;
const DEFAULT_TERMINAL_WIDTH = 80;

type TerminalSize = {
  rows: number;
  columns: number;
};

export const useTerminalSize = (): TerminalSize => {
  const [size, setSize] = useState<TerminalSize>(() => ({
    rows: process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT,
    columns: process.stdout.columns ?? DEFAULT_TERMINAL_WIDTH
  }));

  useEffect(() => {
    const onResize = () => {
      setSize({
        rows: process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT,
        columns: process.stdout.columns ?? DEFAULT_TERMINAL_WIDTH
      });
    };

    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  return size;
};
