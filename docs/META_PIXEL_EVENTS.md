# Meta Pixel events

## Setup

- Pixel ID: 1125813079510077 (the same pixel as the WordPress site).
- `NEXT_PUBLIC_META_PIXEL_ID`: optional, falls back to the ID above.
- `NEXT_PUBLIC_META_PIXEL_ENABLED`: must be `true` or nothing loads. Keep it `false` on every non-production environment.
- Names and calls: `src/lib/meta-pixel.ts`.
- Base code and the click listener: `src/components/tracking/meta-pixel.tsx`, mounted once in `src/app/layout.tsx`.
- Production needs `connect.facebook.net` and `www.facebook.com` allowed in the Content-Security-Policy in `next.config.ts`. Without that the browser blocks the pixel in production. The policy does not apply under `npm run dev`.

### Excluded routes

The pixel does not load on: `/admin`, `/api`, `/lp`, `/login`, `/preview`, `/no-access`, `/auth`.

To add one, edit `META_PIXEL_EXCLUDED_PATH_PREFIXES` in `src/lib/meta-pixel.ts`. Every landing page, including ones built later in the admin, is under `/lp`, so new landing pages need no change. Any page with a password field also keeps the script off, which covers the secret sign-in address.

## Events

| Event | Type | Trigger | Parameters | Conversion |
| --- | --- | --- | --- | --- |
| PageView | Standard | Every public page view | None | No |
| BookACall | Custom | Click on any Book a Call button | None | No |
| Lead (SendEnquiry) | Standard | Contact form, after the server confirms success | content_name `SendEnquiry`, content_category `Contact_Conversion`, eventID | Yes |
| Lead (WhatsApp) | Standard | Click on any link to `wa.me`, `api.whatsapp.com` or `whatsapp.com/send` | content_name `WhatsApp`, content_category `Contact_Conversion`, eventID | Yes |

Nothing else is tracked. Names, emails, phone numbers and messages are never sent to Meta. Advanced Matching and the Conversions API are not used. Meta's automatic button-click collection is off (`autoConfig` false).

The event name of both conversions is one constant, `META_CONVERSION_EVENT`, in `src/lib/meta-pixel.ts`.

## How to test

Set `NEXT_PUBLIC_META_PIXEL_ENABLED=true` in `.env.local` and restart `npm run dev`. Turn off ad blockers.

### Meta Pixel Helper

1. Open the home page: one PageView.
2. Click Work, then About: one more PageView for each page change.
3. Click Book a Call in the header: one BookACall.
4. On `/contact`, click WhatsApp us: one Lead with content_name `WhatsApp`.
5. Click the floating WhatsApp button, then Start chat: one Lead with content_name `WhatsApp`. Opening the chat card alone sends nothing.
6. Send a valid enquiry: one Lead with content_name `SendEnquiry`.
7. Submit with a required field empty: nothing fires.
8. Open `/admin` and any `/lp/` page: Pixel Helper finds no pixel.

### Events Manager, Test Events

1. Open Events Manager, choose the pixel, then Test Events.
2. Enter the site URL and open it from there.
3. Repeat the actions above and confirm each event appears once with the parameters in the table.

Test Events needs a public URL for its website test. On localhost, use Pixel Helper.

## Do not duplicate

The pixel is installed in code. Do NOT also add a Meta Pixel tag in Google Tag Manager unless the code install is removed first. The WordPress pixel must also go when the domain moves to this site.

## Setting up conversions in Events Manager

Create two Custom Conversions so the two actions report separately:

1. Open Events Manager, then Custom Conversions, then Create.
2. Choose the pixel and the event `Lead`.
3. Add the rule: content_name equals `SendEnquiry`. Name it Send Enquiry and save.
4. Repeat with content_name equals `WhatsApp`. Name it WhatsApp Click and save.
