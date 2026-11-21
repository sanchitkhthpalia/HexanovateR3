/**
 * KlearStack leads → Google Sheet. Deployed as a web app; called only by POST /api/lead.
 *
 * Setup (full steps: docs/integrations-setup.md):
 *   Project Settings → Script properties → SHARED_SECRET = same value as SHEETS_WEBHOOK_SECRET in Vercel.
 *   Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *
 * Requests (JSON body, Content-Type text/plain):
 *   { secret, action: "append", lead: { id, submittedAt, name, email, phone, country, solution,
 *     documents, painPoint, source, userAgent, crmStatus, emailStatus } }
 *   { secret, action: "update", id, crmStatus, emailStatus, crmContactId? }
 * Responses: { ok: true } or { ok: false, error: "<code>" } (no details leaked).
 */

const SHEET_NAME = 'Leads';
const HEADERS = [
  'Timestamp (IST)',
  'Lead ID',
  'Name',
  'Work email',
  'Phone',
  'Country',
  'Solution required',
  'Documents per month',
  'Pain point & expectations',
  'crm_status',
  'email_status',
  'HubSpot contact ID',
  'Source',
  'User agent',
  'Submitted at (UTC, ISO)',
];
const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i + 1]));

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'bad_json' });
  }

  // Trimmed on both sides: a secret copied from a terminal often carries a trailing newline.
  const secret = String(PropertiesService.getScriptProperties().getProperty('SHARED_SECRET') || '').trim();
  if (!secret) return json({ ok: false, error: 'secret_not_set' });
  if (String(body.secret || '').trim() !== secret) return json({ ok: false, error: 'unauthorized' });

  // Serialise writes so concurrent submissions can't interleave rows.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json({ ok: false, error: 'busy' });
  try {
    const sheet = getSheet();
    if (body.action === 'append') return append(sheet, body.lead || {});
    if (body.action === 'update') return update(sheet, body);
    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    console.error(err); // visible in Apps Script → Executions; not returned to the caller
    return json({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

function append(sheet, lead) {
  if (!lead.id) return json({ ok: false, error: 'missing_id' });
  const row = [
    Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss'),
    lead.id,
    lead.name,
    lead.email,
    lead.phone,
    lead.country,
    lead.solution,
    lead.documents,
    lead.painPoint,
    lead.crmStatus || 'pending',
    lead.emailStatus || 'pending',
    '',
    lead.source,
    lead.userAgent,
    lead.submittedAt,
  ].map(safeCell);
  sheet.appendRow(row);
  return json({ ok: true });
}

function update(sheet, body) {
  if (!body.id) return json({ ok: false, error: 'missing_id' });
  // Find the row by lead id (robust even if rows are sorted or inserted by hand).
  const match = sheet
    .getRange(2, COL['Lead ID'], Math.max(sheet.getLastRow() - 1, 1), 1)
    .createTextFinder(String(body.id))
    .matchEntireCell(true)
    .findNext();
  if (!match) return json({ ok: false, error: 'not_found' });
  const r = match.getRow();
  sheet.getRange(r, COL['crm_status']).setValue(safeCell(body.crmStatus));
  sheet.getRange(r, COL['email_status']).setValue(safeCell(body.emailStatus));
  if (body.crmContactId) sheet.getRange(r, COL['HubSpot contact ID']).setValue(safeCell(body.crmContactId));
  return json({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

/**
 * Stops spreadsheet formula injection: a value starting with = + - @ (e.g. "=HYPERLINK(...)" typed
 * into the form, or an E.164 phone number) is stored as plain text.
 */
function safeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value).slice(0, 5000);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to check the sheet and headers are created. */
function setupSheet() {
  getSheet();
}
