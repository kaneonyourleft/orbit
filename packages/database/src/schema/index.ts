import { pgTable, text, uuid, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

/**
 * Workspace is the top-level container for all projects and data.
 */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Table stores the definition of a data collection.
 */
export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Field defines a column in a table.
 */
export const fields = pgTable('fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id')
    .references(() => tables.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['text', 'number', 'select', 'multi-select', 'date', 'checkbox', 'attachment', 'formula', 'link'] }).notNull(),
  options: jsonb('options').$type<{
    choices?: { label: string; color: string }[];
    formula?: string;
    linkedTableId?: string;
  }>(),
  order: integer('order').default(0).notNull(),
});

/**
 * Row stores the actual record data.
 */
export const rows = pgTable('rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id')
    .references(() => tables.id, { onDelete: 'cascade' })
    .notNull(),
  data: jsonb('data').$type<Record<string, any>>().notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
