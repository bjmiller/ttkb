export const getWrappedVerticalIndex = (currentIndex: number, count: number, direction: -1 | 1): number => {
  if (count <= 0) {
    return currentIndex;
  }

  if (direction === -1) {
    return currentIndex === 0 ? count - 1 : currentIndex - 1;
  }

  return (currentIndex + 1) % count;
};

export const getWrappedHorizontalColumnIndex = (
  currentColumnIndex: number,
  direction: -1 | 1,
  columnLengths: number[]
): number | undefined => {
  const columnCount = columnLengths.length;
  if (columnCount === 0) {
    return undefined;
  }

  let target = currentColumnIndex;
  for (let attempt = 0; attempt < columnCount; attempt += 1) {
    target = (target + direction + columnCount) % columnCount;
    if ((columnLengths[target] ?? 0) > 0) {
      return target;
    }
  }

  return undefined;
};
