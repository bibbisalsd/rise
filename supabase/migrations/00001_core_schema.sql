-- ============================================================
-- Rise of Fronts - Core Schema
-- Sessions, Nations, Provinces, Adjacency
-- ============================================================

-- GAME SESSIONS
CREATE TABLE game_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    host_user_id    UUID REFERENCES auth.users(id) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'lobby'
                    CHECK (status IN ('lobby','active','paused','finished')),
    max_players     INT NOT NULL DEFAULT 8,
    current_tick    BIGINT NOT NULL DEFAULT 0,
    game_date       DATE NOT NULL DEFAULT '2025-01-01',
    speed_multiplier REAL NOT NULL DEFAULT 1.0,
    map_id          TEXT NOT NULL DEFAULT 'world_default',
    settings        JSONB NOT NULL DEFAULT '{}',
    started_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NATIONS
CREATE TABLE nations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id         UUID REFERENCES auth.users(id),
    name            TEXT NOT NULL,
    tag             VARCHAR(3) NOT NULL,
    color           VARCHAR(7) NOT NULL,
    flag_sprite     TEXT,
    is_ai           BOOLEAN NOT NULL DEFAULT false,

    -- National stats
    population      BIGINT NOT NULL DEFAULT 0,
    manpower_pool   INT NOT NULL DEFAULT 0,
    stability       REAL NOT NULL DEFAULT 50.0 CHECK (stability BETWEEN 0 AND 100),
    corruption      REAL NOT NULL DEFAULT 0.0  CHECK (corruption BETWEEN 0 AND 100),
    war_exhaustion  REAL NOT NULL DEFAULT 0.0  CHECK (war_exhaustion BETWEEN 0 AND 100),
    political_power REAL NOT NULL DEFAULT 0.0,
    research_power  REAL NOT NULL DEFAULT 1.0,

    -- Economy
    treasury        REAL NOT NULL DEFAULT 1000.0,
    taxation_setting TEXT NOT NULL DEFAULT 'normal'
                    CHECK (taxation_setting IN ('minimum','low','normal','high','maximum')),
    conscription_law TEXT NOT NULL DEFAULT 'limited_conscript'
                    CHECK (conscription_law IN ('volunteer_only','limited_conscript','extensive_conscript','mass_mobilization')),
    factory_output_setting TEXT NOT NULL DEFAULT 'normal'
                    CHECK (factory_output_setting IN ('minimum','low','reduced','normal','supercharged')),

    -- Spending sliders (0-10 each, ratios computed from sum)
    spending_military       INT NOT NULL DEFAULT 5 CHECK (spending_military BETWEEN 0 AND 10),
    spending_government     INT NOT NULL DEFAULT 3 CHECK (spending_government BETWEEN 0 AND 10),
    spending_security       INT NOT NULL DEFAULT 2 CHECK (spending_security BETWEEN 0 AND 10),
    spending_education      INT NOT NULL DEFAULT 3 CHECK (spending_education BETWEEN 0 AND 10),
    spending_anti_corruption INT NOT NULL DEFAULT 2 CHECK (spending_anti_corruption BETWEEN 0 AND 10),
    spending_healthcare     INT NOT NULL DEFAULT 2 CHECK (spending_healthcare BETWEEN 0 AND 10),
    spending_research       INT NOT NULL DEFAULT 4 CHECK (spending_research BETWEEN 0 AND 10),
    spending_reconstruction INT NOT NULL DEFAULT 1 CHECK (spending_reconstruction BETWEEN 0 AND 10),

    -- Ideology
    ideology_id     TEXT NOT NULL DEFAULT 'liberal_democracy',

    -- Leader
    leader_name     TEXT,
    leader_traits   TEXT[] DEFAULT '{}',

    -- Victory
    victory_points  INT NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(session_id, tag)
);

CREATE INDEX idx_nations_session ON nations(session_id);
CREATE INDEX idx_nations_user ON nations(user_id);

-- PROVINCES
CREATE TABLE provinces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    province_key    TEXT NOT NULL,
    name            TEXT NOT NULL,
    owner_nation_id UUID REFERENCES nations(id),
    controller_nation_id UUID REFERENCES nations(id),
    terrain_type    TEXT NOT NULL DEFAULT 'plains'
                    CHECK (terrain_type IN (
                        'plains','forest','mountain','desert','jungle',
                        'arctic','hills','marsh','urban','coastal','ocean'
                    )),
    is_coastal      BOOLEAN NOT NULL DEFAULT false,
    is_capital      BOOLEAN NOT NULL DEFAULT false,
    population      INT NOT NULL DEFAULT 0,
    infrastructure  INT NOT NULL DEFAULT 1 CHECK (infrastructure BETWEEN 0 AND 10),
    supply_value    INT NOT NULL DEFAULT 1,
    victory_points  INT NOT NULL DEFAULT 0,
    resource_deposits JSONB NOT NULL DEFAULT '{}',
    geometry        JSONB NOT NULL DEFAULT '{}',
    center_x        REAL NOT NULL DEFAULT 0,
    center_y        REAL NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(session_id, province_key)
);

CREATE INDEX idx_provinces_session ON provinces(session_id);
CREATE INDEX idx_provinces_owner ON provinces(owner_nation_id);

-- PROVINCE ADJACENCY
CREATE TABLE province_adjacency (
    province_a_id   UUID REFERENCES provinces(id) ON DELETE CASCADE NOT NULL,
    province_b_id   UUID REFERENCES provinces(id) ON DELETE CASCADE NOT NULL,
    border_type     TEXT NOT NULL DEFAULT 'land'
                    CHECK (border_type IN ('land','river','sea','strait')),
    movement_cost   REAL NOT NULL DEFAULT 1.0,
    PRIMARY KEY (province_a_id, province_b_id),
    CHECK (province_a_id < province_b_id)
);

-- CITIES
CREATE TABLE cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id     UUID REFERENCES provinces(id) ON DELETE CASCADE NOT NULL,
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    name            TEXT NOT NULL,
    city_type       TEXT NOT NULL DEFAULT 'town'
                    CHECK (city_type IN ('town','city','metropolis','port','fortress')),
    population      INT NOT NULL DEFAULT 0,
    development     INT NOT NULL DEFAULT 1 CHECK (development BETWEEN 1 AND 10),
    manpower_gain   INT NOT NULL DEFAULT 100,
    tax_income      REAL NOT NULL DEFAULT 10.0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cities_province ON cities(province_id);
CREATE INDEX idx_cities_session ON cities(session_id);

-- BUILDINGS
CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id         UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    building_type   TEXT NOT NULL,
    level           INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
    is_damaged      BOOLEAN NOT NULL DEFAULT false,
    production_queue JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_buildings_city ON buildings(city_id);

-- TICK LOCKS (for server-authoritative tick engine)
CREATE TABLE tick_locks (
    session_id      UUID PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
    locked_at       TIMESTAMPTZ,
    locked_by       TEXT,
    is_locked       BOOLEAN NOT NULL DEFAULT false
);

-- Atomic lock acquisition
CREATE OR REPLACE FUNCTION acquire_tick_lock(
    p_session_id UUID,
    p_instance_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    acquired BOOLEAN;
BEGIN
    UPDATE tick_locks
    SET is_locked = true,
        locked_at = now(),
        locked_by = p_instance_id
    WHERE session_id = p_session_id
      AND (is_locked = false OR locked_at < now() - INTERVAL '30 seconds')
    RETURNING true INTO acquired;
    RETURN COALESCE(acquired, false);
END;
$$ LANGUAGE plpgsql;

-- Release tick lock
CREATE OR REPLACE FUNCTION release_tick_lock(
    p_session_id UUID,
    p_instance_id TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE tick_locks
    SET is_locked = false, locked_at = null, locked_by = null
    WHERE session_id = p_session_id AND locked_by = p_instance_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Sessions: visible to all authenticated users
CREATE POLICY "Sessions visible to authenticated users"
    ON game_sessions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Sessions insertable by authenticated users"
    ON game_sessions FOR INSERT
    TO authenticated
    WITH CHECK (host_user_id = auth.uid());

-- Nations: visible to session members
CREATE POLICY "Nations visible to session members"
    ON nations FOR SELECT
    TO authenticated
    USING (
        session_id IN (
            SELECT session_id FROM nations WHERE user_id = auth.uid()
        )
        OR session_id IN (
            SELECT id FROM game_sessions WHERE status = 'lobby'
        )
    );

CREATE POLICY "Own nation editable"
    ON nations FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Nations insertable"
    ON nations FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR is_ai = true);

-- Provinces: visible to session members
CREATE POLICY "Provinces visible to session members"
    ON provinces FOR SELECT
    TO authenticated
    USING (
        session_id IN (
            SELECT session_id FROM nations WHERE user_id = auth.uid()
        )
    );

-- Cities: visible to session members
CREATE POLICY "Cities visible to session members"
    ON cities FOR SELECT
    TO authenticated
    USING (
        session_id IN (
            SELECT session_id FROM nations WHERE user_id = auth.uid()
        )
    );

-- Buildings: visible to session members
CREATE POLICY "Buildings visible to session members"
    ON buildings FOR SELECT
    TO authenticated
    USING (
        session_id IN (
            SELECT session_id FROM nations WHERE user_id = auth.uid()
        )
    );
