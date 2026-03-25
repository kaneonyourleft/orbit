import { createDbClient } from './index';
import { workspaces, tables, fields, rows } from './schema';

/**
 * Seed initial data to Supabase database.
 */
export const seed = async (connectionString: string) => {
  const db = createDbClient(connectionString);

  console.log('🌱 Seeding ORBIT Work OS...');

  // 1. Create Workspace
  const [ws] = await db.insert(workspaces).values({
    name: 'ORBIT Main Workspace',
    slug: 'orbit-main',
  }).returning();

  // 2. Create Board (Table)
  const [table] = await db.insert(tables).values({
    workspaceId: ws.id,
    name: 'Roadmap 2026',
    description: 'Core product development roadmap.',
  }).returning();

  // 3. Create Fields
  const [f1, f2, f3] = await db.insert(fields).values([
    { tableId: table.id, name: 'Task', type: 'text', order: 1 },
    { tableId: table.id, name: 'Status', type: 'select', order: 2 },
    { tableId: table.id, name: 'Progress', type: 'number', order: 3 },
  ]).returning();

  // 4. Create Rows
  await db.insert(rows).values([
    { tableId: table.id, data: { [f1.id]: 'Monorepo Setup', [f2.id]: 'Done', [f3.id]: 100 }, order: 1 },
    { tableId: table.id, data: { [f1.id]: 'Data Engine Implementation', [f2.id]: 'In Progress', [f3.id]: 60 }, order: 2 },
  ]);

  console.log('✅ Seeding complete!');
};
