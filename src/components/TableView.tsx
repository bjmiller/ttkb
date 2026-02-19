import React from 'react';
import { Box, Text } from 'ink';

import type { ColumnKey, DisplayTask } from '../logic/columns';

type TableRow = {
  status: ColumnKey;
  task: DisplayTask;
};

type TableViewProps = {
  rows: TableRow[];
  selectedIndex: number;
  scrollOffset: number;
  visibleCount: number;
};

const ROW_NUMBER_WIDTH = 4;
const STATUS_WIDTH = 8;
const PRIORITY_WIDTH = 3;
const DATE_WIDTH = 10;

const labelByStatus: Record<ColumnKey, string> = {
  backlog: 'backlog',
  doing: 'doing',
  done: 'done'
};

const formatCell = (value: string, width: number): string => {
  return value.slice(0, width).padEnd(width, ' ');
};

const DESCRIPTION_HEADER = 'Description';
const PROJECT_HEADER = 'Project';
const CONTEXT_HEADER = 'Context';
const META_HEADER = 'Meta';
const PRIORITY_HEADER = 'P';

type TableColumnWidths = {
  project: number;
  context: number;
  meta: number;
};

type RowCellValues = {
  priority: string;
  created: string;
  project: string;
  context: string;
  meta: string;
  description: string;
};

const getRowCellValues = (row: TableRow): RowCellValues => {
  if (row.task.kind === 'unparseable') {
    return {
      priority: '!',
      created: '-',
      project: '-',
      context: '-',
      meta: '-',
      description: row.task.item.raw
    };
  }

  const { item } = row.task;
  const doneLine = ['x', item.completionDate, item.creationDate, item.description]
    .filter((segment): segment is string => Boolean(segment))
    .join(' ');
  const descriptionValue = item.completed
    ? doneLine
    : `${item.priority ? `(${item.priority}) ` : ''}${item.creationDate ? `${item.creationDate} ` : ''}${item.description}`;
  const doneCallout = !item.completed && item.completionDate ? `done: ${item.completionDate}` : undefined;

  return {
    priority: item.priority ?? '-',
    created: item.creationDate ?? '-',
    project: item.projects.length > 0 ? item.projects.map((value) => `+${value}`).join(' ') : '-',
    context: item.contexts.length > 0 ? item.contexts.map((value) => `@${value}`).join(' ') : '-',
    meta: item.metadata.length > 0 ? item.metadata.map((tag) => `${tag.key}:${tag.value}`).join(' ') : '-',
    description: doneCallout ? `${descriptionValue} ${doneCallout}` : descriptionValue
  };
};

const getColumnWidths = (rows: TableRow[]): TableColumnWidths => {
  return rows.reduce<TableColumnWidths>(
    (widths, row) => {
      const values = getRowCellValues(row);

      return {
        project: Math.max(widths.project, values.project.length),
        context: Math.max(widths.context, values.context.length),
        meta: Math.max(widths.meta, values.meta.length)
      };
    },
    {
      project: PROJECT_HEADER.length,
      context: CONTEXT_HEADER.length,
      meta: META_HEADER.length
    }
  );
};

const renderHeaderDivider = (widths: TableColumnWidths): string => {
  const rowNumber = '─'.repeat(ROW_NUMBER_WIDTH);
  const status = '─'.repeat(STATUS_WIDTH);
  const priority = '─'.repeat(PRIORITY_WIDTH);
  const created = '─'.repeat(DATE_WIDTH);
  const project = '─'.repeat(widths.project);
  const context = '─'.repeat(widths.context);
  const meta = '─'.repeat(widths.meta);
  const description = '─'.repeat(DESCRIPTION_HEADER.length);
  return `${rowNumber}─┼─${status}─┼─${priority}─┼─${created}─┼─${project}─┼─${context}─┼─${meta}─┼─${description}`;
};

const renderHeaderText = (widths: TableColumnWidths): string => {
  const rowNumber = formatCell('#', ROW_NUMBER_WIDTH);
  const status = formatCell('Status', STATUS_WIDTH);
  const priority = formatCell(PRIORITY_HEADER, PRIORITY_WIDTH);
  const created = formatCell('Created', DATE_WIDTH);
  const project = formatCell(PROJECT_HEADER, widths.project);
  const context = formatCell(CONTEXT_HEADER, widths.context);
  const meta = formatCell(META_HEADER, widths.meta);
  return `${rowNumber} │ ${status} │ ${priority} │ ${created} │ ${project} │ ${context} │ ${meta} │ ${DESCRIPTION_HEADER}`;
};

const renderRowText = (row: TableRow, widths: TableColumnWidths): React.ReactNode => {
  const rowNumber = formatCell(String(row.task.item.lineNumber), ROW_NUMBER_WIDTH);
  const status = formatCell(labelByStatus[row.status], STATUS_WIDTH);
  const values = getRowCellValues(row);

  const priority = formatCell(values.priority, PRIORITY_WIDTH);
  const created = formatCell(values.created, DATE_WIDTH);
  const project = formatCell(values.project, widths.project);
  const context = formatCell(values.context, widths.context);
  const meta = formatCell(values.meta, widths.meta);

  return (
    <>
      {rowNumber} │ {status} │ {priority} │ {created} │ <Text color="blueBright">{project}</Text> │{' '}
      <Text color="magenta">{context}</Text> │ <Text color="yellow">{meta}</Text> │ {values.description}
    </>
  );
};

export const TableView = ({ rows, selectedIndex, scrollOffset, visibleCount }: TableViewProps) => {
  const widths = getColumnWidths(rows);
  const visibleRows = rows.slice(scrollOffset, scrollOffset + visibleCount);
  const headerText = renderHeaderText(widths);
  const headerDivider = renderHeaderDivider(widths);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Text bold>{headerText}</Text>
      <Text>{headerDivider}</Text>
      {visibleRows.length === 0 ? <Text dimColor>(empty)</Text> : null}
      {visibleRows.map((row, index) => {
        const absoluteIndex = scrollOffset + index;
        const isSelected = absoluteIndex === selectedIndex;

        return (
          <Text
            key={`${row.task.item.raw}`}
            wrap="truncate-end"
            {...(isSelected ? { backgroundColor: 'blue', color: 'white' } : {})}
          >
            {renderRowText(row, widths)}
          </Text>
        );
      })}
    </Box>
  );
};
