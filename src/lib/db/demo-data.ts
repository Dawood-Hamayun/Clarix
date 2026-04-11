/**
 * Demo content for the "Acme Cloud" sample knowledge base.
 *
 * Loaded by `POST /api/demo/seed` so anyone visiting a fresh Clarix
 * install can click one button and see a fully-populated workspace.
 *
 * The content is intentionally written so each paragraph is a tight,
 * self-contained block that includes the natural-language phrasing a
 * customer would actually type — "what are your support hours", "do
 * you have an email for support", "how much is the business plan".
 * That keeps embeddings well-aligned with real queries instead of
 * relying on the chunker to find the answer inside a wide table.
 *
 * Pure data. No imports. Safe to ship to the client.
 */

export interface DemoSource {
  /** Stable category slug from store.ts → DEFAULT_CATEGORIES */
  categorySlug: string;
  name: string;
  /** Markdown content. Gets piped through processSource → chunker → embeddings. */
  content: string;
}

export const DEMO_PROJECT = {
  name: "Acme Cloud",
  description:
    "A fictional B2B SaaS used to showcase Clarix. Real product, real docs, real questions — just an imaginary company.",
  agentName: "Ava",
  tagline: "AI support for Acme Cloud — the team workspace for modern teams.",
  greeting: "Hi! I'm Ava, Acme Cloud's support agent. How can I help?",
};

export const DEMO_SOURCES: DemoSource[] = [
  {
    categorySlug: "company",
    name: "About Acme Cloud",
    content: `# About Acme Cloud

Acme Cloud is a collaborative workspace for modern product teams. We help engineering, design, and PM teams plan, build, and ship together — without drowning in tools.

## Our mission

Most teams use 8-12 different tools to coordinate work. Context lives in Slack threads, decisions disappear into Notion, and engineers waste 30% of their week just figuring out what to work on next. Acme Cloud puts roadmaps, specs, sprints, and release notes in one place — so the whole team works from the same source of truth.

## Who uses Acme Cloud

We serve over 4,200 companies, from 5-person startups to Fortune 500 enterprises. Customers include early-stage teams, mid-market SaaS companies, and a growing number of healthtech and fintech organizations who need SOC 2 compliance out of the box. Notable customers include Hexa Robotics, Northwind Analytics, Pinecrest Health, and Lumen Bank.

## Where we're based

Acme Cloud is fully remote with team members across 14 countries. Our headquarters is registered in San Francisco, California, and we have legal entities in the EU (Dublin, Ireland) and the UK (London) to support our European customers under GDPR. We operate three production data centers — Virginia (us-east-1), Frankfurt (eu-central-1), and Sydney (ap-southeast-2).

## When was Acme Cloud founded

Acme Cloud was founded in 2021 by Sarah Chen and Diego Martinez, both former product engineers at Stripe and Figma. The company has been profitable since Q2 2024 and is backed by tier-1 investors including Sequoia, Index Ventures, and Y Combinator. As of 2026 we have 187 employees.

## Leadership team

- **Sarah Chen** — CEO and co-founder. Previously a staff engineer at Stripe.
- **Diego Martinez** — CTO and co-founder. Previously a design engineer at Figma.
- **Priya Raman** — VP of Engineering. Joined from GitHub in 2023.
- **Marcus O'Brien** — VP of Customer Success. Joined from Atlassian in 2022.

## Awards and recognition

Acme Cloud was named to the Forbes Cloud 100 in 2025, won the Product Hunt "Productivity Product of the Year" in 2024, and is rated 4.7/5 on G2 Crowd with over 1,200 reviews.
`,
  },
  {
    categorySlug: "products",
    name: "Acme Cloud features",
    content: `# Acme Cloud features

Acme Cloud is built around four core surfaces — Roadmaps, Sprints, Specs, and Releases — plus a set of integrations, an API, and an AI assistant called Acme Copilot.

## Roadmaps

Plan months ahead with a visual timeline that auto-updates from sprint progress. Group initiatives by theme, quarter, or team. Roadmaps support custom fields, so you can track confidence, effort, and revenue impact alongside dates. You can share a public read-only roadmap link with customers or stakeholders.

## Sprints

Lightweight sprint planning with auto-assigned standups, burndown charts, and velocity tracking. Pull issues from your roadmap with a single click. Sprints integrate with GitHub and GitLab, so PRs automatically link to the sprint they belong to. Default sprint length is two weeks but you can configure 1, 2, 3, or 4 week sprints.

## Specs

A structured doc editor for technical specs. Specs support inline diagrams (Mermaid, Excalidraw), code blocks with syntax highlighting for 80+ languages, and AI-assisted summaries. Every spec has a built-in approval flow, so PMs and engineers can sign off without leaving the page.

## Releases

Auto-generated release notes from your shipped sprint items. Customize the tone (formal, friendly, marketing), group by feature area, and publish straight to your changelog or in-app announcement. Releases can be scheduled to publish at a specific time and timezone.

## Acme Copilot (AI assistant)

Acme Copilot is our built-in AI assistant. It can draft specs from a one-line prompt, summarize sprint standups, suggest acceptance criteria for issues, and answer questions about your workspace. Copilot uses GPT-4 and Claude under the hood — your data is never used to train models. Copilot is included on the Advanced AI add-on ($5/user/month).

## Integrations

Native integrations with Slack, GitHub, GitLab, Figma, Linear, Jira, Notion, Asana, Trello, Zapier, Make.com, Microsoft Teams, Zoom, and Webhooks. SSO via Okta, Google Workspace, OneLogin, and Microsoft Entra ID is included on Business and Enterprise plans.

## API and SDKs

Full REST API with OAuth 2.0 authentication. Rate-limited to 1,000 requests per minute on Business and 10,000 per minute on Enterprise. Official SDKs are available for TypeScript, Python, Go, and Ruby. Full API docs at docs.acmecloud.example/api.

## Mobile apps

Native iOS and Android apps for viewing roadmaps, responding to comments, and getting push notifications. Spec editing is web-only.

## Browser extensions

Acme Cloud has Chrome, Firefox, and Safari extensions that let you create issues from any web page, capture screenshots, and quick-link to your active sprint.
`,
  },
  {
    categorySlug: "products",
    name: "Acme Copilot — AI features deep dive",
    content: `# Acme Copilot — AI features deep dive

Acme Copilot is the AI assistant built into Acme Cloud. It's available as the **Advanced AI** add-on ($5 per user per month) and is included for free during a 14-day trial when you sign up.

## What can Acme Copilot do?

- **Spec drafting:** Type a one-line description and Copilot generates a full technical spec with sections for context, goals, non-goals, design, rollout, and open questions.
- **Sprint summaries:** Auto-generates a sprint retrospective from completed issues, PR diffs, and standup notes.
- **Standup summaries:** Reads everyone's standup notes and produces a one-paragraph "what the team did yesterday" digest, posted to Slack each morning.
- **Acceptance criteria:** Highlight any issue and Copilot suggests Gherkin-style acceptance criteria.
- **Q&A:** Ask "what's blocking the checkout redesign?" or "who owns the auth refactor?" and Copilot answers from your workspace data.
- **Smart search:** Semantic search across all roadmaps, sprints, specs, and comments — no exact keyword needed.

## Which models does Acme Copilot use?

Acme Copilot uses a mix of OpenAI GPT-4o and Anthropic Claude 4.5 Sonnet under the hood, routed automatically based on the task. Model selection is not user-configurable on the Business plan. Enterprise customers can request a specific model or bring their own API key.

## Is my data used to train AI models?

**No.** Acme Cloud has data processing agreements with both OpenAI and Anthropic that explicitly prohibit training on customer data. Your specs, sprints, and comments are never used to improve any AI model. We've published our DPA at acmecloud.example/dpa for review.

## Can I disable Acme Copilot?

Yes. Workspace admins can disable Copilot entirely under Settings → AI features. You can also disable it for specific projects or members. Enterprise customers can require admin approval before any AI feature is enabled per workspace.

## What languages does Copilot support?

Copilot is most accurate in English but works in Spanish, French, German, Portuguese, Italian, Japanese, Korean, and Mandarin Chinese. Output quality is best when the input language matches the workspace language setting.

## Are there usage limits?

On the Advanced AI add-on, each user gets up to 500 AI generations per month (specs, summaries, Q&A combined). Enterprise customers get unlimited generations.
`,
  },
  {
    categorySlug: "pricing",
    name: "Pricing and plans",
    content: `# Pricing and plans

Acme Cloud is priced per active user per month, billed monthly or annually. Annual plans get 20% off. We accept all major credit cards, ACH (US), SEPA (EU), wire transfer, and PayPal. Invoicing is available on Business and Enterprise plans. All prices are in USD by default but Enterprise customers can be billed in EUR, GBP, or AUD.

## Free — $0 forever

The Free plan is free forever. It includes:

- Up to 5 users
- 1 workspace
- Unlimited public docs
- 100 issues per month
- Slack and GitHub integrations
- Community support

Ideal for small open-source teams, solo founders, or anyone evaluating the product.

## Starter — $8 per user per month

The Starter plan is best for teams of 5 to 25 people. It includes:

- Unlimited issues
- Unlimited workspaces
- Sprint planning
- Basic roadmaps
- Standard integrations (Slack, GitHub, GitLab, Notion)
- Email support with a 24-hour response SLA
- 30-day audit log retention

## Business — $16 per user per month

The Business plan is best for teams of 25 to 200 people. It includes everything in Starter, plus:

- Advanced roadmaps with custom fields
- Full REST API access (1,000 requests per minute)
- SSO via Okta, Google Workspace, and Microsoft Entra ID
- Audit logs (1-year retention)
- Custom roles and permissions
- Priority email and chat support with a 4-hour response SLA
- 99.9% uptime SLA

## Enterprise — Custom pricing

Enterprise is for teams of 200 or more, or for companies in regulated industries. Pricing typically starts at $35,000 per year. The Enterprise plan includes everything in Business, plus:

- Dedicated infrastructure
- SAML SSO with SCIM 2.0 provisioning
- IP allowlisting and private network connectivity
- BYOK (Bring Your Own Key) encryption with AWS KMS or HashiCorp Vault
- Custom data residency (US, EU, or APAC)
- 99.99% uptime SLA
- Dedicated customer success manager
- 24/7 phone, chat, and email support with a 1-hour response SLA
- Quarterly business reviews
- Custom contract and MSA

## Add-ons (any plan)

- **Advanced AI** — $5/user/month. Adds Acme Copilot (spec drafting, sprint summaries, smart search, AI Q&A).
- **Extra storage** — $20/month per 100GB beyond plan limits. Plan limits are 10GB on Free, 100GB on Starter, 500GB on Business, 5TB on Enterprise.
- **Premium support** — $1,500/month flat. Adds 1-hour SLA, named support engineer, quarterly business reviews. Available on Business plans.
- **Sandbox environment** — $500/month flat. A separate workspace mirrored from production for testing changes safely.

## Discounts

- **Startups** under 2 years old with less than $1M in funding get 50% off Starter and Business plans for the first year. Apply at acmecloud.example/startups.
- **Educational institutions** and **non-profit organizations** get 30% off any paid plan, year-round. Apply by emailing billing@acmecloud.example with proof of status.
- **Annual billing** saves 20% on all paid plans.

## How does billing work for partial months?

When you add a user mid-cycle, we pro-rate the charge for the remaining days in that billing period. When you remove a user, the seat is freed immediately and credited to your next invoice.

## What counts as an "active user"?

An active user is anyone who signs into Acme Cloud at least once during the billing period. Guest users (read-only access to specific items) do not count toward your billable user count. Bot integrations and API tokens are also free.
`,
  },
  {
    categorySlug: "pricing",
    name: "Pricing FAQ — common billing questions",
    content: `# Pricing FAQ — common billing questions

## How much does Acme Cloud cost?

Acme Cloud has four plans: **Free** ($0), **Starter** ($8 per user per month), **Business** ($16 per user per month), and **Enterprise** (custom, typically starting at $35,000 per year). Annual billing saves 20%.

## Is there a free version of Acme Cloud?

Yes. The Free plan supports up to 5 users, 1 workspace, and 100 issues per month — forever, no credit card required. We also offer a 14-day free trial of the Business plan with all features unlocked.

## Do you offer a free trial?

Yes. Every paid plan includes a 14-day free trial with full features. No credit card required to start the trial. At the end of the trial, your workspace automatically downgrades to the Free plan unless you add a payment method.

## What payment methods do you accept?

We accept Visa, Mastercard, American Express, Discover, JCB, ACH bank transfer (US only), SEPA direct debit (EU), wire transfer, and PayPal. Enterprise customers can pay by invoice with NET-30 terms.

## Can I pay in a currency other than USD?

By default we bill in USD. Enterprise customers can be invoiced in EUR, GBP, or AUD on request. Exchange rates are locked at contract signing.

## Do prices include tax / VAT?

Prices do not include tax. We charge applicable sales tax for US customers and VAT for EU and UK customers. The exact amount depends on your billing address and is shown at checkout.

## Can I get a discount?

Yes — annual billing saves 20%. Startups under 2 years old with less than $1M in funding get 50% off for their first year. Educational institutions and registered non-profits get 30% off year-round. Email billing@acmecloud.example to apply for any discount.

## How do I upgrade or downgrade my plan?

Go to Settings → Billing → Change plan. Upgrades take effect immediately and you're charged a pro-rated amount for the remainder of the cycle. Downgrades take effect at the end of your current billing period.

## Will I be charged automatically?

Yes. Subscriptions renew automatically at the end of each billing cycle (monthly or annually) using the payment method on file. We email a receipt 7 days before each renewal.

## How do I update my payment method?

Settings → Billing → Payment method → "Update". You can add multiple payment methods and choose a primary.

## Where do I find my invoices?

All invoices live under Settings → Billing → Invoices. You can download a PDF of any invoice or set up automatic invoice email forwarding to your finance team at Settings → Billing → Invoice forwarding.

## Can I get a copy of a W-9 or VAT certificate?

Yes. Email billing@acmecloud.example and we'll send our W-9 (US), VAT certificate (EU), or any other tax document you need within one business day.
`,
  },
  {
    categorySlug: "faq",
    name: "Frequently asked questions",
    content: `# Frequently asked questions

## What is Acme Cloud?

Acme Cloud is a collaborative workspace for product teams. It combines roadmaps, sprints, technical specs, and release notes into one tool — so engineering, design, and PMs can plan and ship together without juggling 8 different apps.

## Can I try Acme Cloud before paying?

Yes. The Free plan is forever free for up to 5 users, no credit card required. We also offer a 14-day free trial of the Business plan with all features unlocked — no card needed for the trial either.

## How do I sign up?

Go to acmecloud.example/signup and create an account with your work email or Google account. You'll be in your first workspace in under a minute.

## How do I cancel my subscription?

Go to Settings → Billing → Cancel Plan. Your subscription stays active until the end of your current billing period, after which you'll be moved to the Free plan. Your data is preserved for 90 days, after which it's permanently deleted unless you reactivate.

## How do I delete my account?

Settings → Account → Delete account. This permanently removes your account, your authored content (replaced with "[deleted user]"), and any workspaces you solely own. Workspaces with other admins are transferred. Account deletion is irreversible after 30 days.

## Do you offer refunds?

Yes. If you cancel an annual plan within 30 days of purchase, we'll refund the full amount. After 30 days, refunds are pro-rated for the unused portion. Monthly plans are non-refundable but you can cancel anytime to stop future charges.

## Can I import my data from Jira / Linear / Notion / Asana?

Yes. We have native importers for Jira, Linear, Notion, Asana, Trello, and ClickUp. Imports preserve issue history, comments, attachments, and custom fields where the source platform supports them. Imports are free on every plan, including Free. Most imports finish in under an hour; very large Jira instances can take overnight.

## Can I export my data?

Yes, anytime. Settings → Workspace → Export → choose JSON, CSV, or Markdown. Exports include all roadmaps, sprints, specs, comments, and attachments. There is no limit and no charge for exports.

## Is Acme Cloud SOC 2 compliant?

Yes. We are SOC 2 Type II certified, audited annually by Drata. We're also GDPR compliant, HIPAA-ready (with a BAA available on Enterprise plans), and ISO 27001 certified as of 2025. Request our SOC 2 report at security@acmecloud.example.

## Can I self-host Acme Cloud?

No, we don't currently offer a self-hosted version. Enterprise customers can request dedicated single-tenant infrastructure with custom data residency, which gives you the isolation benefits of self-hosting without the operational overhead.

## Does Acme Cloud have a mobile app?

Yes, we have native iOS and Android apps for viewing roadmaps, responding to comments, and getting notifications. Spec editing is web-only — the editor is too complex for a small screen and we'd rather not ship a bad version.

## Does Acme Cloud work offline?

The web app requires an internet connection. The mobile apps cache recent roadmaps and sprints for offline viewing, but you cannot edit content while offline.

## What languages does Acme Cloud support?

The product UI is available in English, Spanish, French, German, Portuguese, Italian, Japanese, Korean, and Mandarin Chinese. The AI features (Specs, Copilot) work in any language but are most accurate in English.

## What browsers does Acme Cloud support?

We support the latest two versions of Chrome, Firefox, Safari, Edge, and Brave. Internet Explorer is not supported.

## Do you have a Slack community?

Yes. Join 4,200+ Acme Cloud users at acmecloud.example/community. The community is the fastest place to get tips, share workflows, and chat with the team.

## How do I report a bug?

Email support@acmecloud.example or use the chat bubble in-product. Critical bugs (security, data loss, prolonged downtime) should be sent to security@acmecloud.example or status.acmecloud.example.

## How do I request a feature?

We have a public roadmap and feedback portal at feedback.acmecloud.example. Vote on existing requests or submit new ones — we read every submission and the team prioritizes top-voted items each quarter.
`,
  },
  {
    categorySlug: "how-to",
    name: "How to reset your password",
    content: `# How to reset your password

If you've forgotten your password or just want to rotate it, follow these steps.

## Reset from the login screen

1. Go to acmecloud.example/login
2. Click "Forgot password?" below the password field
3. Enter the email address associated with your Acme Cloud account
4. Check your inbox for an email from no-reply@acmecloud.example with the subject "Reset your Acme Cloud password"
5. Click the link in the email — it's valid for 60 minutes
6. Choose a new password (minimum 12 characters, one uppercase, one number, one symbol)
7. You'll be automatically signed in once the new password is saved

## Change your password while signed in

1. Click your avatar in the top-right and choose "Account settings"
2. Go to the "Security" tab
3. Click "Change password"
4. Enter your current password, then your new password twice
5. Click "Save"

## I'm not getting the password reset email

Wait 5 minutes — sometimes our email provider queues during high traffic. If it still hasn't arrived:

- Check your spam folder
- Check that the email matches the one on your account (case-insensitive but typos count)
- Add no-reply@acmecloud.example to your contacts
- If you use Gmail, check the "Promotions" tab
- If you use Outlook, check the "Other" inbox

If none of that works, contact support@acmecloud.example with the email address you're trying to reset and we'll manually trigger a reset.

## My account uses SSO — how do I reset?

If your team signs in with SSO (Google, Okta, Microsoft Entra ID), you can't reset your password through Acme Cloud. Reset it through your identity provider instead. Acme Cloud will pick up the new password automatically the next time you sign in.

## Setting up two-factor authentication (2FA)

We strongly recommend enabling 2FA on your account. Go to Settings → Security → Two-factor authentication → "Enable". You can use any TOTP authenticator app (Google Authenticator, 1Password, Authy, Bitwarden) or a hardware security key (YubiKey, Titan). On Business and Enterprise plans, admins can require 2FA for everyone in the workspace.
`,
  },
  {
    categorySlug: "how-to",
    name: "Inviting team members",
    content: `# Inviting team members

Acme Cloud is built for teams. Here's how to bring yours on board.

## Inviting individual users

1. Click "Invite" in the top-right of any workspace, or go to Settings → Members
2. Enter one or more email addresses, comma-separated
3. Choose a role: Admin, Member, or Guest (see role descriptions below)
4. Click "Send invites"

Invitees receive an email with a join link valid for 7 days. They'll be added to the workspace as soon as they accept.

## Inviting via shareable link

For larger teams, generate a shareable invite link instead:

1. Settings → Members → "Get invite link"
2. Choose the default role for anyone joining via this link
3. Optionally set an expiration date and a domain restriction (e.g. "only @acmecorp.com")
4. Copy the link and share it in Slack, email, or wherever your team hangs out

## Roles explained

- **Admin** — can manage billing, members, integrations, and workspace settings. Can delete the workspace. Recommended for 1-3 trusted team members.
- **Member** — full access to roadmaps, sprints, specs, and releases. Can invite other Members and Guests but not Admins. The default for most teammates.
- **Guest** — read-only access to specific items you share with them. Guests don't count toward your billable user count. Use this for clients, contractors, or stakeholders who only need to view.

## Bulk invites via CSV

On Business and Enterprise plans, you can upload a CSV of users to invite at once:

1. Settings → Members → "Bulk invite"
2. Download the CSV template
3. Fill in email, role, and optional team assignment columns
4. Upload the file and click "Send all invites"

## SCIM provisioning (Enterprise only)

Enterprise customers can sync users automatically from Okta, Microsoft Entra ID, OneLogin, or any SCIM 2.0-compatible provider. Once SCIM is configured, adding a user to the right group in your IdP automatically creates their Acme Cloud account; removing them deactivates the account. Setup takes about 15 minutes — see the Enterprise SSO setup guide or contact your customer success manager.

## How do I remove someone from a workspace?

Settings → Members → find the user → click the three-dot menu → "Remove from workspace". The user immediately loses access. Their authored content stays in place but is attributed to them by name. You can re-invite them later if needed.

## Why can't I invite more people?

Two common reasons: (1) you're on the Free plan which is capped at 5 users — upgrade to Starter or Business to add more; (2) you're not an Admin — only Admins can invite Members and Guests on Business+. Ask an existing Admin to invite you, or have them upgrade your role to Admin.
`,
  },
  {
    categorySlug: "how-to",
    name: "Getting started — your first workspace",
    content: `# Getting started — your first workspace

This guide walks you through your first 30 minutes in Acme Cloud, from signup to your first sprint.

## Step 1: Create your account

Go to acmecloud.example/signup. You can sign up with your work email or with Google, Microsoft, or GitHub OAuth. We recommend using your work email so teammates can find you.

## Step 2: Name your workspace

After signup, you'll be prompted to create your first workspace. Use your company or team name — this is what teammates see in invites and notifications. You can rename the workspace anytime under Settings → Workspace → General.

## Step 3: Invite your team

From your new workspace, click "Invite" in the top-right and enter your teammates' email addresses. They'll receive an invite link valid for 7 days. You can also generate a shareable invite link with a domain restriction (e.g. only @yourcompany.com).

## Step 4: Pick your starting template

Acme Cloud ships with 12 starter templates: SaaS Engineering, Mobile App, Hardware, Marketing Campaigns, Design Sprint, OKRs, Bug Triage, Customer Onboarding, Product Launch, Compliance Project, Research Sprint, and Blank. Templates pre-fill the workspace with sensible roadmaps, sprint cadences, and spec templates that you can edit freely.

## Step 5: Create your first roadmap

Click "New roadmap" and pick a timeline (quarterly, monthly, or custom range). Add 3-5 initiatives — these are the big themes you want to ship over the next quarter. Each initiative can have a confidence score, effort estimate, and target date.

## Step 6: Plan your first sprint

Click "New sprint", set the start date, length (1-4 weeks), and team. Pull issues from your roadmap into the sprint with one click. Once the sprint is active, the team can move issues across the standard kanban columns (Todo, In Progress, Review, Done).

## Step 7: Connect your tools

Go to Settings → Integrations and connect Slack, GitHub or GitLab, and Figma. Slack lets you get sprint notifications and create issues from any message. GitHub/GitLab links PRs to issues automatically. Figma embeds design previews into specs.

## Step 8: Try Acme Copilot (optional)

If you have the Advanced AI add-on or are still in your free trial, try Copilot. Click the "Ask Copilot" button on any issue and ask "draft acceptance criteria for this" or "what's blocking this?". Copilot reads your workspace and answers in seconds.

## What's next?

- Read the [Sprints guide](docs.acmecloud.example/sprints) to learn about velocity, burndown, and standups
- Explore [keyboard shortcuts](docs.acmecloud.example/shortcuts) — Acme Cloud is very keyboard-friendly
- Join the [Acme Cloud community](acmecloud.example/community) on Slack (4,200+ members)
`,
  },
  {
    categorySlug: "how-to",
    name: "Troubleshooting common issues",
    content: `# Troubleshooting common issues

If something isn't working in Acme Cloud, try these fixes first. If they don't help, contact support@acmecloud.example with the workspace name and the steps you took.

## I can't sign in

- Make sure you're using the email you originally signed up with. Acme Cloud doesn't merge accounts across different email addresses.
- If your team uses SSO, sign in via your IdP (Google, Okta, Microsoft Entra ID) instead of the password form.
- If you've forgotten your password, click "Forgot password?" on the login page. The reset link is valid for 60 minutes.
- Clear your cookies for acmecloud.example and try again — stale auth cookies are a common cause.

## The page is blank or won't load

- Hard refresh the page: **Cmd+Shift+R** on Mac, **Ctrl+F5** on Windows.
- Disable browser extensions, especially ad blockers and privacy extensions, which sometimes block our scripts.
- Try an incognito window to rule out cached state.
- Check status.acmecloud.example to see if there's an active incident.

## My GitHub / GitLab integration stopped working

- Re-authenticate the integration: Settings → Integrations → GitHub → "Reconnect". OAuth tokens occasionally expire.
- Make sure the GitHub user has admin or write access to the repository you're linking to.
- Check that the repo is in the organization you connected — Acme Cloud only sees repos in connected orgs.

## Notifications aren't arriving

- Check Settings → Notifications and confirm the events you care about are enabled.
- For Slack notifications, re-authorize the Slack integration. Slack tokens expire when an admin removes the app from your workspace.
- For email notifications, check your spam folder and add no-reply@acmecloud.example to your contacts.
- Check that you're a member of the project the notification belongs to. Notifications are scoped per project.

## Search isn't finding what I'm looking for

- Acme Cloud uses both keyword and semantic search. Try a more specific query first, then a more conceptual one.
- Make sure you're searching in the right workspace. Use the workspace switcher in the top-left.
- Recently created content can take 1-2 minutes to be indexed.

## My workspace feels slow

- Most slowness comes from very large roadmap views. Try filtering to a single team or quarter.
- Old sprint history can also slow things down — archive sprints older than 6 months under Settings → Sprints → Archive.
- If slowness persists, send us a HAR file (instructions at docs.acmecloud.example/har) and we'll investigate.

## Why was my data deleted?

Data is only deleted in three cases:
1. You explicitly deleted it.
2. Your subscription was canceled and the 90-day retention window passed.
3. Your account was deleted.

If none of these apply, contact security@acmecloud.example immediately — we have backup snapshots up to 30 days back and can restore.
`,
  },
  {
    categorySlug: "policies",
    name: "Privacy and data policy",
    content: `# Privacy and data policy

Acme Cloud is built for teams that care about privacy and compliance. Here's what we collect, how we use it, and what control you have.

## What we collect

We collect three categories of data:

1. **Account data** — name, email, profile photo, organization name. Required to create an account.
2. **Workspace content** — roadmaps, specs, sprints, comments, files. This is your data. We never train AI models on it.
3. **Usage analytics** — anonymized events about which features you use, how often, and from where. Helps us improve the product.

## What we don't do

- We never sell your data to third parties.
- We never train AI models on your workspace content. Acme Copilot uses third-party LLMs (OpenAI and Anthropic) under strict data processing agreements that prohibit training on your content.
- We never share your data with advertisers or data brokers.

## GDPR rights

If you're in the EU/UK, you have the right to:

- Access all data we hold about you (Settings → Privacy → Export my data)
- Correct inaccurate data
- Delete your data (Settings → Account → Delete account)
- Object to processing for analytics (Settings → Privacy → Disable analytics)
- Data portability — export your workspace as JSON anytime

To exercise these rights or ask questions, contact privacy@acmecloud.example. We respond within 30 days as required by law.

## Data retention

- **Active accounts:** we keep your workspace data as long as your account is active.
- **Canceled accounts:** data is preserved for 90 days after cancellation, after which it's permanently deleted. You can reactivate within the 90-day window with no data loss.
- **Deleted accounts:** account deletion is queued and finalized after 30 days. During those 30 days you can recover the account by signing in.
- **Backups:** we keep encrypted database snapshots for 30 days. After 30 days, snapshots are also permanently deleted.

## Data residency

By default, your data is stored in AWS us-east-1 (Virginia, USA). Enterprise customers can request EU residency (Frankfurt, eu-central-1) or APAC residency (Sydney, ap-southeast-2). Cross-region replication is available on Enterprise plans with a 99.99% uptime SLA.

## Encryption

All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Enterprise customers can opt into BYOK (Bring Your Own Key) encryption with AWS KMS or HashiCorp Vault.

## Sub-processors

We use a small set of sub-processors to operate Acme Cloud: AWS (hosting), Stripe (billing), Postmark (transactional email), Datadog (logging and monitoring), Drata (compliance monitoring), OpenAI and Anthropic (AI features), Cloudflare (CDN and DDoS protection), and Plausible (privacy-friendly analytics). The full list is at acmecloud.example/subprocessors and is updated whenever a new sub-processor is added.

## Reporting a privacy concern

For privacy questions, data subject requests, or DPA requests, email privacy@acmecloud.example. Our Data Protection Officer responds within 5 business days, and within 30 days for formal GDPR/CCPA requests.
`,
  },
  {
    categorySlug: "policies",
    name: "Security and compliance",
    content: `# Security and compliance

Acme Cloud takes security seriously. This page covers our certifications, controls, and incident response process.

## Certifications

- **SOC 2 Type II** — Annual audit by Drata. Report available under NDA at security@acmecloud.example.
- **ISO 27001:2022** — Certified as of March 2025.
- **GDPR** — Compliant. DPA available at acmecloud.example/dpa.
- **CCPA** — Compliant. We honor "Do Not Sell" requests via Settings → Privacy.
- **HIPAA** — HIPAA-ready. BAAs available on Enterprise plans.
- **PCI DSS** — Out of scope. Payments are processed by Stripe; we never see or store card data.

## Encryption

All data in transit is encrypted with TLS 1.3. All data at rest is encrypted with AES-256. Database backups are encrypted with separate keys, rotated quarterly. Enterprise customers can bring their own keys (BYOK) via AWS KMS or HashiCorp Vault.

## Access controls

- All employee access to production systems requires hardware-backed 2FA (YubiKey).
- Production access is granted just-in-time via PR review and expires automatically after 4 hours.
- All production actions are logged to an immutable audit trail.
- We follow the principle of least privilege — engineers only get access to the systems they actively need.

## Penetration testing

We commission an independent penetration test annually from a third-party firm. The most recent test was completed in February 2026 by Doyensec. Customers under NDA can request the report via security@acmecloud.example.

## Vulnerability disclosure

We run a bug bounty program through HackerOne. Security researchers can report vulnerabilities at hackerone.com/acmecloud. We pay $250 to $25,000 depending on severity. Critical vulnerabilities are typically patched within 24 hours.

To report a vulnerability directly, email security@acmecloud.example. Our PGP key is published at acmecloud.example/security.txt.

## Incident response

If we detect a security incident, our process is:

1. **Detect and contain** — within 15 minutes of detection
2. **Investigate and assess scope** — within 1 hour
3. **Notify affected customers** — within 24 hours if customer data is involved, regardless of severity
4. **Public post-mortem** — published within 7 days for incidents that affected customer data

We've never had a customer data breach. Status updates are published in real-time at status.acmecloud.example.

## Single sign-on (SSO)

SSO is available on Business and Enterprise plans. We support:

- **Google Workspace** — included on Business
- **Microsoft Entra ID (Azure AD)** — included on Business
- **Okta** — included on Business
- **OneLogin** — included on Business
- **Generic SAML 2.0** — Enterprise only
- **SCIM 2.0 provisioning** — Enterprise only

## Audit logs

Every significant action — sign-ins, permission changes, content deletes, API token creation — is logged to an audit log. Retention is 30 days on Starter, 1 year on Business, and 7 years on Enterprise. Audit logs can be exported as JSON or streamed to Splunk, Datadog, or AWS S3 in real time on Enterprise.
`,
  },
  {
    categorySlug: "contact",
    name: "Contact and support",
    content: `# Contact and support

The fastest way to reach Acme Cloud support is the in-product chat (the bubble in the bottom-right of any page). Our AI agent answers most questions instantly, and routes the rest to a human within minutes during business hours.

## Email addresses for support

The main email address for general support questions is **support@acmecloud.example**. For other topics, use the dedicated address — that's the fastest way to get a response from the right team.

- **General product support:** support@acmecloud.example
- **Billing, refunds, and invoices:** billing@acmecloud.example
- **Privacy, GDPR, and data subject requests:** privacy@acmecloud.example
- **Security disclosures and vulnerabilities:** security@acmecloud.example (PGP key at acmecloud.example/security.txt)
- **Press and media inquiries:** press@acmecloud.example
- **Partnerships and integrations:** partnerships@acmecloud.example
- **Sales and enterprise inquiries:** sales@acmecloud.example
- **Careers and recruiting:** careers@acmecloud.example
- **Legal and contracts:** legal@acmecloud.example

## What are your support hours?

Our support hours depend on your plan:

- **Free plan:** Community support only — best effort, typically a 48-72 hour response. Available Monday through Friday.
- **Starter plan:** Email support is available **Monday to Friday, 9am to 6pm Pacific Time**, with a 24-hour first-response SLA.
- **Business plan:** Email and chat support is available **Monday to Friday, 7am to 9pm Pacific Time**, with a 4-hour first-response SLA.
- **Enterprise plan:** Phone, chat, and email support is available **24 hours a day, 7 days a week**, with a 1-hour first-response SLA.
- **Premium support add-on:** 24/7 phone, chat, and email with a 1-hour SLA, plus a named support engineer.

In short: Free and Starter customers are supported during US business hours, Business customers get extended weekday hours, and Enterprise customers get round-the-clock support every day of the year, including weekends and holidays.

## Phone support

Phone support is available on **Enterprise** plans and on the **Premium support** add-on. Enterprise customers can reach us at **+1-415-555-0142** (US), **+44-20-7946-0118** (UK), or **+61-2-8005-2147** (Australia), 24 hours a day. Other plans do not include phone support.

## Live chat

Live chat is available in-product (the chat bubble in the bottom-right) on Business and Enterprise plans. Chat is also embedded on acmecloud.example for prospective customers.

## Community support

Join the Acme Cloud Slack community at **acmecloud.example/community** — over 4,200 members, plus the Acme Cloud team. The community is the fastest place to get tips and workflows from other users.

## Status page

Check **status.acmecloud.example** for real-time uptime and incident history. Subscribe to email, RSS, Slack, or webhook notifications to get alerted when we open or resolve an incident. We post updates within 5 minutes of detecting an issue.

## Social media

- Twitter / X: **@acmecloud**
- LinkedIn: **linkedin.com/company/acmecloud**
- GitHub: **github.com/acmecloud** (public SDKs and example code)
- YouTube: **youtube.com/@acmecloud** (product tutorials and webinars)

## Sales contact

If you're evaluating Acme Cloud for a team of 50 or more, or you need a custom contract, **book a call at acmecloud.example/sales**. Our sales team typically responds within 1 business hour during weekdays. You can also email **sales@acmecloud.example** directly.

## Mailing address

Acme Cloud, Inc.
548 Market Street, Suite 12345
San Francisco, CA 94104
United States

## Are you hiring?

Yes — we have open roles in engineering, design, product, sales, and customer success. See the full list at **acmecloud.example/careers** or email **careers@acmecloud.example**.
`,
  },
];
