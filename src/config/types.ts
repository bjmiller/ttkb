import { type } from 'arktype';

export const AppConfigSchema = type({
  todoFilePath: 'string',
  todoDirectoryPath: 'string?',
  cursorStyle: "'native' | 'block' | 'bar' | 'underline'?",
  cursorBlink: 'boolean?'
});

export type AppConfig = typeof AppConfigSchema.infer;
export type CursorShape = NonNullable<AppConfig['cursorStyle']>;
export type CursorStyle = {
  shape: CursorShape;
  blink: boolean;
};
