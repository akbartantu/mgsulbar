import { getSheetsClient, readAll, SHEETS_NAMES } from '../sheets.js';

export async function getTemplates() {
  const client = await getSheetsClient();
  if (!client) return [];
  const rows = await readAll(client, SHEETS_NAMES.TEMPLATES);
  return rows.map((r) => ({
    id: r.id || '',
    name: r.name || '',
    kind: r.kind || 'surat',
    subjectTemplate: r.subjectTemplate || '',
    contentTemplate: r.contentTemplate || '',
    category: r.category || '',
    description: r.description || '',
  }));
}
