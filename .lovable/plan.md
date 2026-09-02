# Reset accounts + finish secure password change

## Current state (verified)

Four accounts exist today:

| Email | Role |
| --- | --- |
| hetalmodi831982@gmail.com | admin |
| karmsuthar24@gmail.com | none |
| testuser_e2e@example.com | none |
| rishitmodi2310@gmail.com | super_admin |

The secure password-change work is half-finished: the backend function and the UI card both exist, but the card is not rendered anywhere and the function is not deployed yet.

## Step 1 — Wipe all accounts

Delete every existing user. All linked data (profile, stats, progress, roles, settings, screenshots, feedback, donations) is removed along with each account, so the app starts from an empty user base. This cannot be undone.

## Step 2 — Auto-grant super admin on your signup

So that the first account you create is not locked out of `/admin`, a rule is added: when an account signs up with `rishitmodi2310@gmail.com`, it automatically receives the `super_admin` role. Every other new signup gets no elevated role. You then sign up normally at `/auth` and `/admin` opens immediately.

## Step 3 — Finish the secure password change flow

- Show the password-change card inside Admin → Role management, above the existing "Set super admin password" block.
- Deploy the change-password backend function.
- It requires your current password before setting a new one (min 10 characters, must differ), and records both successes and failed attempts in the audit log with your email, IP and timestamp.

## Step 4 — Verify

- Confirm the user list is empty, then that your fresh signup lands in `/admin` as super admin.
- Confirm a wrong current password is rejected and logged, and a correct one succeeds and shows up in Activity Logs.

## Technical notes

- User deletion runs through the auth admin API / `auth.users` cascade; `public` tables reference users with `on delete cascade`.
- The auto-grant is added to the existing `handle_new_user` trigger, guarded by an exact email match; roles remain in `user_roles` only.
- No credentials are written to code or chat.
