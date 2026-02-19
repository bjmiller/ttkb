import { useEffect } from 'react';

const HIDE_CURSOR = '\u001b[?25l';
const SHOW_CURSOR = '\u001b[?25h';

export const useTerminalCursorVisibility = () => {
  useEffect(() => {
    process.stdout.write(HIDE_CURSOR);

    return () => {
      process.stdout.write(SHOW_CURSOR);
    };
  }, []);
};
