# Job updates: WhatsApp and email

CONNEKT messages members when an opening lands that suits them. Two channels,
both opt-in, both work-only — we do not send marketing, and the consent text
members agree to says so.

Everything below is already built and deployed. What is missing is the two sets
of credentials, which have to come from accounts only you can open. Until they
are set, sends are skipped and recorded in `notifications/` with the reason —
nothing breaks, members just do not receive anything.

Check the current state any time at **Admin → Job Sync**, which shows a
READY / NOT SET UP badge per channel.

---

## 1. WhatsApp — Meta WhatsApp Cloud API

This is the part that needs the most from you, because Meta gates business
messaging behind a verified business.

### What to create

1. **Meta Business account** at business.facebook.com, with **Business
   Verification** completed. This needs your company registration documents
   and takes Meta a few days to approve. Nothing else can start until it does.
2. **A Meta app** at developers.facebook.com → Create App → *Business* type →
   add the **WhatsApp** product to it.
3. **A sender phone number.** Either buy one through the WhatsApp Manager or
   register a number you own. It must not be active on the normal WhatsApp or
   WhatsApp Business app — registering it here takes it over.
4. **A System User token** (Business Settings → Users → System Users → Generate
   token) with the `whatsapp_business_messaging` and
   `whatsapp_business_management` permissions. Generate it with **no
   expiry** — the 24-hour token from the test panel will stop working overnight.
5. **A message template.** Meta only allows a business to start a conversation
   with a pre-approved template. Create one in WhatsApp Manager → Message
   Templates:

   - **Name:** `connekt_job_update`
   - **Category:** Utility
   - **Language:** English
   - **Body:**
     ```
     Hi {{1}}, {{2}} new opening(s) on CONNEKT match your profile — starting with {{3}}. Open CONNEKT to see them all.
     ```
   - Approval usually takes minutes to a few hours.

   The three variables are filled in as: `{{1}}` first name, `{{2}}` how many
   jobs, `{{3}}` the lead role ("Finance Officer at GT Bank").

### What to give me

Put these in `functions/.env` and redeploy (`firebase deploy --only functions`):

```
WHATSAPP_ACCESS_TOKEN=EAAG...        # the System User token
WHATSAPP_PHONE_NUMBER_ID=123456789   # WhatsApp > API Setup
WHATSAPP_TEMPLATE_NAME=connekt_job_update
WHATSAPP_TEMPLATE_LANG=en
```

### Cost

Meta bills per conversation, not per message, in 24-hour windows. Utility
conversations to Gambian numbers are a fraction of a US cent each. There is a
monthly free allowance that a board this size will most likely stay inside.

### Notes

- Numbers are stored in E.164 (`+2207123456`). Members can type `7123456`,
  `07123456` or `+220 712 3456` — the server normalises all of them and
  rejects anything that cannot be made into a valid number.
- The welcome message sent right after opt-in is free-form text, which Meta
  allows because the member has just interacted. Later alerts use the template.
- Replying `STOP` is honoured by Meta at the platform level. Members can also
  turn alerts off under **Settings → Job updates**.

---

## 2. Email — Resend

Much simpler; you can finish this in ten minutes.

1. Sign up at resend.com.
2. **Domains → Add Domain** → `connekt.gm`, then add the DKIM, SPF and return-path
   records Resend gives you to your DNS. Verification is usually minutes.
3. **API Keys → Create API Key** with *Sending access*.

Put these in `functions/.env` and redeploy:

```
RESEND_API_KEY=re_...
RESEND_FROM=CONNEKT <alerts@connekt.gm>
```

`RESEND_FROM` **must** be on the domain you verified, or Resend rejects the
send. Free tier is 3,000 emails/month, 100/day.

---

## How members opt in

| Where | Who sees it |
| --- | --- |
| Onboarding, "Get updates on WhatsApp" step | Everyone signing up from now on |
| Pop-up on the dashboard | Everyone who signed up **before** this shipped, the next time they log in |
| Settings → Job updates | Everyone, any time, to change or switch off |

The pop-up cannot be dismissed by clicking the background — a stray click
should not count as "no". It has a "Not now", which holds it off for 7 days.
The consent checkbox is required before the number can be saved.

---

## What gets sent, and how often

The daily sync (`syncJobsDaily`, 05:00 Banjul) finishes by scoring each new
listing against each opted-in member: skills, category, their stated target
role, and whether the job is in The Gambia. Members with no match get nothing;
members with no profile detail at all still get the local vacancies.

- At most **5 jobs** per message.
- At most **one message per member per 20 hours**, whichever channel.
- Employers are not sent job alerts.

Every attempt is written to `notifications/` with its outcome, so if a member
asks why they were messaged — or why they were not — the answer is there.
