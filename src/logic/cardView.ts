import type { DisplayTask } from './columns';
import { formatContexts, formatDoneCallout, formatMeta, formatPrimaryLine, formatProjects } from './taskFormatting';

const TASK_CARD_BORDER_ROWS = 2;
const UNPARSEABLE_CARD_MARGIN_BOTTOM_ROWS = 1;

const getWrappedRowCount = (value: string, contentWidth: number): number => {
  if (contentWidth <= 0) {
    return 1;
  }

  if (value.length === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(value.length / contentWidth));
};

export const getCardHeight = (task: DisplayTask, contentWidth: number): number => {
  if (task.kind === 'unparseable') {
    const header = `Unparseable line ${task.item.lineNumber}`;
    const rawValue = task.item.raw || '(blank line)';
    const contentRows =
      getWrappedRowCount(header, contentWidth) +
      getWrappedRowCount(rawValue, contentWidth) +
      getWrappedRowCount(task.item.error, contentWidth);

    return contentRows + TASK_CARD_BORDER_ROWS + UNPARSEABLE_CARD_MARGIN_BOTTOM_ROWS;
  }

  const primaryLine = formatPrimaryLine(task.item);

  let contentRows = getWrappedRowCount(primaryLine, contentWidth);

  const doneCallout = formatDoneCallout(task.item);
  if (doneCallout) {
    contentRows += getWrappedRowCount(doneCallout, contentWidth);
  }

  if (task.item.projects.length > 0) {
    contentRows += getWrappedRowCount(`projects: ${formatProjects(task.item.projects)}`, contentWidth);
  }

  if (task.item.contexts.length > 0) {
    contentRows += getWrappedRowCount(`contexts: ${formatContexts(task.item.contexts)}`, contentWidth);
  }

  if (task.item.metadata.length > 0) {
    contentRows += getWrappedRowCount(`meta: ${formatMeta(task.item.metadata)}`, contentWidth);
  }

  return contentRows + TASK_CARD_BORDER_ROWS;
};

export const getVisibleCardCount = (
  tasks: DisplayTask[],
  scrollOffset: number,
  availableRows: number,
  contentWidth: number
): number => {
  if (tasks.length === 0 || scrollOffset >= tasks.length || availableRows <= 0) {
    return 0;
  }

  let rowsUsed = 0;
  let count = 0;

  for (let index = scrollOffset; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (!task) {
      break;
    }

    const height = getCardHeight(task, contentWidth);
    if (count > 0 && rowsUsed + height > availableRows) {
      break;
    }

    rowsUsed += height;
    count += 1;

    if (rowsUsed >= availableRows) {
      break;
    }
  }

  return count;
};
