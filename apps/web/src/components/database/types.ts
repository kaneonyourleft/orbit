export type ColumnType = 'text' | 'number' | 'select' | 'multiSelect' | 'date' | 'checkbox' | 'url' | 'person' | 'formula' | 'progress';

export interface DBColumn {
  id: string;
  name: string;
  type: ColumnType;
  width: number;
  options?: string[];        // select / multiSelect용
  formula?: string;          // formula용
}

export interface DBView {
  id: string;
  name: string;
  type: 'table' | 'kanban' | 'calendar' | 'gallery';
  filters: DBFilter[];
  sorts: DBSort[];
  groupByColumn?: string;    // kanban용
  dateColumn?: string;       // calendar용
}

export interface DBFilter {
  columnId: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty';
  value: string;
}

export interface DBSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface DBRow {
  id: string;
  database_id: string;
  cells: Record<string, any>;
  sort_order: number;
}

export interface Database {
  id: string;
  page_id: string;
  block_id: string;
  name: string;
  columns: DBColumn[];
  views: DBView[];
}
