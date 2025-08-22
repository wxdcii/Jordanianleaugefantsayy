-- Seed data for Fantasy Jordan Pro League
-- Run this after running schema.sql

-- Get current season ID
DO $$
DECLARE
    current_season_id UUID;
    current_gameweek_id UUID;
    team_faisaly_id UUID;
    team_wehdat_id UUID;
    team_hussein_id UUID;
    team_ramtha_id UUID;
    team_shabab_id UUID;
    team_salt_id UUID;
    team_ahli_id UUID;
    team_jazeera_id UUID;
    team_baqaa_id UUID;
    team_sama_id UUID;
BEGIN
    -- Get current season
    SELECT id INTO current_season_id FROM seasons WHERE is_current = TRUE LIMIT 1;

    -- Get team IDs
    SELECT id INTO team_faisaly_id FROM teams WHERE short_name = 'FAI';
    SELECT id INTO team_wehdat_id FROM teams WHERE short_name = 'WHD';
    SELECT id INTO team_hussein_id FROM teams WHERE short_name = 'HUS';
    SELECT id INTO team_ramtha_id FROM teams WHERE short_name = 'RAM';
    SELECT id INTO team_shabab_id FROM teams WHERE short_name = 'SHO';
    SELECT id INTO team_salt_id FROM teams WHERE short_name = 'SAL';
    SELECT id INTO team_ahli_id FROM teams WHERE short_name = 'AHL';
    SELECT id INTO team_jazeera_id FROM teams WHERE short_name = 'JAZ';
    SELECT id INTO team_baqaa_id FROM teams WHERE short_name = 'BAQ';
    SELECT id INTO team_sama_id FROM teams WHERE short_name = 'SAS';

    -- Insert Al-Faisaly Players
    INSERT INTO players (team_id, name, name_ar, position, shirt_number, price, total_points) VALUES
    (team_faisaly_id, 'Yazeed Abu Laila', 'يزيد أبو ليلى', 'GKP', 1, 5.0, 85),
    (team_faisaly_id, 'Ahmad Al-Bashir', 'أحمد البشير', 'DEF', 2, 5.5, 78),
    (team_faisaly_id, 'Mohammed Rashid', 'محمد راشد', 'DEF', 3, 5.0, 72),
    (team_faisaly_id, 'Omar Al-Maharmeh', 'عمر المحارمة', 'DEF', 4, 4.5, 65),
    (team_faisaly_id, 'Khalil Al-Bani', 'خليل البني', 'DEF', 5, 4.5, 68),
    (team_faisaly_id, 'Hamza Al-Dardour', 'حمزة الدردور', 'MID', 6, 8.0, 120),
    (team_faisaly_id, 'Noor Al-Rawabdeh', 'نور الروابدة', 'MID', 7, 7.5, 105),
    (team_faisaly_id, 'Baha Seif', 'بهاء سيف', 'MID', 8, 7.0, 98),
    (team_faisaly_id, 'Ahmad Samir', 'أحمد سمير', 'MID', 10, 6.5, 88),
    (team_faisaly_id, 'Ali Olwan', 'علي علوان', 'FWD', 9, 9.5, 140),
    (team_faisaly_id, 'Mousa Al-Tamari', 'موسى التماري', 'FWD', 11, 8.5, 115);

    -- Insert Al-Wehdat Players
    INSERT INTO players (team_id, name, name_ar, position, shirt_number, price, total_points) VALUES
    (team_wehdat_id, 'Ahmad Al-Rashid', 'أحمد الراشد', 'GKP', 1, 4.5, 72),
    (team_wehdat_id, 'Saeed Al-Muradi', 'سعيد المرادي', 'DEF', 2, 4.8, 76),
    (team_wehdat_id, 'Yazan Al-Arab', 'يزن العرب', 'DEF', 3, 5.0, 82),
    (team_wehdat_id, 'Mohammed Al-Zoubi', 'محمد الزعبي', 'DEF', 4, 6.0, 95),
    (team_wehdat_id, 'Khalil Bani Hani', 'خليل بني هاني', 'DEF', 5, 5.5, 78),
    (team_wehdat_id, 'Amjad Attwan', 'أمجد عطوان', 'MID', 6, 6.0, 85),
    (team_wehdat_id, 'Mohammad Abu Hasheesh', 'محمد أبو حشيش', 'MID', 7, 5.5, 75),
    (team_wehdat_id, 'Hamza Al-Hayajneh', 'حمزة الحياجنة', 'MID', 8, 6.5, 92),
    (team_wehdat_id, 'Abdallah Nasib', 'عبدالله نصيب', 'MID', 10, 7.0, 98),
    (team_wehdat_id, 'Ali Al-Zein', 'علي الزين', 'FWD', 9, 7.5, 105),
    (team_wehdat_id, 'Yazan Al-Naimat', 'يزن النعيمات', 'FWD', 11, 8.0, 102);

    -- Insert Al-Hussein Players
    INSERT INTO players (team_id, name, name_ar, position, shirt_number, price, total_points) VALUES
    (team_hussein_id, 'Omar Mansour', 'عمر منصور', 'GKP', 1, 4.5, 72),
    (team_hussein_id, 'Ahmad Al-Ersan', 'أحمد العرسان', 'DEF', 2, 4.5, 65),
    (team_hussein_id, 'Mohammed Haddad', 'محمد حداد', 'DEF', 3, 5.0, 75),
    (team_hussein_id, 'Osama Al-Khalidi', 'أسامة الخالدي', 'DEF', 4, 4.8, 70),
    (team_hussein_id, 'Tareq Abu Ismail', 'طارق أبو إسماعيل', 'DEF', 5, 4.5, 68),
    (team_hussein_id, 'Mohammad Khalil', 'محمد خليل', 'MID', 6, 5.5, 78),
    (team_hussein_id, 'Anas Bani Yaseen', 'أنس بني ياسين', 'MID', 7, 6.0, 82),
    (team_hussein_id, 'Ahmad Al-Ghanem', 'أحمد الغانم', 'MID', 8, 5.0, 72),
    (team_hussein_id, 'Omar Al-Dmeiri', 'عمر الدميري', 'MID', 10, 6.5, 88),
    (team_hussein_id, 'Mohannad Al-Aker', 'مهند العكر', 'FWD', 9, 7.0, 95),
    (team_hussein_id, 'Bahaa Faisal', 'بهاء فيصل', 'FWD', 11, 6.5, 85);

    -- Insert Al-Ramtha Players
    INSERT INTO players (team_id, name, name_ar, position, shirt_number, price, total_points) VALUES
    (team_ramtha_id, 'Mohammed Al-Sheyab', 'محمد الشياب', 'GKP', 1, 4.0, 62),
    (team_ramtha_id, 'Ahmad Elias', 'أحمد الياس', 'DEF', 2, 4.0, 58),
    (team_ramtha_id, 'Osama Al-Oran', 'أسامة العوران', 'DEF', 3, 4.5, 65),
    (team_ramtha_id, 'Mohammed Al-Adwan', 'محمد العدوان', 'DEF', 4, 4.0, 55),
    (team_ramtha_id, 'Zaid Al-Kharabsheh', 'زيد الخرابشة', 'DEF', 5, 4.5, 62),
    (team_ramtha_id, 'Ahmad Salameh', 'أحمد سلامة', 'MID', 6, 5.0, 68),
    (team_ramtha_id, 'Mohammad Al-Naimat', 'محمد النعيمات', 'MID', 7, 4.5, 58),
    (team_ramtha_id, 'Hussam Eddin Abu Saleh', 'حسام الدين أبو صالح', 'MID', 8, 5.5, 72),
    (team_ramtha_id, 'Omar Al-Omari', 'عمر العمري', 'MID', 10, 5.0, 65),
    (team_ramtha_id, 'Mohammad Abu Taha', 'محمد أبو طه', 'FWD', 9, 6.0, 78),
    (team_ramtha_id, 'Zaid Al-Sheyab', 'زيد الشياب', 'FWD', 11, 5.5, 68);

    -- Insert Shabab Al-Ordon Players
    INSERT INTO players (team_id, name, name_ar, position, shirt_number, price, total_points) VALUES
    (team_shabab_id, 'Anas Al-Awaisheh', 'أنس العويشة', 'GKP', 1, 4.0, 55),
    (team_shabab_id, 'Murad Ismail', 'مراد إسماعيل', 'DEF', 2, 4.5, 62),
    (team_shabab_id, 'Mohammad Al-Dabbas', 'محمد الدباس', 'DEF', 3, 4.0, 58),
    (team_shabab_id, 'Ahmad Al-Bashiti', 'أحمد الباشيتي', 'DEF', 4, 4.5, 65),
    (team_shabab_id, 'Osama Omari', 'أسامة عماري', 'DEF', 5, 4.0, 55),
    (team_shabab_id, 'Mohammad Abdel Rahim', 'محمد عبد الرحيم', 'MID', 6, 5.0, 68),
    (team_shabab_id, 'Ahmad Al-Masri', 'أحمد المصري', 'MID', 7, 4.5, 58),
    (team_shabab_id, 'Amjad Al-Hourani', 'أمجد الحوراني', 'MID', 8, 5.5, 75),
    (team_shabab_id, 'Raed Saleh', 'رائد صالح', 'MID', 10, 5.0, 68),
    (team_shabab_id, 'Mohammad Kamhawi', 'محمد قمحاوي', 'FWD', 9, 6.0, 75),
    (team_shabab_id, 'Omar Al-Zawahreh', 'عمر الزواهرة', 'FWD', 11, 5.5, 65);

    -- Add more teams with fewer players for brevity...

    -- Insert sample gameweek for current season
    INSERT INTO gameweeks (season_id, number, name, deadline, is_current)
    VALUES (current_season_id, 1, 'Gameweek 1', NOW() + INTERVAL '7 days', TRUE)
    RETURNING id INTO current_gameweek_id;

    -- Update player statistics based on their total points
    UPDATE players SET
        goals_scored = CASE
            WHEN position = 'FWD' THEN FLOOR(total_points / 8)
            WHEN position = 'MID' THEN FLOOR(total_points / 12)
            WHEN position = 'DEF' THEN FLOOR(total_points / 20)
            ELSE 0
        END,
        assists = CASE
            WHEN position IN ('FWD', 'MID') THEN FLOOR(total_points / 15)
            ELSE FLOOR(total_points / 25)
        END,
        clean_sheets = CASE
            WHEN position IN ('GKP', 'DEF') THEN FLOOR(total_points / 25)
            ELSE 0
        END,
        minutes = GREATEST(total_points * 10, 90),
        appearances = GREATEST(FLOOR(total_points / 8), 1),
        form = LEAST(total_points / 20.0, 10.0),
        selected_by_percent = RANDOM() * 30 + 5;

END $$;
