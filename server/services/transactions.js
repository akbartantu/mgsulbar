import { getSheetsClient, readAll, ensureSheets, appendRow, SHEETS_NAMES } from '../sheets.js';

const TRANSACTION_HEADERS = ['id', 'description', 'amount', 'date', 'category'];

function rowToTransaction(row) {
  const amount = row.amount !== '' && row.amount !== undefined ? Number(row.amount) : 0;
  return {
    id: row.id ?? '',
    description: row.description ?? '',
    amount: Number.isNaN(amount) ? 0 : amount,
    date: row.date ?? '',
    category: row.category ?? '',
  };
}

export async function getTransactions() {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.TRANSACTIONS);
  return rows.map(rowToTransaction).filter((t) => t.id !== '');
}

export async function createTransaction(transaction) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const row = {
    id: transaction.id ?? '',
    description: transaction.description ?? '',
    amount: transaction.amount ?? 0,
    date: transaction.date ?? '',
    category: transaction.category ?? '',
  };
  await appendRow(client, SHEETS_NAMES.TRANSACTIONS, TRANSACTION_HEADERS, row);
  return rowToTransaction(row);
}
