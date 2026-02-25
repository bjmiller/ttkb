import { argv, cwd, env, execPath, exit } from 'node:process';

type BuildOptions = {
  target?: string;
  outfile: string;
  version: string;
  commit: string;
};

const ARGV_OFFSET = 2;
const PACKAGE_JSON_PATH = `${cwd()}/package.json`;

const readPackageVersion = async (): Promise<string> => {
  const packageJsonText = await Bun.file(PACKAGE_JSON_PATH).text();
  const packageJson = JSON.parse(packageJsonText) as { version?: string };

  if (!packageJson.version) {
    throw new Error('package.json is missing a version field');
  }

  return packageJson.version;
};

const parseArgs = async (): Promise<BuildOptions> => {
  const args = argv.slice(ARGV_OFFSET);

  const getArgValue = (flag: string): string | undefined => {
    const index = args.indexOf(flag);

    if (index === -1) {
      return undefined;
    }

    return args[index + 1];
  };

  const target = getArgValue('--target');
  const outfile = getArgValue('--outfile');
  const version = getArgValue('--version') ?? env.TTKB_BUILD_VERSION ?? (await readPackageVersion());
  const commit = getArgValue('--commit') ?? env.TTKB_BUILD_COMMIT ?? resolveGitCommit();

  if (!outfile) {
    throw new Error('Missing required --outfile argument');
  }

  return {
    ...(target ? { target } : {}),
    outfile,
    version,
    commit
  };
};

const resolveGitCommit = (): string => {
  const result = Bun.spawnSync(['git', 'rev-parse', '--short=7', 'HEAD'], {
    cwd: cwd(),
    stdout: 'pipe',
    stderr: 'ignore'
  });

  if (result.exitCode !== 0) {
    return 'unknown';
  }

  const commit = result.stdout.toString().trim();

  return commit.length > 0 ? commit : 'unknown';
};

const build = (options: BuildOptions): number => {
  const compileArgs = [
    execPath,
    'build',
    './index.tsx',
    '--compile',
    '--outfile',
    options.outfile,
    '--define',
    `__TTKB_BUILD_VERSION__=${JSON.stringify(options.version)}`,
    '--define',
    `__TTKB_BUILD_COMMIT__=${JSON.stringify(options.commit)}`
  ];

  if (options.target) {
    compileArgs.push('--target', options.target);
  }

  const result = Bun.spawnSync(compileArgs, {
    cwd: cwd(),
    stdout: 'inherit',
    stderr: 'inherit'
  });

  return result.exitCode;
};

const main = async () => {
  const options = await parseArgs();
  const exitCode = build(options);
  exit(exitCode);
};

void main();
