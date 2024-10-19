import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export async function openDb(): Promise<Database> {
  return open({
    filename: './database.db',
    driver: sqlite3.Database
  });
}