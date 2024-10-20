import { openDb } from './database';

async function getStoresByCep(cep: any): Promise<any[]> {
  const db = await openDb();
  return db.all('SELECT * FROM stores WHERE cep = ?', [cep]);
}

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