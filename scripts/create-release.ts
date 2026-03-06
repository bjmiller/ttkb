import { argv, cwd, exit, stderr } from 'node:process';

import { type } from 'arktype';
import { $ } from 'zx';

type PackageJson = {
  version: string;
  scripts?: Record<string, string>;
};

type ParsedSemver = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
};

const PACKAGE_JSON_PATH = `${cwd()}/package.json`;
const ARGV_OFFSET = 2;
const JSON_INDENTATION = 2;
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const PackageJsonSchema = type({
  version: 'string',
  'scripts?': 'Record<string, string>'
});

const parseVersionArgument = (): string => {
  const args = argv.slice(ARGV_OFFSET);
  const versionFlagIndex = args.indexOf('--version');

  if (versionFlagIndex !== -1) {
    const version = args[versionFlagIndex + 1];

    if (version == null || version.length === 0) {
      throw new Error('Missing value for --version');
    }

    return version;
  }

  const [version] = args;

  if (version == null || version.length === 0) {
    throw new Error('Usage: bun run create-release -- <version>');
  }

  return version;
};

const parseSemver = (input: string): ParsedSemver => {
  const match = input.match(SEMVER_REGEX);

  if (!match) {
    throw new Error(`Invalid semver version: ${input}`);
  }

  const [, majorText, minorText, patchText, prereleaseText] = match;

  if (majorText == null || minorText == null || patchText == null) {
    throw new Error(`Invalid semver version: ${input}`);
  }

  const prerelease = prereleaseText == null ? [] : prereleaseText.split('.');

  for (const identifier of prerelease) {
    if (/^\d+$/.test(identifier) && identifier.length > 1 && identifier.startsWith('0')) {
      throw new Error(`Invalid semver version: ${input}`);
    }
  }

  return {
    major: Number.parseInt(majorText, 10),
    minor: Number.parseInt(minorText, 10),
    patch: Number.parseInt(patchText, 10),
    prerelease
  };
};

const compareIdentifiers = (left: string, right: string): number => {
  const leftIsNumeric = /^\d+$/.test(left);
  const rightIsNumeric = /^\d+$/.test(right);

  if (leftIsNumeric && rightIsNumeric) {
    return Number.parseInt(left, 10) - Number.parseInt(right, 10);
  }

  if (leftIsNumeric) {
    return -1;
  }

  if (rightIsNumeric) {
    return 1;
  }

  return left.localeCompare(right);
};

const compareSemver = (left: ParsedSemver, right: ParsedSemver): number => {
  const majorDelta = left.major - right.major;

  if (majorDelta !== 0) {
    return majorDelta;
  }

  const minorDelta = left.minor - right.minor;

  if (minorDelta !== 0) {
    return minorDelta;
  }

  const patchDelta = left.patch - right.patch;

  if (patchDelta !== 0) {
    return patchDelta;
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) {
    return 0;
  }

  if (left.prerelease.length === 0) {
    return 1;
  }

  if (right.prerelease.length === 0) {
    return -1;
  }

  const comparisonLength = Math.max(left.prerelease.length, right.prerelease.length);

  for (let index = 0; index < comparisonLength; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];

    if (leftIdentifier == null) {
      return -1;
    }

    if (rightIdentifier == null) {
      return 1;
    }

    const identifierDelta = compareIdentifiers(leftIdentifier, rightIdentifier);

    if (identifierDelta !== 0) {
      return identifierDelta;
    }
  }

  return 0;
};

const readPackageJson = async (): Promise<PackageJson> => {
  const packageJsonText = await Bun.file(PACKAGE_JSON_PATH).text();
  const packageJson = PackageJsonSchema(JSON.parse(packageJsonText));

  if (packageJson instanceof type.errors) {
    throw new Error('package.json has an invalid format');
  }

  return packageJson;
};

const writePackageVersion = async (packageJson: PackageJson, version: string): Promise<void> => {
  const nextPackageJson: PackageJson = {
    ...packageJson,
    version
  };

  await Bun.write(PACKAGE_JSON_PATH, `${JSON.stringify(nextPackageJson, null, JSON_INDENTATION)}\n`);
};

const ensureTagDoesNotExist = async (version: string): Promise<void> => {
  const tagName = `v${version}`;
  const result = await $`git tag -l ${tagName}`;

  if (result.stdout.trim().length > 0) {
    throw new Error(`Tag ${tagName} already exists`);
  }
};

const commitPackageJson = async (version: string): Promise<void> => {
  await $`git add package.json`;
  await $`git commit -m ${`Release ${version}`} -- package.json`;
};

const createAnnotatedTag = async (version: string): Promise<void> => {
  await $`git tag -a ${`v${version}`} -m ${`Release ${version}`}`;
};

const main = async (): Promise<void> => {
  const nextVersion = parseVersionArgument();
  const nextSemver = parseSemver(nextVersion);
  const packageJson = await readPackageJson();
  const currentSemver = parseSemver(packageJson.version);

  if (compareSemver(nextSemver, currentSemver) <= 0) {
    throw new Error(`Version ${nextVersion} must be newer than ${packageJson.version}`);
  }

  await ensureTagDoesNotExist(nextVersion);
  await writePackageVersion(packageJson, nextVersion);
  await commitPackageJson(nextVersion);
  await createAnnotatedTag(nextVersion);
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  stderr.write(`${message}\n`);
  exit(1);
});
