export const byLineNumber = <T extends { lineNumber: number }>(left: T, right: T): number =>
  left.lineNumber - right.lineNumber;
