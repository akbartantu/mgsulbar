import { google } from 'googleapis';

const SHEETS_NAMES = {
  USERS: 'Users',
  LETTERS: 'Letters',
  TEMPLATES: 'Templates',
  AWARDEES: 'Awardees',
  PROGRAMS: 'Programs',
  MEMBERS: 'Members',
  TRANSACTIONS: 'Transactions',
  PERIODS: 'Periods',
  DEPARTMENTS: 'Departments',
};

let sheetsClient = null;

function getCredentials() {
  const raw = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const creds = getCredentials();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!creds || !spreadsheetId) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  sheetsClient = { sheets, spreadsheetId };
  return sheetsClient;
}

export async function ensureSheets(client) {
  if (!client) return;
  const { sheets, spreadsheetId } = client;
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = (res.data.sheets || []).map((s) => s.properties?.title).filter(Boolean);
  const allSheetNames = [
    SHEETS_NAMES.USERS,
    SHEETS_NAMES.LETTERS,
    SHEETS_NAMES.TEMPLATES,
    SHEETS_NAMES.AWARDEES,
    SHEETS_NAMES.PROGRAMS,
    SHEETS_NAMES.MEMBERS,
    SHEETS_NAMES.TRANSACTIONS,
    SHEETS_NAMES.PERIODS,
    SHEETS_NAMES.DEPARTMENTS,
  ];
  const needed = allSheetNames.filter((n) => !existing.includes(n));

  if (needed.length > 0) {
    const requests = needed.map((title) => ({
      addSheet: { properties: { title } },
    }));
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

    const usersHeaders = ['id', 'name', 'email', 'role', 'passwordHash', 'status', 'approvedAt', 'approvedById'];
    const lettersHeaders = [
      'id', 'referenceNumber', 'type', 'subject', 'content', 'status', 'priority', 'classification',
      'from', 'to', 'createdAt', 'updatedAt', 'createdBy', 'sentAt', 'receivedAt', 'dueDate',
      'eventDate', 'eventWaktu', 'eventLocation', 'eventAcara', 'dispositionNote', 'attachments', 'approvalSteps', 'statusHistory',
      'cc', 'signatures', 'forwardedTo', 'fromDepartment', 'contentJustification', 'lineHeight', 'letterSpacing', 'fontFamily', 'fontSize',
    ];
    const templatesHeaders = ['id', 'name', 'kind', 'subjectTemplate', 'contentTemplate', 'category', 'description'];
    const awardeesHeaders = ['id', 'name', 'university', 'major', 'year', 'status'];
    const programsHeaders = ['id', 'name', 'department', 'status', 'progress', 'startDate', 'endDate', 'pic'];
    const membersHeaders = ['id', 'userId', 'periodId', 'name', 'role', 'department', 'email', 'status'];
    const transactionsHeaders = ['id', 'description', 'amount', 'date', 'category'];
    const periodsHeaders = ['id', 'name', 'startDate', 'endDate', 'isActive'];
    const departmentsHeaders = ['id', 'name', 'periodId', 'sortOrder'];

    const headerMap = {
      [SHEETS_NAMES.USERS]: usersHeaders,
      [SHEETS_NAMES.LETTERS]: lettersHeaders,
      [SHEETS_NAMES.TEMPLATES]: templatesHeaders,
      [SHEETS_NAMES.AWARDEES]: awardeesHeaders,
      [SHEETS_NAMES.PROGRAMS]: programsHeaders,
      [SHEETS_NAMES.MEMBERS]: membersHeaders,
      [SHEETS_NAMES.TRANSACTIONS]: transactionsHeaders,
      [SHEETS_NAMES.PERIODS]: periodsHeaders,
      [SHEETS_NAMES.DEPARTMENTS]: departmentsHeaders,
    };

    for (const title of needed) {
      const values = [headerMap[title] || templatesHeaders];
      const range = `'${title}'!A1`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
  }

  const defaultTemplateRows = [
    ['t1', 'Permohonan Resmi', 'surat', 'Perihal: [isi perihal surat]', 'Dengan hormat,\n\n[Paragraf pembuka – uraian singkat maksud surat.]\n\n[Paragraf isi – rincian atau permohonan.]\n\nDemikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih.\n\nHormat kami,\n[Penandatangan]', 'Permohonan Resmi', 'Template untuk surat permohonan resmi kepada instansi atau pihak lain'],
    ['t2', 'Pemberitahuan', 'surat', 'Pemberitahuan: [judul]', 'Dengan hormat,\n\nBerikut kami sampaikan pemberitahuan mengenai [uraian].\n\nDemikian disampaikan.', 'Permohonan Resmi', 'Template untuk surat pemberitahuan resmi'],
    ['t3', 'Undangan Rapat', 'surat', 'Undangan: [nama acara]', 'Dengan hormat,\n\nKami mengundang Bapak/Ibu untuk hadir dalam [nama acara] pada [waktu dan tempat].\n\nDemikian undangan ini disampaikan.', 'Permohonan Resmi', 'Template untuk undangan rapat atau acara'],
    ['t4', 'Nota Internal', 'surat', 'Nota: [perihal]', '[Isi nota internal]', 'Internal', 'Template internal organisasi'],
    ['t5', 'Proposal', 'proposal', 'Judul Proposal', '{"latarBelakang":"","tujuan":"","anggaran":"","timeline":""}', 'Proposal', 'Proposal kegiatan atau anggaran'],
  ];

  if (needed.includes(SHEETS_NAMES.TEMPLATES)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEETS_NAMES.TEMPLATES}'!A2:G6`,
      valueInputOption: 'RAW',
      requestBody: { values: defaultTemplateRows },
    });
  }

  const defaultPeriodRows = [['p1', 'Kepengurusan 2024-2026', '2024-01-01', '2026-12-31', 'true']];
  if (needed.includes(SHEETS_NAMES.PERIODS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEETS_NAMES.PERIODS}'!A2:E2`,
      valueInputOption: 'RAW',
      requestBody: { values: defaultPeriodRows },
    });
  }

  const defaultDepartmentRows = [
    ['d1', 'Pengurus Inti', 'p1', '1'],
    ['d2', 'Divisi Pendidikan', 'p1', '2'],
    ['d3', 'Divisi Sosial', 'p1', '3'],
    ['d4', 'Divisi Keuangan', 'p1', '4'],
  ];
  if (needed.includes(SHEETS_NAMES.DEPARTMENTS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEETS_NAMES.DEPARTMENTS}'!A2:D5`,
      valueInputOption: 'RAW',
      requestBody: { values: defaultDepartmentRows },
    });
  }

  if (needed.length > 0) {
    return;
  }

  // Patch existing Programs sheet: add department header if missing
  if (existing.includes(SHEETS_NAMES.PROGRAMS)) {
    const progRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS_NAMES.PROGRAMS}'!A1:Z1`,
    });
    const progHeaders = (progRes.data.values || [])[0] || [];
    if (progHeaders.indexOf('department') === -1) {
      const newProgHeaders = [...progHeaders, 'department'];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEETS_NAMES.PROGRAMS}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [newProgHeaders] },
      });
    }
  }

  // Patch existing Members sheet: add userId and periodId in standard order; migrate existing rows
  if (existing.includes(SHEETS_NAMES.MEMBERS)) {
    const memRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS_NAMES.MEMBERS}'!A1:H100`,
    });
    const allRows = (memRes.data.values || []) || [];
    const memHeaders = allRows[0] || [];
    const hasUserId = memHeaders.indexOf('userId') !== -1;
    const hasPeriodId = memHeaders.indexOf('periodId') !== -1;
    if (!hasUserId || !hasPeriodId) {
      const newHeaders = ['id', 'userId', 'periodId', 'name', 'role', 'department', 'email', 'status'];
      const dataRows = allRows.slice(1);
      const migrated = dataRows.map((row) => {
        if (row.length >= 8) return row.slice(0, 8);
        if (row.length === 6) return [row[0], '', '', row[1], row[2], row[3], row[4], row[5]];
        const padded = [...row];
        while (padded.length < 8) padded.push('');
        return padded.slice(0, 8);
      });
      const values = [newHeaders, ...migrated];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEETS_NAMES.MEMBERS}'!A1:H${values.length}`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
  }

  // Patch existing Letters sheet: add fromDepartment, contentJustification headers if missing
  if (existing.includes(SHEETS_NAMES.LETTERS)) {
    const letterRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS_NAMES.LETTERS}'!A1:Z1`,
    });
    const letterHeaders = (letterRes.data.values || [])[0] || [];
    let changed = false;
    if (letterHeaders.indexOf('fromDepartment') === -1) {
      letterHeaders.push('fromDepartment');
      changed = true;
    }
    if (letterHeaders.indexOf('contentJustification') === -1) {
      letterHeaders.push('contentJustification');
      changed = true;
    }
    if (letterHeaders.indexOf('lineHeight') === -1) {
      letterHeaders.push('lineHeight');
      changed = true;
    }
    if (letterHeaders.indexOf('letterSpacing') === -1) {
      letterHeaders.push('letterSpacing');
      changed = true;
    }
    if (letterHeaders.indexOf('fontFamily') === -1) {
      letterHeaders.push('fontFamily');
      changed = true;
    }
    if (letterHeaders.indexOf('fontSize') === -1) {
      letterHeaders.push('fontSize');
      changed = true;
    }
    if (changed) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEETS_NAMES.LETTERS}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [letterHeaders] },
      });
    }
  }

  // Patch existing Templates sheet if first row has empty subject/content (so existing deploys get defaults)
  if (existing.includes(SHEETS_NAMES.TEMPLATES)) {
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS_NAMES.TEMPLATES}'!A1:G10`,
    });
    const allRows = getRes.data.values || [];
    const headers = allRows[0] || [];
    const firstDataRow = allRows[1] || [];
    const subjectTemplate = (firstDataRow[3] ?? '').toString().trim();
    const contentTemplate = (firstDataRow[4] ?? '').toString().trim();
    if (subjectTemplate === '' && contentTemplate === '') {
      const templatesHeaders = ['id', 'name', 'kind', 'subjectTemplate', 'contentTemplate', 'category', 'description'];
      if (headers.length < 7) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${SHEETS_NAMES.TEMPLATES}'!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [templatesHeaders] },
        });
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEETS_NAMES.TEMPLATES}'!A2:G6`,
        valueInputOption: 'RAW',
        requestBody: { values: defaultTemplateRows },
      });
    }
  }
}

/** True if the error is Google Sheets rate limit (429). */
export function isSheetsRateLimitError(err) {
  const code = err?.code ?? err?.response?.status;
  return code === 429;
}

async function readAllOnce(client, sheetName) {
  const { sheets, spreadsheetId } = client;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A:AZ`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj;
  });
}

export async function readAll(client, sheetName) {
  if (!client) return [];
  try {
    return await readAllOnce(client, sheetName);
  } catch (err) {
    if (isSheetsRateLimitError(err)) {
      await new Promise((r) => setTimeout(r, 2500));
      return await readAllOnce(client, sheetName);
    }
    throw err;
  }
}

export async function appendRow(client, sheetName, headers, rowObj) {
  if (!client) return;
  const { sheets, spreadsheetId } = client;
  const row = headers.map((h) => rowObj[h] ?? '');
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'!A:AZ`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

export async function updateRowByIndex(client, sheetName, rowIndex, headers, rowObj) {
  if (!client) return;
  const { sheets, spreadsheetId } = client;
  const row = headers.map((h) => rowObj[h] ?? '');
  const range = `'${sheetName}'!A${rowIndex + 2}:AZ${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

export { SHEETS_NAMES };
