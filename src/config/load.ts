import path from 'node:path';

import { type } from 'arktype';

import { AppConfigFileSchema, type AppConfig } from './types';

type ResolvedAppConfig = {
  todoFilePath: string;
  cursorStyle: NonNullable<AppConfig['cursorStyle']>;
  cursorBlink: NonNullable<AppConfig['cursorBlink']>;
};

const CONFIG_FILENAMES = ['config.json', 'config.json5', 'config.yaml', 'config.yml', 'config.toml'] as const;
const HOME_PREFIX_LENGTH = 2;
const TODO_FILE_NAME = 'todo.txt';

const getHomeDir = (): string => {
  const homeDrive = process.env.HOMEDRIVE;
  const homePath = process.env.HOMEPATH;
  const homeDir =
    process.env.HOME ??
    process.env.USERPROFILE ??
    (homeDrive != null && homePath != null ? `${homeDrive}${homePath}` : undefined);

  if (homeDir == null || homeDir.length === 0) {
    throw new Error('Unable to resolve home directory from environment');
  }

  return homeDir;
};

export const expandHomePath = (value: string): string => {
  if (value === '~') {
    return getHomeDir();
  }

  if (/^~[\\/]/.test(value)) {
    return path.join(getHomeDir(), value.slice(HOME_PREFIX_LENGTH));
  }

  return value;
};

const getConfigDirectoryCandidates = (): string[] => {
  const homeDir = getHomeDir();
  const fallback = path.join(homeDir, '.config', 'ttkb');

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    const localAppData = process.env.LOCALAPPDATA;
    const windowsFallback = path.join(homeDir, 'AppData', 'Roaming', 'ttkb');

    const windowsCandidates = [
      appData != null && appData.length > 0 ? path.join(appData, 'ttkb') : undefined,
      localAppData != null && localAppData.length > 0 ? path.join(localAppData, 'ttkb') : undefined,
      windowsFallback,
      fallback
    ].filter((candidate): candidate is string => Boolean(candidate));

    return [...new Set(windowsCandidates)];
  }

  if (process.platform === 'darwin') {
    return [path.join(homeDir, 'Library', 'Application Support', 'ttkb'), fallback];
  }

  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome != null && xdgConfigHome.length > 0) {
    return [path.join(xdgConfigHome, 'ttkb'), fallback];
  }

  return [fallback];
};

const findConfigFile = async (): Promise<string | undefined> => {
  const candidates = getConfigDirectoryCandidates();
  const allPaths = candidates.flatMap((directory) =>
    CONFIG_FILENAMES.map((fileName) => path.join(directory, fileName))
  );

  const existence = await Promise.all(allPaths.map((fullPath) => Bun.file(fullPath).exists()));
  for (const [index, exists] of existence.entries()) {
    if (exists) {
      return allPaths[index];
    }
  }

  return undefined;
};

const parseConfigContent = (filePath: string, content: string): unknown => {
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }

  if (filePath.endsWith('.json5')) {
    return Bun.JSON5.parse(content);
  }

  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return Bun.YAML.parse(content);
  }

  if (filePath.endsWith('.toml')) {
    return Bun.TOML.parse(content);
  }

  throw new Error(`Unsupported config file format: ${filePath}`);
};

const DEFAULT_CONFIG: ResolvedAppConfig = {
  todoFilePath: `~/${TODO_FILE_NAME}`,
  cursorStyle: 'native',
  cursorBlink: false
};

const resolveTodoFilePathFromDirectory = (directory: string): string => {
  return path.join(directory, TODO_FILE_NAME);
};

const sanitizeConfig = (parsed: unknown): ResolvedAppConfig => {
  const result = AppConfigFileSchema(parsed);

  if (result instanceof type.errors) {
    return DEFAULT_CONFIG;
  }

  const todoFilePath =
    result.todoDirectoryPath !== undefined
      ? resolveTodoFilePathFromDirectory(result.todoDirectoryPath)
      : DEFAULT_CONFIG.todoFilePath;

  return {
    todoFilePath,
    cursorStyle: result.cursorStyle ?? DEFAULT_CONFIG.cursorStyle,
    cursorBlink: result.cursorBlink ?? DEFAULT_CONFIG.cursorBlink
  };
};

export const loadConfig = async (): Promise<AppConfig> => {
  const configPath = await findConfigFile();
  if (configPath == null) {
    return {
      ...DEFAULT_CONFIG,
      todoFilePath: expandHomePath(DEFAULT_CONFIG.todoFilePath)
    };
  }

  let parsed: unknown;
  try {
    const rawContent = await Bun.file(configPath).text();
    parsed = parseConfigContent(configPath, rawContent);
  } catch {
    parsed = undefined;
  }

  const validated = sanitizeConfig(parsed);

  return {
    ...validated,
    todoFilePath: expandHomePath(validated.todoFilePath)
  };
};
