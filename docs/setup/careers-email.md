# Careers applications: email to HR (Gmail, free)

Each application on /careers is saved in Supabase (Admin → Applications) and
emailed to HR through Gmail's SMTP server, with the resume attached when the
applicant sent one. Gmail's free sending limit is about 500 emails a day.

## One-time setup (owner)

1. Pick the Gmail account that will send the emails (for example a
   careers@ or hr@ Google account).
2. Turn on 2-Step Verification for that Google account (needed for app
   passwords): Google Account → Security → 2-Step Verification.
3. Create an app password: Google Account → Security → App passwords →
   name it "RohTre website" → copy the 16-character password.
4. Add to `.env.local` (and later to the hosting's environment variables):

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=<the sending Gmail address>
   SMTP_PASS=<the 16-character app password>
   ```

5. Restart `npm run dev`.
6. Admin → Careers page → "HR emails for applications": enter the HR
   address(es) that should receive applications (empty = the sending
   account itself).

## If an email fails

The application is still saved and the applicant still sees the thank-you
message. The inbox marks it "not emailed" with the reason; contact the
applicant from there (WhatsApp button or email link).

## WhatsApp to HR (Phase 2, off)

`CAREERS_WHATSAPP_ENABLED=false` keeps it off. To switch it on later you
need, on Meta's side: a verified Meta Business account, a WhatsApp Business
Platform (Cloud API) app, a phone number that is not used in the normal
WhatsApp or WhatsApp Business app, an approved message template with three
body variables (name, role, phone), and a permanent access token. Then set
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_HR_NUMBER`,
`WHATSAPP_TEMPLATE` and `CAREERS_WHATSAPP_ENABLED=true`. Meta charges per
template message (utility category, priced per country); check the current
rate for India on Meta's pricing page before switching it on.
