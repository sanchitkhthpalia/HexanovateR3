# Integrations setup

`POST /api/lead` writes each lead to a Google Sheet, upserts a HubSpot contact and emails a notification. Each integration is configured by environment variables (names in `.env.example`). Any integration without its variables is recorded as `not_configured` and skipped.

> **While testing, set `LEAD_NOTIFY_TO` to your own address.** Otherwise every test submission emails ai-labs@hexanovate.com. Remove it (or set it to ai-labs@hexanovate.com) for the final test and the submission.

Put the values in `.env.local` for local runs, and in **Vercel → Project → Settings → Environment Variables** (Production and Preview) for the deployed site. Redeploy after changing them.

---

## 1. Google Sheet (Apps Script web app)

1. Sign in to your **test** Google account and create a new Google Sheet, e.g. "KlearStack Leads".
2. In the sheet: **Extensions → Apps Script**.
3. Delete the sample code and paste all of `integrations/apps-script/Code.gs`. Save (⌘S).
4. Generate a secret in a terminal: `openssl rand -hex 32 | tr -d "\n" | pbcopy` (copies it without a trailing line break).
5. In the Apps Script editor: **Project Settings** (gear icon) → **Script properties** → **Add script property**:
   - Property: `SHARED_SECRET`
   - Value: the secret from step 4

   Save.
6. Back in **Editor**, choose the function `setupSheet` in the toolbar dropdown and click **Run**.
   - Google asks for authorisation: **Review permissions** → choose your account → **Advanced** → **Go to (project) (unsafe)** → **Allow**. This is your own script.
   - The sheet now has a `Leads` tab with bold, frozen headers.
7. **Deploy → New deployment**:
   - Gear next to "Select type" → **Web app**
   - Description: `KlearStack leads v1`
   - Execute as: **Me**
   - Who has access: **Anyone** (the shared secret is what protects it; the URL alone does nothing)
   - **Deploy**, then copy the **Web app URL** (it ends in `/exec`).
8. Set:
   - `SHEETS_WEBHOOK_URL` = the web app URL
   - `SHEETS_WEBHOOK_SECRET` = the secret from step 4

If you change `Code.gs` later: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same.

---

## 2. HubSpot service key (contacts read/write only)

New HubSpot accounts no longer offer private ("legacy") apps. Service keys replace them, and are sent the same way (`Authorization: Bearer …`).

1. Create or sign in to a **free HubSpot** account (a test portal, not a client's).
2. **Development → Keys → Service Keys → Create a service key.** (Older portals: Settings → Integrations → Private Apps also works; the token is used the same way.)
3. Name it `KlearStack website` and add **only** these scopes:
   - `crm.objects.contacts.read` (upsert looks the contact up by email)
   - `crm.objects.contacts.write`
4. **Create**, then copy the key straight away.
5. Set `HUBSPOT_TOKEN` = the key.

What gets written, all standard contact properties (no custom properties to create):

| Form | HubSpot property |
|---|---|
| Name | `firstname` + `lastname` (split on the first space) |
| Email ID | `email` (upsert key: resubmitting updates the same contact) |
| Contact no. | `phone` (E.164, e.g. +919876543210) |
| Country code | `country` |
| Solution, No. of documents, Pain point | `message` (one readable block) |
| — | `lifecyclestage = lead`, `hs_lead_status = NEW` |

If a token leaks, it can read and edit contacts in that portal only. Revoke or rotate it on the same screen.

---

## 3. Email sender (Gmail SMTP with an app password)

Resend isn't used: without a verified domain it only delivers to the account owner, not to ai-labs@hexanovate.com.

1. Use a **test Gmail account** (the same one as the sheet is fine).
2. Turn on **2-Step Verification**: https://myaccount.google.com/security → 2-Step Verification. App passwords require it.
3. Create an app password at https://myaccount.google.com/apppasswords:
   - App name: `KlearStack Vercel` → **Create**
   - Copy the 16-character password (spaces don't matter)
4. Set:
   - `GMAIL_USER` = the Gmail address
   - `GMAIL_APP_PASSWORD` = the app password
   - `LEAD_NOTIFY_TO` = your own address while testing (leave empty for ai-labs@hexanovate.com)
5. Send a test lead and check the inbox, **and the spam folder** for the first messages.

Gmail limits: about 500 messages a day, which is plenty here. Revoking the app password stops sending immediately.

---

## 4. Verify end to end

1. Redeploy on Vercel after setting the variables.
2. Submit the live form with a non-free email (any company domain; it doesn't need to exist for the sheet or CRM).
3. Check:
   - **Sheet:** a new row, with `crm_status = ok`, `email_status = ok` and a HubSpot contact ID.
   - **HubSpot → Contacts:** the contact, with the `message` filled in.
   - **Inbox:** the notification.
4. If a status says `failed`: Vercel → Project → **Logs**, filter `[lead]`. The log names the provider and HTTP status, with no personal data.
