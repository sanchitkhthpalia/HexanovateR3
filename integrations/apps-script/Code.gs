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
 *   { secret, action: "busy", from, to }                 → { ok, busy: [{ start, end }] }  (ISO times)
 *   { secret, action: "book", id, name, email, start, end } → creates the event, invites the lead
 * Calendar = the script owner's default Google Calendar (CalendarApp). After adding the calendar
 * actions, run setupSheet once from the editor to grant calendar access, then deploy a new version.
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
  'Meeting (IST)',
  'Calendar event ID',
];
const MEETING_TITLE = 'KlearStack demo';
const MAX_MEETING_MS = 60 * 60 * 1000;
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
    if (body.action === 'busy') return busy(body);
    if (body.action === 'book') return book(sheet, body);
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
  const r = findLeadRow(sheet, body.id);
  if (!r) return json({ ok: false, error: 'not_found' });
  sheet.getRange(r, COL['crm_status']).setValue(safeCell(body.crmStatus));
  sheet.getRange(r, COL['email_status']).setValue(safeCell(body.emailStatus));
  if (body.crmContactId) sheet.getRange(r, COL['HubSpot contact ID']).setValue(safeCell(body.crmContactId));
  return json({ ok: true });
}

/** Row number of a lead (robust even if rows are sorted or inserted by hand), or 0. */
function findLeadRow(sheet, id) {
  if (sheet.getLastRow() < 2) return 0;
  const match = sheet
    .getRange(2, COL['Lead ID'], sheet.getLastRow() - 1, 1)
    .createTextFinder(String(id))
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

/** Timed events between two times that block the calendar (all-day and declined events don't). */
function blockingEvents(from, to) {
  return CalendarApp.getDefaultCalendar()
    .getEvents(from, to)
    .filter(function (ev) {
      return !ev.isAllDayEvent() && ev.getMyStatus() !== CalendarApp.GuestStatus.NO;
    });
}

function busy(body) {
  const from = new Date(body.from);
  const to = new Date(body.to);
  if (isNaN(from) || isNaN(to) || to <= from || to - from > 31 * 24 * 60 * 60 * 1000) {
    return json({ ok: false, error: 'bad_range' });
  }
  const list = blockingEvents(from, to).map(function (ev) {
    return { start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString() };
  });
  return json({ ok: true, busy: list });
}

function book(sheet, body) {
  const start = new Date(body.start);
  const end = new Date(body.end);
  const email = String(body.email || '');
  if (!body.id || isNaN(start) || isNaN(end) || end <= start || end - start > MAX_MEETING_MS || !/^[^@\s]+@[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'bad_request' });
  }
  // Runs under the script lock (doPost), so the checks and the insert can't interleave.
  const row = findLeadRow(sheet, body.id);
  if (row && sheet.getRange(row, COL['Calendar event ID']).getValue()) return json({ ok: false, error: 'already_booked' });
  if (blockingEvents(start, end).length) return json({ ok: false, error: 'slot_taken' });

  const name = String(body.name || '').slice(0, 80);
  const event = CalendarApp.getDefaultCalendar().createEvent(MEETING_TITLE + ' – ' + name, start, end, {
    description:
      'Free live demo booked from the KlearStack website.\n\nName: ' + name + '\nEmail: ' + email + '\nLead ID: ' + body.id,
    guests: email,
    sendInvites: true,
  });
  if (row) {
    sheet.getRange(row, COL['Meeting (IST)']).setValue(Utilities.formatDate(start, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm'));
    sheet.getRange(row, COL['Calendar event ID']).setValue(event.getId());
  }
  return json({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  // Write the header row on first use, and again if columns were added since (e.g. the meeting columns).
  const header = sheet.getRange(1, 1, 1, HEADERS.length);
  if (header.getValues()[0].join('|') !== HEADERS.join('|')) {
    header.setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
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

/** Run once from the editor: creates the sheet and headers, and asks for Sheets + Calendar access. */
function setupSheet() {
  getSheet();
  console.log('Calendar: ' + CalendarApp.getDefaultCalendar().getName());
}
