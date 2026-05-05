-- ============================================================
-- AEW Fantasy Game — Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS & LEAGUES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  commissioner_id uuid not null references profiles(id),
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  max_gms int not null default 12,
  roster_size int not null default 15,
  active_roster_size int not null default 10,
  waiver_type text not null default 'priority', -- 'priority' only for now
  created_at timestamptz default now()
);

create table league_members (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz default now(),
  unique(league_id, profile_id)
);

-- ============================================================
-- WRESTLERS
-- ============================================================

create table wrestlers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null, -- url-friendly name for scraper matching
  image_url text,
  gender text not null default 'male', -- 'male' | 'female'
  is_active boolean not null default true, -- on the AEW roster
  is_custom boolean not null default false, -- user-created wrestler
  created_at timestamptz default now()
);

-- ============================================================
-- QUARTERS & DRAFTS
-- ============================================================

create table quarters (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  quarter_number int not null, -- 1, 2, 3, 4, 5...
  year int not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft', -- 'draft' | 'active' | 'completed'
  winner_member_id uuid references league_members(id),
  created_at timestamptz default now(),
  unique(league_id, year, quarter_number)
);

create table draft_sessions (
  id uuid primary key default uuid_generate_v4(),
  quarter_id uuid not null references quarters(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'active' | 'completed'
  current_pick int not null default 1, -- overall pick number
  pick_deadline timestamptz, -- when current pick expires
  snake_order jsonb not null default '[]', -- ordered array of member_ids for snake
  started_at timestamptz,
  completed_at timestamptz
);

create table draft_picks (
  id uuid primary key default uuid_generate_v4(),
  draft_session_id uuid not null references draft_sessions(id) on delete cascade,
  quarter_id uuid not null references quarters(id) on delete cascade,
  pick_number int not null, -- overall pick number (1-based)
  round int not null,
  pick_in_round int not null,
  member_id uuid not null references league_members(id),
  wrestler_id uuid references wrestlers(id), -- null if auto-picked
  is_auto_pick boolean not null default false,
  picked_at timestamptz,
  unique(draft_session_id, pick_number)
);

-- ============================================================
-- ROSTERS
-- ============================================================

create table rosters (
  id uuid primary key default uuid_generate_v4(),
  quarter_id uuid not null references quarters(id) on delete cascade,
  member_id uuid not null references league_members(id) on delete cascade,
  wrestler_id uuid not null references wrestlers(id),
  acquired_via text not null default 'draft', -- 'draft' | 'waiver' | 'trade'
  added_at timestamptz default now(),
  dropped_at timestamptz, -- null = still on roster
  unique(quarter_id, member_id, wrestler_id, dropped_at) -- allow re-adding after drop
);

-- ============================================================
-- WEEKLY LINEUPS
-- ============================================================

create table weeks (
  id uuid primary key default uuid_generate_v4(),
  quarter_id uuid not null references quarters(id) on delete cascade,
  week_number int not null,
  start_date date not null, -- Monday
  end_date date not null,   -- Sunday
  lineup_lock_at timestamptz not null, -- locks before Wednesday Dynamite
  unique(quarter_id, week_number)
);

create table lineups (
  id uuid primary key default uuid_generate_v4(),
  week_id uuid not null references weeks(id) on delete cascade,
  member_id uuid not null references league_members(id) on delete cascade,
  wrestler_id uuid not null references wrestlers(id),
  slot text not null default 'active', -- 'active' | 'bench'
  locked_at timestamptz, -- when the lineup was locked
  unique(week_id, member_id, wrestler_id)
);

-- ============================================================
-- SHOWS & RESULTS
-- ============================================================

create table shows (
  id uuid primary key default uuid_generate_v4(),
  name text not null, -- e.g. "AEW Dynamite", "Double or Nothing 2025"
  show_type text not null, -- 'tv' | 'ppv'
  air_date date not null,
  scoring_multiplier numeric not null default 1.0, -- 1.0 for TV, 2.0 for PPV
  scraped_at timestamptz -- null = not yet scraped
);

create table matches (
  id uuid primary key default uuid_generate_v4(),
  show_id uuid not null references shows(id) on delete cascade,
  match_order int not null, -- match number on the card
  match_type text not null default 'singles', -- 'singles' | 'tag' | 'trios' | 'battle_royal' | 'ladder' | etc.
  title_match boolean not null default false,
  title_name text, -- e.g. "AEW World Championship"
  duration_seconds int, -- match length in seconds
  notes text
);

create table match_participants (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  wrestler_id uuid not null references wrestlers(id),
  team int, -- null for singles, 1 or 2 for tag/trios (winning team = 1)
  outcome text not null, -- 'win' | 'loss' | 'draw' | 'no_contest'
  win_method text, -- 'pinfall' | 'submission' | 'dq' | 'countout' | 'referee_stoppage' | null
  is_title_change boolean not null default false
);

create table segments (
  id uuid primary key default uuid_generate_v4(),
  show_id uuid not null references shows(id) on delete cascade,
  segment_type text not null, -- 'promo' | 'vignette' | 'backstage' | 'run_in'
  description text
);

create table segment_participants (
  id uuid primary key default uuid_generate_v4(),
  segment_id uuid not null references segments(id) on delete cascade,
  wrestler_id uuid not null references wrestlers(id)
);

-- ============================================================
-- SCORING
-- ============================================================

create table scoring_rules (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  action text not null,         -- e.g. 'win_tv', 'loss_tv', 'title_win_ppv'
  points numeric not null,
  description text,
  unique(league_id, action)
);

create table wrestler_scores (
  id uuid primary key default uuid_generate_v4(),
  week_id uuid not null references weeks(id) on delete cascade,
  show_id uuid not null references shows(id) on delete cascade,
  wrestler_id uuid not null references wrestlers(id),
  points_breakdown jsonb not null default '[]', -- [{action, points, description}]
  total_points numeric not null default 0,
  calculated_at timestamptz default now(),
  unique(week_id, show_id, wrestler_id)
);

create table member_scores (
  id uuid primary key default uuid_generate_v4(),
  week_id uuid not null references weeks(id) on delete cascade,
  member_id uuid not null references league_members(id) on delete cascade,
  total_points numeric not null default 0,
  calculated_at timestamptz default now(),
  unique(week_id, member_id)
);

-- ============================================================
-- WAIVERS & TRADES
-- ============================================================

create table waiver_requests (
  id uuid primary key default uuid_generate_v4(),
  week_id uuid not null references weeks(id) on delete cascade,
  member_id uuid not null references league_members(id) on delete cascade,
  add_wrestler_id uuid not null references wrestlers(id),
  drop_wrestler_id uuid references wrestlers(id), -- null if roster not full
  priority int not null, -- lower = higher priority (1 = best waiver position)
  status text not null default 'pending', -- 'pending' | 'processed' | 'failed'
  processed_at timestamptz,
  fail_reason text,
  created_at timestamptz default now()
);

create table trades (
  id uuid primary key default uuid_generate_v4(),
  quarter_id uuid not null references quarters(id) on delete cascade,
  proposing_member_id uuid not null references league_members(id),
  receiving_member_id uuid not null references league_members(id),
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected' | 'vetoed' | 'cancelled'
  commissioner_reviewed boolean not null default false,
  proposed_at timestamptz default now(),
  resolved_at timestamptz
);

create table trade_items (
  id uuid primary key default uuid_generate_v4(),
  trade_id uuid not null references trades(id) on delete cascade,
  from_member_id uuid not null references league_members(id),
  wrestler_id uuid not null references wrestlers(id)
);

-- ============================================================
-- ACCOLADES
-- ============================================================

create table gm_belts (
  id uuid primary key default uuid_generate_v4(),
  quarter_id uuid not null references quarters(id) on delete cascade,
  member_id uuid not null references league_members(id) on delete cascade,
  total_points numeric not null,
  awarded_at timestamptz default now(),
  unique(quarter_id)
);

-- ============================================================
-- DEFAULT SCORING RULES (inserted per league on creation)
-- ============================================================
-- These are inserted via application logic when a league is created,
-- using these values as defaults that commissioners can customize.

-- TV Scoring:
--   win_tv: 10
--   loss_tv: 2
--   draw_tv: 5
--   title_win_tv: 15
--   title_defense_tv: 8
--   title_match_loss_tv: 5
--   submission_bonus_tv: 3
--   match_10min_bonus_tv: 3
--   match_20min_bonus_tv: 6
--   promo_tv: 3

-- PPV Scoring (2x multiplier applied via scoring_multiplier on shows):
--   Same actions, multiplied by show scoring_multiplier

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table wrestlers enable row level security;
alter table quarters enable row level security;
alter table draft_sessions enable row level security;
alter table draft_picks enable row level security;
alter table rosters enable row level security;
alter table weeks enable row level security;
alter table lineups enable row level security;
alter table shows enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;
alter table segments enable row level security;
alter table segment_participants enable row level security;
alter table scoring_rules enable row level security;
alter table wrestler_scores enable row level security;
alter table member_scores enable row level security;
alter table waiver_requests enable row level security;
alter table trades enable row level security;
alter table trade_items enable row level security;
alter table gm_belts enable row level security;

-- Profiles: users can read all, only update their own
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Wrestlers: public read, only service role writes (scraper)
create policy "wrestlers_select" on wrestlers for select using (true);

-- Leagues: members can read their leagues
create policy "leagues_select" on leagues for select
  using (id in (select league_id from league_members where profile_id = auth.uid()));
create policy "leagues_insert" on leagues for insert with check (commissioner_id = auth.uid());

-- League members: members can read all members in their leagues
create policy "league_members_select" on league_members for select
  using (league_id in (select league_id from league_members where profile_id = auth.uid()));
create policy "league_members_insert" on league_members for insert
  with check (profile_id = auth.uid());

-- Shows, matches, results: public read
create policy "shows_select" on shows for select using (true);
create policy "matches_select" on matches for select using (true);
create policy "match_participants_select" on match_participants for select using (true);
create policy "segments_select" on segments for select using (true);
create policy "segment_participants_select" on segment_participants for select using (true);
create policy "wrestler_scores_select" on wrestler_scores for select using (true);

-- Quarters, weeks, rosters, scores: league members only
create policy "quarters_select" on quarters for select
  using (league_id in (select league_id from league_members where profile_id = auth.uid()));

create policy "weeks_select" on weeks for select
  using (quarter_id in (select id from quarters where league_id in
    (select league_id from league_members where profile_id = auth.uid())));

create policy "rosters_select" on rosters for select
  using (member_id in (select id from league_members where profile_id = auth.uid())
    or member_id in (select id from league_members where league_id in
      (select league_id from league_members where profile_id = auth.uid())));

-- Lineups: members can read all lineups in their league, only write their own
create policy "lineups_select" on lineups for select
  using (member_id in (select id from league_members where league_id in
    (select league_id from league_members where profile_id = auth.uid())));
create policy "lineups_insert" on lineups for insert
  with check (member_id in (select id from league_members where profile_id = auth.uid()));
create policy "lineups_update" on lineups for update
  using (member_id in (select id from league_members where profile_id = auth.uid()));

-- Member scores, GM belts: league members can read
create policy "member_scores_select" on member_scores for select
  using (member_id in (select id from league_members where league_id in
    (select league_id from league_members where profile_id = auth.uid())));
create policy "gm_belts_select" on gm_belts for select
  using (member_id in (select id from league_members where league_id in
    (select league_id from league_members where profile_id = auth.uid())));

-- Draft: league members can read, only their own picks to insert
create policy "draft_sessions_select" on draft_sessions for select
  using (quarter_id in (select id from quarters where league_id in
    (select league_id from league_members where profile_id = auth.uid())));
create policy "draft_picks_select" on draft_picks for select
  using (quarter_id in (select id from quarters where league_id in
    (select league_id from league_members where profile_id = auth.uid())));

-- Waivers: members can read/write their own
create policy "waiver_requests_select" on waiver_requests for select
  using (member_id in (select id from league_members where league_id in
    (select league_id from league_members where profile_id = auth.uid())));
create policy "waiver_requests_insert" on waiver_requests for insert
  with check (member_id in (select id from league_members where profile_id = auth.uid()));

-- Trades: members in the league can read, parties can insert
create policy "trades_select" on trades for select
  using (quarter_id in (select id from quarters where league_id in
    (select league_id from league_members where profile_id = auth.uid())));
create policy "trades_insert" on trades for insert
  with check (proposing_member_id in (select id from league_members where profile_id = auth.uid()));

create policy "trade_items_select" on trade_items for select
  using (trade_id in (select id from trades where quarter_id in
    (select id from quarters where league_id in
      (select league_id from league_members where profile_id = auth.uid()))));

-- Scoring rules: league members can read
create policy "scoring_rules_select" on scoring_rules for select
  using (league_id in (select league_id from league_members where profile_id = auth.uid()));
