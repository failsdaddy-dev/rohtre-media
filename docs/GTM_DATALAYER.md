# Google Tag Manager and data layer

## Setup

- `NEXT_PUBLIC_GTM_ID`: the container ID, format `GTM-XXXXXXX`. If it is missing or malformed, nothing loads.
- `NEXT_PUBLIC_GTM_ENABLED`: must be `true` or nothing loads. Keep it `false` on every non-production environment.
- Loader: `src/components/tracking/google-tag-manager.tsx`, mounted once in `src/app/layout.tsx`.
- Events: `pushDataLayer` in `src/lib/data-layer.ts`. Clicks use the one shared listener in `src/components/tracking/meta-pixel.tsx`.
- Production needs the Google addresses allowed in the Content-Security-Policy in `next.config.ts`. Without that the browser blocks GTM in production. The policy does not apply under `npm run dev`.

### Excluded routes

GTM loads on all public pages and on published landing pages (`/lp/*`). It does not load on `/admin`, `/api`, `/login`, `/preview`, `/no-access`, `/auth` (the shared list `META_PIXEL_EXCLUDED_PATH_PREFIXES` in `src/lib/meta-pixel.ts`), on any page with a password field, or on a landing page in draft preview. On landing pages GTM starts after the page finishes loading, so the draft check can run.

## Events

All four carry `page_path`, `page_type` (`landing` for `/lp`, otherwise `site`) and `event_id`.

| Event | Trigger | Extra parameters | event_id |
| --- | --- | --- | --- |
| book_a_call | Click on any Book a Call button | None | Own value |
| whatsapp_click | Click on any link to `wa.me`, `api.whatsapp.com` or `whatsapp.com/send` | link_url | Same as the Meta Lead (WhatsApp) eventID |
| phone_click | Click on any `tel:` link | link_url | Own value |
| send_enquiry_success | Contact page form, after the server confirms success | None | Same as the Meta Lead (SendEnquiry) eventID |

No page_view is pushed. No names, emails, phone numbers, messages or form text are pushed. `link_url` holds the company's own number.

### Older data layer events

The site also pushes these older events through `src/lib/track.ts`. They stay in place, but do not trigger tags from them alongside the events above, or the same action counts twice:

- `lead_submit`: Contact form and landing page form, after success.
- `book_call_click`: same clicks as `book_a_call`.
- `call_click`: same clicks as `phone_click` where the link carries it.

`lead_submit` is currently the only event that covers landing page form submissions.

## Old GA4 key events

For mapping reference: close_convert_lead, form_submit, generate_lead_contact_us_page, phone_number_clicks, purchase, qualify_lead.

Mapping: to be decided by the specialist.

## Notes

- Do not add a second GA4 tag outside GTM. G-W5XK8PZKQM is loaded inside GTM only.
- Do not add a Meta Pixel tag in GTM while the code install exists.
- There is no in-code Google Ads conversion today. `lead_submit` only reaches Google if a GTM tag uses it. If a tag is added on it and on `send_enquiry_success`, disable or replace one, not both.
- The App Router changes pages without a full reload. A History Change trigger is needed for page views.

## Testing

1. Set `NEXT_PUBLIC_GTM_ID` and `NEXT_PUBLIC_GTM_ENABLED=true`, then restart the server.
2. In GTM click Preview, enter the site URL and connect Tag Assistant.
3. Confirm each event in the Tag Assistant event list:

| Action | Expected event |
| --- | --- |
| Click Book a Call in the header | book_a_call, page_type site |
| Click WhatsApp us on `/contact` | whatsapp_click with link_url |
| Click Start chat in the floating WhatsApp card | whatsapp_click with link_url |
| Click a phone number in the footer | phone_click with `tel:` link_url |
| Send a valid Contact enquiry | send_enquiry_success with event_id |
| Submit the Contact form with a required field empty | Nothing |
| Open a published `/lp/` page and click Book a Call | book_a_call, page_type landing |
| Open `/admin` or a draft landing page | GTM does not load |
