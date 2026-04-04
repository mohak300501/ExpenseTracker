import * as SQLite from 'expo-sqlite';

export const initDB = async () => {
    const db = await SQLite.openDatabaseAsync('expenses.db');
    
    // Transactions table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Transactions (
            id TEXT PRIMARY KEY NOT NULL,
            bank_name TEXT,
            account_number TEXT,
            type TEXT,
            amount REAL,
            date INTEGER,
            raw_message TEXT
        );
    `);

    // AppSettings table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS AppSettings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT
        );
    `);

    // Initialize default time if not exists
    await db.runAsync(`INSERT OR IGNORE INTO AppSettings (key, value) VALUES ('notification_time', '21:00')`);
    await db.runAsync(`INSERT OR IGNORE INTO AppSettings (key, value) VALUES ('last_sync_timestamp', '0')`);
    
    return db;
};

export const getDB = async () => {
    return await SQLite.openDatabaseAsync('expenses.db');
};

export interface Transaction {
    id: string;
    bank_name: string;
    account_number: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    date: number;
    raw_message: string;
}

export const insertTransaction = async (tx: Transaction) => {
    const db = await getDB();
    await db.runAsync(
        'INSERT OR IGNORE INTO Transactions (id, bank_name, account_number, type, amount, date, raw_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
        tx.id, tx.bank_name, tx.account_number, tx.type, tx.amount, tx.date, tx.raw_message
    );
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
    const db = await getDB();
    const allRows = await db.getAllAsync<Transaction>('SELECT * FROM Transactions ORDER BY date DESC');
    return allRows;
};

export const getSetting = async (key: string): Promise<string | null> => {
    const db = await getDB();
    const row = await db.getFirstAsync<{value: string}>('SELECT value FROM AppSettings WHERE key = ?', key);
    return row ? row.value : null;
};

export const setSetting = async (key: string, value: string) => {
    const db = await getDB();
    await db.runAsync('INSERT OR REPLACE INTO AppSettings (key, value) VALUES (?, ?)', key, value);
};

export const clearAllData = async () => {
    const db = await getDB();
    await db.execAsync('DELETE FROM Transactions;');
};
