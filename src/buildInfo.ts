declare const __TTKB_BUILD_VERSION__: string | undefined;
declare const __TTKB_BUILD_COMMIT__: string | undefined;

const resolveBuildDefine = (resolve: () => string | undefined, fallback: string): string => {
  try {
    const value = resolve();
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  } catch {
    // Build define not available at runtime
  }

  return fallback;
};

export const BUILD_VERSION = resolveBuildDefine(() => __TTKB_BUILD_VERSION__, 'dev');
export const BUILD_COMMIT = resolveBuildDefine(() => __TTKB_BUILD_COMMIT__, 'unknown');
export const HELP_BUILD_INFO = `v${BUILD_VERSION} (${BUILD_COMMIT})`;
