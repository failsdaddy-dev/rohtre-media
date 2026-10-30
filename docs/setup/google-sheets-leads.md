# Website leads → Google Sheet (optional)

Every website enquiry (Contact page and landing page forms) is saved in Supabase first; the admin panel shows it. This adds a copy of each one to a Google Sheet. If it isn't set up, or Google is down, nothing breaks: the lead is still in Supabase.

## 1. Make the sheet

1. Open https://sheets.new and name the file **RohTre website leads**.
2. Put these headers in row 1, from A1 to the right:

   `created_at | name | phone | email | interest | business_type | website | ad_spend_range | message | page_path | utm_source | utm_medium | utm_campaign | utm_term | utm_content | gclid | fbclid | referrer | id`

## 2. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Delete what's there and paste:

```js
// Receives website leads from rohtremedia.com and adds one row per lead.
const SECRET = "PASTE-THE-SAME-SECRET-AS-LEADS_SHEET_SECRET";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) {
    return ContentService.createTextOutput("forbidden");
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map((h) => (data[h] === undefined || data[h] === null ? "" : String(data[h]))));
  return ContentService.createTextOutput("ok");
}
```

3. Make up a long random secret (for example, run `node -e "console.log(crypto.randomUUID())"` in a terminal) and paste it in place of `PASTE-THE-SAME-SECRET-AS-LEADS_SHEET_SECRET`.
4. Click **Deploy → New deployment**, choose the type **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**, allow the permissions, and copy the **Web app URL** (it ends in `/exec`).

## 3. Connect the website

In `.env.local` (and later in the hosting settings), fill in:

```
LEADS_SHEET_WEBHOOK_URL=<the Web app URL>
LEADS_SHEET_SECRET=<the same secret as in the script>
```

Restart `npm run dev`. Send a test enquiry from http://localhost:3000/contact; a row should appear within a few seconds.

**Optional:** in the sheet, **Tools → Notification settings → Edit notifications** sends you an email when a row is added. That's a free instant alert.
