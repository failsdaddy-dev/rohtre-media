# After the domain switch

What to do once `rohtremedia.com` opens the Vercel site. Do it the same day, in this order.

## 1. Check the site

- [ ] Vercel → `rohtre-media` → Settings → Domains shows Valid Configuration for both domains.
- [ ] `https://rohtremedia.com` opens the new site with a lock icon.
- [ ] `https://www.rohtremedia.com` redirects to `https://rohtremedia.com`.
- [ ] Submit the Contact form and the Careers form. Both emails arrive.
- [ ] Send and receive one email on `sales@` and `talent@`.

## 2. Old ad addresses

These addresses are in Google Ads and don't exist on the new site.

| Old address | Goes to |
|---|---|
| `/d2c-marketing-agency/` | `/` (Home) |
| `/ppcagency/` | `/` (Home) |
| `/paid-search/` | `/` (Home) |
| `/videoadcompany/` | `/` (Home) |
| `/services/` | `/` (Home) |
| `/contact-us` | `/contact` |
| `/work-2/` | `/work` |
| `/about/` | No change, the page exists |

- [ ] Open each old address on `rohtremedia.com` and confirm it lands on the right page.
- [ ] Open one with `?gclid=test` on the end and confirm `gclid=test` is still in the address.

The Redirects & ads page in the admin only works for `/lp/...` addresses today. Old addresses like `/ppcagency` need a code change before they can redirect.

## 3. Google Ads (India campaign)

- [ ] Keep campaigns running during the switch unless a page breaks.
- [ ] Campaigns → Ads: change each ad's Final URL to the new page.
- [ ] Check sitelinks in Assets too.
- [ ] Check that ads are approved after the edit.
- [ ] Leave auto-tagging on.

## 4. GTM and data layer (specialist)

- [ ] Publish the GTM container only after the switch. It is shared with the live WordPress site until then.
- [ ] Map tags to `book_a_call`, `whatsapp_click`, `phone_click` and `send_enquiry_success`.
- [ ] Add a built-in `mailto:` trigger for email clicks.
- [ ] Remove or update old WordPress triggers.
- [ ] If Clarity or LinkedIn Insight stay, add their addresses to the CSP and set their consent.
- [ ] Test conversions in Tag Assistant, then change the ad URLs if they still point to Home.

## 5. Google Search Console

- [ ] Verify `rohtremedia.com` if it isn't verified yet.
- [ ] Submit `https://rohtremedia.com/sitemap.xml`.
- [ ] Inspect the Home page and request indexing.
- [ ] Check for 404 errors over the next two weeks and add redirects for any that matter.

## 6. Closing WordPress (a later day)

Only after the site, forms and mail have worked for a few days.

- [ ] Get WordPress support's answer on whether custom DNS keeps working without a plan.
- [ ] Turn off auto-renew on the Business plan (renews March 17, 2028).
- [ ] Titan expires March 11, 2027. Move the mail before then.
- [ ] Delete the old site only after the domain decision is final.
- [ ] Don't close the WordPress account. It holds other sites and domains.

## 7. Later

- [ ] Dubai campaign: build the D2C and service landing pages, ad groups and ads.
- [ ] Decide on the Vercel plan, because Hobby doesn't allow commercial use.
