-- ============================================================
-- Rise of Fronts - Game Systems Schema
-- Units, Combat, Tech, Resources, Diplomacy, Leaders, Investments
-- ============================================================

-- ============================================================
-- LEADERS
-- ============================================================
CREATE TABLE leaders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    nation_id           UUID REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    name                TEXT NOT NULL,
    ideology_id         TEXT NOT NULL,
    pp_gain_base        REAL NOT NULL DEFAULT 3.0,
    research_bonus      REAL NOT NULL DEFAULT 0.0,
    military_bonus      REAL NOT NULL DEFAULT 0.0,
    economic_bonus      REAL NOT NULL DEFAULT 0.0,
    corruption_modifier REAL NOT NULL DEFAULT 0.0,
    war_exhaustion_mod  REAL NOT NULL DEFAULT 0.0,
    traits              TEXT[] DEFAULT '{}',
    term_start_date     DATE NOT NULL DEFAULT '2025-01-01',
    term_length_years   INT NOT NULL DEFAULT 4,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaders_nation ON leaders(nation_id);
CREATE INDEX idx_leaders_session ON leaders(session_id);

-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE units (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    nation_id           UUID REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    province_id         UUID REFERENCES provinces(id) NOT NULL,

    unit_type           TEXT NOT NULL CHECK (unit_type IN (
                            'infantry','motorized_infantry','mechanized_infantry',
                            'tank','light_tank','heavy_tank','tank_destroyer',
                            'artillery','rocket_artillery','anti_air','sam_battery',
                            'special_forces','paratroopers',
                            'fighter','jet_fighter','bomber','heavy_bomber','stealth_bomber',
                            'transport_ship','destroyer','cruiser','submarine',
                            'battleship','aircraft_carrier','supercarrier',
                            'nuclear_missile','h_bomb','mirv'
                        )),
    domain              TEXT NOT NULL DEFAULT 'land' CHECK (domain IN ('land','sea','air','special')),
    name                TEXT,

    -- Combat stats (0-100 scale, 100 = full)
    strength            INT NOT NULL DEFAULT 1000 CHECK (strength >= 0),
    max_strength        INT NOT NULL DEFAULT 1000,
    experience          INT NOT NULL DEFAULT 0 CHECK (experience BETWEEN 0 AND 100),
    morale              INT NOT NULL DEFAULT 80 CHECK (morale BETWEEN 0 AND 120),
    organization        INT NOT NULL DEFAULT 80 CHECK (organization BETWEEN 0 AND 100),
    equipment           INT NOT NULL DEFAULT 80 CHECK (equipment BETWEEN 0 AND 100),
    supply_status       INT NOT NULL DEFAULT 100 CHECK (supply_status BETWEEN 0 AND 100),

    -- Movement
    movement_target_id  UUID REFERENCES provinces(id),
    movement_path       UUID[] DEFAULT '{}',
    movement_progress   REAL NOT NULL DEFAULT 0.0,
    days_to_arrive      INT NOT NULL DEFAULT 0,

    -- State
    army_id             UUID,
    in_combat           BOOLEAN NOT NULL DEFAULT false,
    combat_id           UUID,
    is_entrenched       BOOLEAN NOT NULL DEFAULT false,
    entrenchment_level  INT NOT NULL DEFAULT 0 CHECK (entrenchment_level BETWEEN 0 AND 5),
    is_routing          BOOLEAN NOT NULL DEFAULT false,
    has_moved_this_tick BOOLEAN NOT NULL DEFAULT false,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_units_session ON units(session_id);
CREATE INDEX idx_units_nation ON units(nation_id);
CREATE INDEX idx_units_province ON units(province_id);
CREATE INDEX idx_units_combat ON units(combat_id) WHERE combat_id IS NOT NULL;

-- ============================================================
-- COMBAT
-- ============================================================
CREATE TABLE combats (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id              UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    province_id             UUID REFERENCES provinces(id) NOT NULL,

    attacker_nation_id      UUID REFERENCES nations(id) NOT NULL,
    defender_nation_id      UUID REFERENCES nations(id) NOT NULL,

    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','attacker_won','defender_won','draw','retreated','siege')),

    -- Terrain & modifiers cached at combat start
    terrain_type            TEXT NOT NULL DEFAULT 'plains',
    terrain_modifier        REAL NOT NULL DEFAULT 1.0,
    attacker_tech_bonus     REAL NOT NULL DEFAULT 1.0,
    defender_tech_bonus     REAL NOT NULL DEFAULT 1.0,
    fort_level              INT NOT NULL DEFAULT 0,

    -- Running totals
    attacker_losses         INT NOT NULL DEFAULT 0,
    defender_losses         INT NOT NULL DEFAULT 0,
    attacker_morale_damage  REAL NOT NULL DEFAULT 0,
    defender_morale_damage  REAL NOT NULL DEFAULT 0,

    -- Timestamps
    started_tick            BIGINT NOT NULL,
    ended_tick              BIGINT,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at                TIMESTAMPTZ,

    -- Log of each combat day
    combat_log              JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_combats_session ON combats(session_id);
CREATE INDEX idx_combats_province ON combats(province_id);
CREATE INDEX idx_combats_status ON combats(status) WHERE status = 'active';

-- ============================================================
-- TECH RESEARCH
-- ============================================================
CREATE TABLE tech_research (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    nation_id       UUID REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    tech_id         TEXT NOT NULL,
    tree_id         TEXT NOT NULL CHECK (tree_id IN (
                        'infantry','tank','support','naval',
                        'aircraft','economy','research','political'
                    )),
    tier            INT NOT NULL CHECK (tier BETWEEN 1 AND 5),
    status          TEXT NOT NULL DEFAULT 'locked'
                    CHECK (status IN ('locked','available','researching','completed')),
    progress        REAL NOT NULL DEFAULT 0.0,
    research_cost   INT NOT NULL,
    started_tick    BIGINT,
    completed_tick  BIGINT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    UNIQUE(nation_id, tech_id)
);

CREATE INDEX idx_tech_research_nation ON tech_research(nation_id);
CREATE INDEX idx_tech_research_session ON tech_research(session_id);
CREATE INDEX idx_tech_research_status ON tech_research(nation_id, status);

-- ============================================================
-- RESOURCE STOCKPILES
-- ============================================================
CREATE TABLE resource_stockpiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    nation_id           UUID REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    resource_type       TEXT NOT NULL CHECK (resource_type IN (
                            -- Raw
                            'iron','titanium','copper','gold','phosphate',
                            'tungsten','uranium','oil','aluminum','chromium','diamond',
                            -- Processed
                            'steel','motor_parts','electronics','fertilizer',
                            'enriched_uranium','consumer_goods','aircraft_parts'
                        )),
    stockpile           REAL NOT NULL DEFAULT 0.0,
    production_rate     REAL NOT NULL DEFAULT 0.0,
    consumption_rate    REAL NOT NULL DEFAULT 0.0,
    trade_balance       REAL NOT NULL DEFAULT 0.0,
    max_stockpile       REAL NOT NULL DEFAULT 10000.0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(nation_id, resource_type)
);

CREATE INDEX idx_resources_nation ON resource_stockpiles(nation_id);
CREATE INDEX idx_resources_session ON resource_stockpiles(session_id);

-- ============================================================
-- DIPLOMACY — WARS
-- ============================================================
CREATE TABLE wars (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id              UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    name                    TEXT,
    attacker_nation_id      UUID REFERENCES nations(id) NOT NULL,
    defender_nation_id      UUID REFERENCES nations(id) NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','white_peace','attacker_won','defender_won','truce')),
    casus_belli             TEXT NOT NULL DEFAULT 'conquest',
    attacker_war_score      REAL NOT NULL DEFAULT 0.0,
    defender_war_score      REAL NOT NULL DEFAULT 0.0,
    started_tick            BIGINT NOT NULL,
    ended_tick              BIGINT,
    peace_deal              JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wars_session ON wars(session_id);
CREATE INDEX idx_wars_attacker ON wars(attacker_nation_id);
CREATE INDEX idx_wars_defender ON wars(defender_nation_id);

-- ============================================================
-- DIPLOMACY — ALLIANCES
-- ============================================================
CREATE TABLE alliances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    name            TEXT,
    leader_id       UUID REFERENCES nations(id) NOT NULL,
    member_ids      UUID[] NOT NULL DEFAULT '{}',
    alliance_type   TEXT NOT NULL DEFAULT 'defensive'
                    CHECK (alliance_type IN ('defensive','offensive','non_aggression','trade')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DIPLOMACY — WAR JUSTIFICATION (Casus Belli Fabrication)
-- ============================================================
CREATE TABLE war_justifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    fabricator_id       UUID REFERENCES nations(id) NOT NULL,
    target_id           UUID REFERENCES nations(id) NOT NULL,
    casus_belli_type    TEXT NOT NULL DEFAULT 'conquest',
    progress            REAL NOT NULL DEFAULT 0.0 CHECK (progress BETWEEN 0 AND 100),
    time_to_complete    INT NOT NULL DEFAULT 90,   -- in-game days
    stability_cost      REAL NOT NULL DEFAULT 10.0,
    completed           BOOLEAN NOT NULL DEFAULT false,
    used                BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DIPLOMACY — TRADE DEALS
-- ============================================================
CREATE TABLE trade_deals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    proposer_id         UUID REFERENCES nations(id) NOT NULL,
    accepter_id         UUID REFERENCES nations(id) NOT NULL,
    status              TEXT NOT NULL DEFAULT 'proposed'
                        CHECK (status IN ('proposed','active','rejected','cancelled','expired')),
    offer_resources     JSONB NOT NULL DEFAULT '{}',
    offer_money         REAL NOT NULL DEFAULT 0,
    demand_resources    JSONB NOT NULL DEFAULT '{}',
    demand_money        REAL NOT NULL DEFAULT 0,
    duration_ticks      INT,
    started_tick        BIGINT,
    expires_tick        BIGINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_deals_session ON trade_deals(session_id);

-- ============================================================
-- DIPLOMACY — OPINIONS
-- ============================================================
CREATE TABLE nation_opinions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    from_nation_id  UUID REFERENCES nations(id) NOT NULL,
    to_nation_id    UUID REFERENCES nations(id) NOT NULL,
    opinion         INT NOT NULL DEFAULT 0 CHECK (opinion BETWEEN -200 AND 200),
    modifiers       JSONB NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(from_nation_id, to_nation_id)
);

-- ============================================================
-- INVESTMENTS
-- ============================================================
CREATE TABLE investments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    nation_id           UUID REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    city_id             UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    investment_type     TEXT NOT NULL CHECK (investment_type IN (
                            'infrastructure','industrial','military',
                            'civic','noble','research','healthcare'
                        )),
    name                TEXT NOT NULL,
    effect_description  TEXT,
    modifiers           JSONB NOT NULL DEFAULT '{}',
    cost                REAL NOT NULL,
    duration_days       INT NOT NULL,
    started_date        DATE NOT NULL,
    expires_date        DATE NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investments_nation ON investments(nation_id);
CREATE INDEX idx_investments_city ON investments(city_id);
CREATE INDEX idx_investments_active ON investments(session_id, is_active) WHERE is_active = true;

-- ============================================================
-- PUPPETS
-- ============================================================
CREATE TABLE puppets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    overlord_id     UUID REFERENCES nations(id) NOT NULL,
    puppet_id       UUID REFERENCES nations(id) NOT NULL,
    tribute_rate    REAL NOT NULL DEFAULT 0.3,
    autonomy        INT NOT NULL DEFAULT 30 CHECK (autonomy BETWEEN 0 AND 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, puppet_id)
);

-- ============================================================
-- NATION MODIFIERS (active buffs/debuffs from events, techs, policies)
-- ============================================================
CREATE TABLE nation_modifiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    nation_id       UUID REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    modifier_id     TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    modifiers       JSONB NOT NULL DEFAULT '{}',
    source          TEXT NOT NULL DEFAULT 'event',
    expires_tick    BIGINT,
    is_permanent    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_modifiers_nation ON nation_modifiers(nation_id);

-- ============================================================
-- GAME EVENTS LOG
-- ============================================================
CREATE TABLE game_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    tick        BIGINT NOT NULL,
    game_date   DATE NOT NULL,
    event_type  TEXT NOT NULL,
    nation_id   UUID REFERENCES nations(id),
    title       TEXT NOT NULL,
    description TEXT,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_session ON game_events(session_id);
CREATE INDEX idx_events_nation ON game_events(nation_id);
CREATE INDEX idx_events_tick ON game_events(session_id, tick);

-- ============================================================
-- RLS POLICIES — NEW TABLES
-- ============================================================
ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE combats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_stockpiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nation_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE puppets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nation_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Session-scoped visibility helper (reused pattern)
CREATE POLICY "Leaders visible to session members" ON leaders FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Units visible to session members" ON units FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Combats visible to session members" ON combats FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Tech visible to session members" ON tech_research FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Resources visible to session members" ON resource_stockpiles FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Wars visible to session members" ON wars FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Alliances visible to session members" ON alliances FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "War justifications visible to owner" ON war_justifications FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Trade deals visible to session members" ON trade_deals FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Opinions visible to session members" ON nation_opinions FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Investments visible to session members" ON investments FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Puppets visible to session members" ON puppets FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Modifiers visible to session members" ON nation_modifiers FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

CREATE POLICY "Events visible to session members" ON game_events FOR SELECT TO authenticated
    USING (session_id IN (SELECT session_id FROM nations WHERE user_id = auth.uid()));

-- ============================================================
-- REALTIME — enable for live game tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE combats;
ALTER PUBLICATION supabase_realtime ADD TABLE provinces;
ALTER PUBLICATION supabase_realtime ADD TABLE nations;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE wars;
ALTER PUBLICATION supabase_realtime ADD TABLE resource_stockpiles;
