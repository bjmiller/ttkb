import React from 'react';
import { Box, Text } from 'ink';

import type { ColumnKey } from '../logic/columns';
import type { TableRow, TableSortColumn } from '../logic/tableTypes';
import {
  formatContexts,
  formatDoneCallout,
  formatMeta,
  formatPrimaryLine,
  formatProjects
} from '../logic/taskFormatting';

type TableViewProps = {
  rows: TableRow[];
  selectedIndex: number;
  scrollOffset: number;
  visibleCount: number;
  sort?: {
    column: TableSortColumn;
    direction: 'asc' | 'desc';
  };
};

type SortColumn = TableSortColumn;

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
const SORT_ARROW_PADDING = 1;
const SORT_ARROW_UP = '\u{f176}';
const SORT_ARROW_DOWN = '\u{f175}';

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

type PreparedRow = {
  key: string;
  content: React.ReactNode;
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
  const descriptionValue = formatPrimaryLine(item);
  const doneCallout = formatDoneCallout(item);

  return {
    priority: item.priority ?? '-',
    created: item.creationDate ?? '-',
    project: item.projects.length > 0 ? formatProjects(item.projects) : '-',
    context: item.contexts.length > 0 ? formatContexts(item.contexts) : '-',
    meta: item.metadata.length > 0 ? formatMeta(item.metadata) : '-',
    description: doneCallout ? `${descriptionValue} ${doneCallout}` : descriptionValue
  };
};

const getColumnWidths = (rows: TableRow[], sort: TableViewProps['sort']): TableColumnWidths => {
  const minProjectWidth = PROJECT_HEADER.length + (sort?.column === 'project' ? SORT_ARROW_PADDING : 0);
  const minContextWidth = CONTEXT_HEADER.length + (sort?.column === 'context' ? SORT_ARROW_PADDING : 0);
  const minMetaWidth = META_HEADER.length + (sort?.column === 'meta' ? SORT_ARROW_PADDING : 0);

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
      project: minProjectWidth,
      context: minContextWidth,
      meta: minMetaWidth
    }
  );
};

const renderHeaderDivider = (widths: TableColumnWidths, sort: TableViewProps['sort']): string => {
  const descriptionWidth = DESCRIPTION_HEADER.length + (sort?.column === 'description' ? SORT_ARROW_PADDING : 0);
  const rowNumber = '─'.repeat(ROW_NUMBER_WIDTH);
  const status = '─'.repeat(STATUS_WIDTH);
  const priority = '─'.repeat(PRIORITY_WIDTH);
  const created = '─'.repeat(DATE_WIDTH);
  const project = '─'.repeat(widths.project);
  const context = '─'.repeat(widths.context);
  const meta = '─'.repeat(widths.meta);
  const description = '─'.repeat(descriptionWidth);
  return `${rowNumber}─┼─${status}─┼─${priority}─┼─${created}─┼─${project}─┼─${context}─┼─${meta}─┼─${description}`;
};

const getSortArrow = (sort: TableViewProps['sort'], column: SortColumn): string | undefined => {
  if (!sort || sort.column !== column) {
    return undefined;
  }

  return sort.direction === 'asc' ? SORT_ARROW_UP : SORT_ARROW_DOWN;
};

const renderHeaderCell = (params: {
  label: string;
  width: number;
  sort: TableViewProps['sort'];
  column: SortColumn;
}): React.ReactNode => {
  const base = formatCell(params.label, params.width);
  const arrow = getSortArrow(params.sort, params.column);

  if (!arrow || params.label.length >= params.width) {
    return base;
  }

  const left = base.slice(0, params.label.length);
  const right = base.slice(params.label.length + 1);

  return (
    <>
      {left}
      <Text color="red">{arrow}</Text>
      {right}
    </>
  );
};

const renderHeaderText = (widths: TableColumnWidths, sort: TableViewProps['sort']): React.ReactNode => {
  const descriptionWidth = DESCRIPTION_HEADER.length + (sort?.column === 'description' ? SORT_ARROW_PADDING : 0);
  const rowNumber = formatCell('#', ROW_NUMBER_WIDTH);
  const status = renderHeaderCell({ label: 'Status', width: STATUS_WIDTH, sort, column: 'status' });
  const priority = renderHeaderCell({ label: PRIORITY_HEADER, width: PRIORITY_WIDTH, sort, column: 'priority' });
  const created = renderHeaderCell({ label: 'Created', width: DATE_WIDTH, sort, column: 'created' });
  const project = renderHeaderCell({ label: PROJECT_HEADER, width: widths.project, sort, column: 'project' });
  const context = renderHeaderCell({ label: CONTEXT_HEADER, width: widths.context, sort, column: 'context' });
  const meta = renderHeaderCell({ label: META_HEADER, width: widths.meta, sort, column: 'meta' });
  const description = renderHeaderCell({
    label: DESCRIPTION_HEADER,
    width: descriptionWidth,
    sort,
    column: 'description'
  });

  return (
    <>
      {rowNumber} │ {status} │ {priority} │ {created} │ {project} │ {context} │ {meta} │ {description}
    </>
  );
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

type TableRowLineProps = {
  rowKey: string;
  selected: boolean;
  content: React.ReactNode;
};

const TableRowLineComponent = ({ rowKey, selected, content }: TableRowLineProps) => {
  return (
    <Text key={rowKey} wrap="truncate-end" {...(selected ? { backgroundColor: 'blue', color: 'white' } : {})}>
      {content}
    </Text>
  );
};

const TableRowLine = React.memo(TableRowLineComponent, (prev, next) => {
  return prev.rowKey === next.rowKey && prev.selected === next.selected && prev.content === next.content;
});

TableRowLine.displayName = 'TableRowLine';

export const TableView = ({ rows, selectedIndex, scrollOffset, visibleCount, sort }: TableViewProps) => {
  const widths = React.useMemo(() => getColumnWidths(rows, sort), [rows, sort]);
  const preparedRows = React.useMemo<PreparedRow[]>(() => {
    return rows.map((row) => ({
      key: `${row.task.item.lineNumber}-${row.status}`,
      content: renderRowText(row, widths)
    }));
  }, [rows, widths]);
  const visibleRows = React.useMemo(
    () => preparedRows.slice(scrollOffset, scrollOffset + visibleCount),
    [preparedRows, scrollOffset, visibleCount]
  );
  const headerText = React.useMemo(() => renderHeaderText(widths, sort), [widths, sort]);
  const headerDivider = React.useMemo(() => renderHeaderDivider(widths, sort), [widths, sort]);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Text bold>{headerText}</Text>
      <Text>{headerDivider}</Text>
      {visibleRows.length === 0 ? <Text dimColor>(empty)</Text> : null}
      {visibleRows.map((row, index) => {
        const absoluteIndex = scrollOffset + index;
        const isSelected = absoluteIndex === selectedIndex;

        return <TableRowLine key={row.key} rowKey={row.key} selected={isSelected} content={row.content} />;
      })}
    </Box>
  );
};
