/**
 * Orbit core domain types & interfaces.
 */

export type FieldType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox' | 'attachment' | 'formula' | 'link';

export interface OrbitField {
  id: string;
  name: string;
  type: FieldType;
  options?: Record<string, any>;
  order: number;
}

export interface OrbitTable {
  id: string;
  name: string;
  description?: string;
  fields: OrbitField[];
  rows: Record<string, any>[];
}

export interface OrbitWorkspace {
  id: string;
  name: string;
  slug: string;
  tables: OrbitTable[];
}
