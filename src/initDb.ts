import { openDb } from './database';

async function createTables() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      street TEXT NOT NULL,
      number TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      cep TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    )
  `);
  console.log('Tables created');
}

createTables();