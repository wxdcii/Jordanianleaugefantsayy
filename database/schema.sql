-- Fantasy Jordan Pro League Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    founded_year INTEGER,
    stadium VARCHAR(100),
    stadium_ar VARCHAR(100),
    city VARCHAR(50),
    city_ar VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasons table
CREATE TABLE seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gameweeks table
CREATE TABLE gameweeks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    name VARCHAR(50),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_finished BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    position VARCHAR(3) NOT NULL CHECK (position IN ('GKP', 'DEF', 'MID', 'FWD')),
    shirt_number INTEGER,
    price DECIMAL(4,1) NOT NULL DEFAULT 4.0,
    total_points INTEGER DEFAULT 0,
    form DECIMAL(3,1) DEFAULT 0.0,
    selected_by_percent DECIMAL(5,2) DEFAULT 0.0,
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    own_goals INTEGER DEFAULT 0,
    penalties_saved INTEGER DEFAULT 0,
    penalties_missed INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    bonus INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    appearances INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    injury_status VARCHAR(20) DEFAULT 'Available',
    chance_of_playing_this_round INTEGER DEFAULT 100,
    chance_of_playing_next_round INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player gameweek stats table
CREATE TABLE player_gameweek_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
    minutes INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    own_goals INTEGER DEFAULT 0,
    penalties_saved INTEGER DEFAULT 0,
    penalties_missed INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    bonus INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    was_home BOOLEAN DEFAULT TRUE,
    opponent_team_id UUID REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, gameweek_id)
);

-- Fantasy teams table (user squads)
CREATE TABLE fantasy_teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID, -- Will connect to auth later
    team_name VARCHAR(50) NOT NULL,
    total_points INTEGER DEFAULT 0,
    budget DECIMAL(4,1) DEFAULT 100.0,
    free_transfers INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fantasy team selections table
CREATE TABLE fantasy_team_selections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fantasy_team_id UUID REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT FALSE,
    is_vice_captain BOOLEAN DEFAULT FALSE,
    is_starting BOOLEAN DEFAULT TRUE,
    bench_position INTEGER, -- 1, 2, 3, 4 for bench order
    gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fantasy_team_id, gameweek_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_price ON players(price);
CREATE INDEX idx_player_gameweek_stats_player_id ON player_gameweek_stats(player_id);
CREATE INDEX idx_player_gameweek_stats_gameweek_id ON player_gameweek_stats(gameweek_id);
CREATE INDEX idx_fantasy_team_selections_fantasy_team_id ON fantasy_team_selections(fantasy_team_id);
CREATE INDEX idx_fantasy_team_selections_gameweek_id ON fantasy_team_selections(gameweek_id);

-- Enable Row Level Security (optional for now)
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE player_gameweek_stats ENABLE ROW LEVEL SECURITY;

-- Insert sample data
INSERT INTO seasons (name, start_date, end_date, is_current)
VALUES ('2025/26', '2025-08-01', '2026-05-31', TRUE);

-- Insert teams
INSERT INTO teams (name, name_ar, short_name, primary_color, city, city_ar) VALUES
('Al-Faisaly SC', 'الفيصلي', 'FAI', '#ff0000', 'Amman', 'عمان'),
('Al-Wehdat SC', 'الوحدات', 'WHD', '#008000', 'Amman', 'عمان'),
('Al-Hussein SC (Irbid)', 'الحسين إربد', 'HUS', '#ffff00', 'Irbid', 'إربد'),
('Al-Ramtha SC', 'الرمثا', 'RAM', '#0066cc', 'Ramtha', 'الرمثا'),
('Shabab Al-Ordon Club', 'شباب الأردن', 'SHO', '#ff6600', 'Amman', 'عمان'),
('Al-Salt SC', 'السلط', 'SAL', '#800080', 'Salt', 'السلط'),
('Al-Ahli (Amman)', 'الأهلي عمان', 'AHL', '#000080', 'Amman', 'عمان'),
('Al-Jazeera Club', 'الجزيرة', 'JAZ', '#228b22', 'Amman', 'عمان'),
('Al-Baqaa', 'البقعة', 'BAQ', '#dc143c', 'Ain Al-Basha', 'عين الباشا'),
('Sama Al-Sarhan SC', 'سما السرحان', 'SAS', '#4b0082', 'Mafraq', 'المفرق');

-- Insert sample gameweeks for current season
INSERT INTO gameweeks (season_id, number, name, deadline, is_current)
SELECT s.id, 1, 'Gameweek 1', NOW() + INTERVAL '7 days', TRUE
FROM seasons s WHERE s.is_current = TRUE;

-- Function to update player total points when gameweek stats are added
CREATE OR REPLACE FUNCTION update_player_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players
    SET total_points = (
        SELECT COALESCE(SUM(total_points), 0)
        FROM player_gameweek_stats
        WHERE player_id = NEW.player_id
    ),
    updated_at = NOW()
    WHERE id = NEW.player_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update total points
CREATE TRIGGER trigger_update_player_total_points
    AFTER INSERT OR UPDATE ON player_gameweek_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_player_total_points();

-- Function to calculate form (average points over last 5 gameweeks)
CREATE OR REPLACE FUNCTION update_player_form()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players
    SET form = (
        SELECT COALESCE(AVG(total_points), 0)
        FROM (
            SELECT total_points
            FROM player_gameweek_stats
            WHERE player_id = NEW.player_id
            ORDER BY created_at DESC
            LIMIT 5
        ) recent_stats
    ),
    updated_at = NOW()
    WHERE id = NEW.player_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update form
CREATE TRIGGER trigger_update_player_form
    AFTER INSERT OR UPDATE ON player_gameweek_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_player_form();
