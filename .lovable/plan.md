# Terra Explorer — Phase 1 Build Plan

Goal: transform Terra Explorer into a premium mobile-first exploration app without breaking any existing 3D/terrain/mod/auth functionality. Everything currently on `/` (Scene3D, Toolbar, mods, real-earth, play mode, measurement) stays intact.

## Architecture changes

- Introduce an `AppShell` wrapper with a persistent glass **bottom navigation bar** (Explore / Map / Discover / Mods / Profile) shown on all main routes except the immersive 3D `/` explore view and `/auth`.
- Move current `Index.tsx` (3D scene) behind route `/explore` (kept as full-screen immersive). New `/` becomes a **Home** with hero, featured biomes, quick actions, stats preview.
- Add an **immersive loading screen** (animated globe, progress, rotating tips) shown once per session on first mount.

## New routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Glass hero, featured locations, continue-exploring card, quick stats |
| `/explore` | Existing 3D scene (moved from `/`) | Untouched functionality |
| `/map` | Map | 2D world map picker → deep-links into `/explore` with biome/real-earth preset |
| `/discover` | Discover | Landmarks, waterfalls, mountains, parks, monuments, trending; search + filter chips |
| `/mods` | Mods (dedicated) | Full-page mod manager; import .zip/.pak, enable/disable, version check, validation |
| `/profile` | Profile | Avatar, username, XP/level, stats, badges, donations, mods, settings link |
| `/settings` | Settings | Graphics, FPS, music vol, SFX, language, theme, a11y |
| `/support` | Existing donation page — redesigned with premium glass, multi-provider tabs, tier badges, thank-you animation |

## Gamification (backend)

New tables (all with GRANTs + RLS `auth.uid() = user_id`):
- `user_progress` — xp int, level int, last_daily_reward_at timestamptz
- `achievements` — id, code, title, description, icon, xp_reward (seed data)
- `user_achievements` — user_id, achievement_id, unlocked_at
- `daily_rewards_log` — user_id, day, reward_type, amount
- `inventory_items` — user_id, item_code, quantity, metadata jsonb
- `character_customization` — user_id, skin, hat, trail, color (single row per user)

Client hooks: `useProgress`, `useAchievements`, `useDailyReward`, `useInventory`, `useCharacter`. Award XP hooks fire on: biome switch, collectible pickup, distance milestones, donation.

## Donation redesign

- Tabbed provider grid: UPI QR, UPI ID copy, GPay, PhonePe, Paytm, Card, PayPal
- Tier badges (Bronze ≥₹99, Silver ≥₹499, Gold ≥₹1999, Platinum ≥₹4999) computed from lifetime donations
- Confetti + animated checkmark thank-you overlay (reuse existing `ThankYouOverlay`, upgrade visuals)
- Card / PayPal shown as "coming soon" if no provider connected (won't fabricate real charges)

## Settings

Client-only, persisted in `localStorage` + synced to `user_settings` table (nullable, optional):
- Graphics: Low / Medium / High / Ultra → wired into existing `terrain-quality.ts`
- FPS limit: 30 / 60 / 120 / Unlimited
- Music + SFX volume sliders → wired into `ambient-audio.ts` and `sfx-engine.ts`
- Language: EN / HI / ES (scaffold with i18n keys; only EN fully populated)
- Theme: Dark / Light / System
- Accessibility: reduced motion, high contrast, larger text

## Design system

- Add glass utility classes in `index.css`: `.glass-card`, `.glass-nav`, `.premium-gradient`, `.tier-{bronze,silver,gold,platinum}`
- Framer-motion for page transitions, nav item taps, card hovers, thank-you burst
- Consistent 16px radius, 12/16/24 spacing scale, subtle border `border-white/10`
- Haptics via `navigator.vibrate(10)` on nav taps and reward unlocks (guarded)

## File map (new)

```
src/
  components/
    shell/AppShell.tsx, BottomNav.tsx, LoadingScreen.tsx
    home/Hero.tsx, FeaturedBiomes.tsx, ContinueCard.tsx, QuickStats.tsx
    discover/DiscoverGrid.tsx, LocationCard.tsx, CategoryChips.tsx, SearchBar.tsx
    profile/ProfileHeader.tsx, LevelBar.tsx, BadgeGrid.tsx, DonationHistory.tsx, ModCollection.tsx
    mods/ModsPage.tsx (wraps existing ModManager, adds validation UI)
    settings/SettingsPage.tsx, GraphicsSection.tsx, AudioSection.tsx, A11ySection.tsx
    gamification/XpToast.tsx, DailyRewardModal.tsx, AchievementUnlock.tsx
    support/(redesigned) ProviderTabs.tsx, TierBadges.tsx (upgrade existing)
  hooks/
    use-progress.ts, use-achievements.ts, use-daily-reward.ts,
    use-inventory.ts, use-character.ts, use-settings.ts, use-haptics.ts
  lib/
    discover-locations.ts (curated dataset), tier-utils.ts, mod-validator.ts
  pages/
    Home.tsx (new /), Explore.tsx (moved Index), Map.tsx, Discover.tsx,
    Mods.tsx, Profile.tsx, Settings.tsx
```

## Migrations

One migration adds all 6 gamification tables + `user_settings` + seed achievements + GRANTs + RLS + triggers to `handle_new_user` (extend existing function to also insert into `user_progress` and `character_customization`).

## Preservation guarantees

- `src/pages/Index.tsx` → renamed to `Explore.tsx`, zero logic changes
- All existing components (Scene3D, Toolbar, ModManager, PaymentSection, etc.) reused as-is
- Existing routes `/support`, `/auth`, `/dashboard`, `/.lovable/oauth/consent` remain
- Existing tables untouched; only additive migrations

## Out of scope for this build (future turns)

- Real Card/PayPal payment processing (needs Stripe/Paddle connection)
- Full i18n translations beyond EN scaffold
- Weather/day-night/ambient sound *system extensions* (existing systems kept; deeper procedural weather is Phase 2)
- Map page will start with a static SVG world + hotspots; interactive Mapbox is Phase 2
