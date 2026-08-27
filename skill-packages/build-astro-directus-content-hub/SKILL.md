---
name: build-astro-directus-content-hub
description: Safely plan, deploy, verify, and hand off a small-VPS content hub using Ubuntu, 1Panel, Docker, OpenResty, Directus, PostgreSQL, Astro, Cloudflare Pages, and R2. Use when a user asks an Agent to build or repair this architecture, configure SSH/DNS/HTTPS/CMS/automatic publishing/backups, or guide a beginner through the required VNC and dashboard steps.
---

# Build an Astro + Directus Content Hub

Build this architecture:

```text
Visitor -> Cloudflare Pages -> Astro static site
Editor  -> admin.example.com -> OpenResty -> Directus -> PostgreSQL
Images  -> img.example.com -> Cloudflare R2
Admin   -> panel.example.com -> OpenResty -> 1Panel
Publish -> Directus Flow -> Pages Deploy Hook -> Astro rebuild
```

Keep the VPS responsible for administration and dynamic data only. Keep normal page traffic on Pages/CDN.

## Non-negotiable safety rules

1. Never ask the user to paste root, 1Panel, Directus, database, R2, GitHub, Cloudflare, private-key, or deploy-hook secrets into chat.
2. Never reset or rotate any password, username, SSH key, secure entrance, API token, or recovery setting without explicit authorization for that exact credential.
3. Make the user enter secrets personally in the provider VNC console or official dashboard. Give placeholders, not real secret values.
4. Before disabling SSH password authentication, verify public-key login in a second independent session. Keep provider VNC available as recovery.
5. Treat the provider VNC console and SSH as separate access paths. SSH hardening must not remove the VNC recovery path.
6. Do not expose PostgreSQL, Directus port 8055, or 1Panel's management port publicly after reverse proxying works.
7. Back up before upgrades, migrations, certificate changes, proxy rewrites, database changes, or domain retirement.
8. Migrate consumers and verify them before retiring an old API hostname.
9. Preserve existing user changes. Inspect before editing, validate configuration, then reload rather than restart when possible.
10. Redact IPs, security entrances, tokens, passwords, private keys, hook URLs, and database dumps from reports and logs.

## Establish the contract

Collect only non-secret facts:

- VPS OS, CPU, RAM, disk, bandwidth, public IP, SSH port
- domain and Cloudflare DNS status
- GitHub and Cloudflare account availability
- desired root, admin, panel, and image hostnames
- whether R2 will store images
- whether the user can open the provider VNC console

Explain the responsibility split before changing anything:

| User-only action | Agent action |
|---|---|
| Enter or change passwords in VNC | Inspect system and propose commands |
| Approve Cloudflare/GitHub authorization | Configure server after authorization |
| Create/copy R2 and deploy-hook secrets | Provide secure placeholders and validate connectivity |
| Enable MFA and store recovery codes | Verify that MFA does not break automation |
| Confirm destructive deletion | Back up, delete exact target, verify result |

Maintain a phased plan. Stop at every user-only gate and continue only after the user reports completion.

## Phase 1: User secures VNC recovery

Tell the user to open the VPS provider's VNC/web console and log in as root with the supplier-issued password. The user, not the Agent, must run:

```bash
passwd root
```

Explain that Linux does not display password characters. The first prompt is the new password and the second is confirmation. Require a unique password stored in a password manager.

Have the user record privately:

- provider login and MFA recovery
- root VNC password
- server IP and rescue/reinstall path

Do not continue if VNC access is unverified.

## Phase 2: Establish SSH keys

Generate an Ed25519 key locally if the user has none. On Windows PowerShell:

```powershell
ssh-keygen -t ed25519 -a 64 -f $env:USERPROFILE\.ssh\content_hub
```

Keep the private key local. Show only the `.pub` content for installation. Have the user add the public key from VNC with separate commands so pasted commands cannot merge:

```bash
mkdir -p /root/.ssh
chmod 700 /root/.ssh
nano /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

Open a second terminal and verify key login before closing VNC. Diagnose with:

```bash
sshd -T | grep -E 'pubkeyauthentication|passwordauthentication|permitrootlogin|authorizedkeysfile'
```

Only after successful verification, create an SSH drop-in that enables public keys and disables password and keyboard-interactive SSH authentication. Validate with `sshd -t`, reload SSH, and test again. Keep the existing session open until the new test succeeds.

## Phase 3: Prepare the VPS

Inspect OS, disk, memory, listening ports, firewall, time, and existing workloads. For a 2 GB VPS, add about 2 GB swap if none exists. Then:

- update packages;
- set timezone;
- enable UFW with only SSH, 80, and 443;
- rate-limit SSH;
- install and enable Fail2ban;
- enable unattended security upgrades;
- leave room for Docker images and backups.

Do not enable UFW before confirming the SSH allow rule.

## Phase 4: Install 1Panel and Docker

Use the current official 1Panel v2 installation documentation. Prefer interactive installation because the user must choose credentials personally.

At the VNC gate, require the user to choose and enter:

- panel port, such as `18080`;
- a non-default username;
- a unique panel password;
- a random 3–30 character security entrance;
- whether the installer should install Docker.

Do not select these values for the user and do not run `1pctl update username` or `1pctl update password` unless explicitly asked. The user may inspect their own entrance from VNC with:

```bash
1pctl user-info
```

Never reproduce that output in chat. Verify the panel locally and confirm Docker is healthy.

## Phase 5: Configure DNS and origin HTTPS

Have the user add these records in Cloudflare:

```text
A      admin   -> VPS_IPV4
A      panel   -> VPS_IPV4
CNAME  www     -> apex domain or Pages target
```

Add the main domain through the Pages project's Custom domains screen, not by guessing records. Use DNS-only temporarily when direct origin troubleshooting is required; enable the orange cloud after origin HTTPS works. Set SSL/TLS mode to Full (strict).

Install OpenResty and obtain a valid origin certificate, commonly with Certbot. Configure:

- `admin.example.com` -> `127.0.0.1:8055`
- `panel.example.com` -> `127.0.0.1:18080`
- HTTP ACME challenge and HTTPS redirect
- WebSocket upgrade headers
- realistic upload and proxy timeouts

Run `openresty -t` before every reload. Verify public HTTPS before closing the panel port in UFW. Redirect the panel root to its private entrance without disclosing the entrance.

## Phase 6: Create Directus and PostgreSQL

Pin explicit image versions. Use a dedicated Compose directory and persistent PostgreSQL bind mount. Publish Directus only to localhost:

```yaml
ports:
  - "127.0.0.1:8055:8055"
```

Keep PostgreSQL port 5432 inside the Compose network with no host publishing.

Before first bootstrap, make the user create the secret environment file personally in VNC. Include placeholders for:

```text
POSTGRES_DB=directus
POSTGRES_USER=directus
POSTGRES_PASSWORD=<USER_GENERATED_DATABASE_PASSWORD>
DIRECTUS_KEY=<USER_GENERATED_RANDOM_VALUE>
DIRECTUS_SECRET=<USER_GENERATED_RANDOM_VALUE>
ADMIN_EMAIL=<USER_EMAIL>
ADMIN_PASSWORD=<USER_CHOSEN_DIRECTUS_PASSWORD>
PUBLIC_URL=https://admin.example.com
```

Set the file to mode 600. Do not commit it. Directus uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` only to create the first administrator during bootstrap; changing these later does not reliably change an existing account. Change existing credentials from Directus account settings or the supported CLI only with authorization.

Start Compose, confirm both containers are healthy, and verify the API through OpenResty. Explain that 1Panel's database screen will not list this PostgreSQL instance because Compose, not 1Panel's database manager, owns it. It appears under Containers.

## Phase 7: Configure R2

Have the user create an R2 bucket and scoped credentials in the Cloudflare dashboard. Grant only the required bucket permissions. The user enters credentials in the server's protected environment file; never accept them in chat.

Bind `img.example.com` from the bucket's Settings -> Custom Domains page. Do not use the development `r2.dev` URL for production. Upload and delete a harmless test object before configuring Directus storage.

## Phase 8: Build the Directus content model

Create at least:

- `posts`: status, sort, featured, title, slug, published_at, excerpt, content, tags, reading_time, accent, category, series, cover_image;
- `categories`: name, slug, description, color, sort;
- `series`: title, slug, description, cover_image, sort;
- `projects`: title, slug, description, URL, cover_image, sort;
- singleton `site_settings`: site name, hero copy, about text, footer text.

Create a public policy that can read only published posts and only fields required by the frontend. Do not expose password, token, status-control, or system fields. Test public requests without an admin token.

## Phase 9: Build and deploy Astro

Configure Astro to read content at build time from:

```text
https://admin.example.com/items/posts
```

Generate static routes from each post slug. Include article lists, details, 404, RSS, sitemap, metadata, accessible navigation, responsive layout, and image handling. Keep administrator tokens out of browser bundles.

Run checks and a production build locally. Push to GitHub only after the user authorizes repository creation or use. Connect the repository in Cloudflare Pages, set the supported Node version, configure the build command, and add the apex custom domain.

## Phase 10: Connect automatic publishing

Create a Cloudflare Pages Deploy Hook. The user copies it directly into a protected Directus Flow request operation; do not echo or persist the URL in reports.

Create a Directus Flow that listens for create, update, and delete actions on content collections and POSTs to the hook. Perform an end-to-end test:

1. Save an unchanged harmless field or create a test draft.
2. Confirm the Directus action succeeds.
3. Confirm the Flow request returns 2xx.
4. Confirm Pages finishes a new deployment.
5. Confirm a published page is HTTP 200 and a draft is absent.

If a hostname is being retired, update source defaults and Pages environment variables before disabling the hostname. Test with the stale variable deliberately to ensure migration resilience.

## Phase 11: Backups and recovery

Back up PostgreSQL with `pg_dump`, Compose configuration without secrets, and required uploaded/local data. Encrypt or restrict backup permissions. Schedule daily backups, retain at least 14 days, and rotate logs.

Perform a restore rehearsal into a temporary database. Count restored records, then remove only the verified temporary database. A backup is not complete until restoration has been tested.

## Phase 12: Final hardening and handoff

After all domain tests pass:

- block public panel and Directus container ports;
- keep only 22, 80, and 443 in UFW;
- verify SSH effective configuration;
- enable MFA for Cloudflare, GitHub, Directus, and 1Panel where available;
- verify certificate renewal;
- verify Fail2ban and automatic updates;
- confirm backups and restore notes;
- remove temporary API tokens and secret files;
- delete only unused Docker images, never active containers or data volumes.

Deliver a concise map of URLs, ownership, backup location, update workflow, and recovery steps. Never include real credentials or the panel security entrance.

## Stop conditions

Pause and ask the user when:

- VNC recovery is unavailable;
- a password or MFA choice is required;
- DNS or account authorization requires dashboard interaction;
- an existing service or dirty configuration conflicts with the plan;
- a destructive action is needed;
- key login has not been independently verified;
- a build or restore test fails three times for the same reason.
