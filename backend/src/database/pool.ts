import { Pool, type PoolConfig } from 'pg'
import { getConfig } from '../config.js'

export function createPool(connectionString = getConfig().DATABASE_URL): Pool { return new Pool({ connectionString }) }
export type Database = Pick<Pool, 'query' | 'connect' | 'end'>
