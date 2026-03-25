import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Common Drizzle Database client for @orbit/database.
 */
export const createDbClient = (connectionString: string) => {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
};

export * from './schema';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
export * from 'drizzle-orm';
