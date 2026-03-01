import { type } from 'arktype';

export const AppConfigFileSchema = type({
  'todoDirectoryPath?': 'string',
  'cursorStyle?': "'native' | 'block' | 'bar' | 'underline'",
  'cursorBlink?': 'boolean'
});

export type AppConfigFile = typeof AppConfigFileSchema.infer;

export type AppConfig = {
  todoFilePath: string;
  cursorStyle?: AppConfigFile['cursorStyle'];
  cursorBlink?: AppConfigFile['cursorBlink'];
};
export type CursorShape = NonNullable<AppConfig['cursorStyle']>;
export type CursorStyle = {
  shape: CursorShape;
  blink: boolean;
};
