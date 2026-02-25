declare const __TTKB_BUILD_VERSION__: string | undefined;
declare const __TTKB_BUILD_COMMIT__: string | undefined;

const resolveBuildVersion = (): string => {
  if (typeof __TTKB_BUILD_VERSION__ === 'string' && __TTKB_BUILD_VERSION__.length > 0) {
    return __TTKB_BUILD_VERSION__;
  }

  return 'dev';
};

const resolveBuildCommit = (): string => {
  if (typeof __TTKB_BUILD_COMMIT__ === 'string' && __TTKB_BUILD_COMMIT__.length > 0) {
    return __TTKB_BUILD_COMMIT__;
  }

  return 'unknown';
};

export const BUILD_VERSION = resolveBuildVersion();
export const BUILD_COMMIT = resolveBuildCommit();
export const HELP_BUILD_INFO = `v${BUILD_VERSION} (${BUILD_COMMIT})`;
