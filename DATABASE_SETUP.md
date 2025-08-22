# Fantasy Jordan Pro League - Database Setup

This guide will help you set up the database for your Fantasy Jordan Pro League website using Supabase.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Basic understanding of SQL

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter project name: "fantasy-jordan-pro-league"
5. Enter database password (save this!)
6. Select a region (choose closest to your users)
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click "API"
4. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Set Up Database Schema

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy the contents of `database/schema.sql` and paste it
5. Click "RUN" to execute the schema

This will create:
- `teams` table with Jordanian Pro League teams
- `players` table with player information
- `seasons` and `gameweeks` tables for season management
- `player_gameweek_stats` for tracking weekly performance
- `fantasy_teams` and `fantasy_team_selections` for user squads
- Triggers for automatic point calculation

## Step 5: Seed Initial Data

1. In the SQL Editor, create another new query
2. Copy the contents of `database/seed-data.sql` and paste it
3. Click "RUN" to populate with initial data

This will add:
- All 10 Jordanian Pro League teams
- Sample players for each team with realistic stats
- Current season (2025/26)
- First gameweek

## Step 6: Verify Setup

1. Check that tables are created:
   - Go to "Table Editor" in Supabase dashboard
   - You should see: teams, players, seasons, gameweeks, etc.

2. Test the API endpoints:
   - Start your development server: `bun run dev`
   - Visit: `http://localhost:3000/api/players`
   - You should see JSON data with player information

## Step 7: Access Admin Interface

1. Visit `http://localhost:3000/admin`
2. You can now:
   - View all players and their stats
   - Update player prices
   - Add gameweek statistics
   - Manage player availability/injuries

## API Endpoints

Your database is now accessible through these API endpoints:

### Players
- `GET /api/players` - Get all players
- `GET /api/players?position=FWD` - Filter by position
- `GET /api/players/[id]` - Get specific player
- `PUT /api/players/[id]` - Update player
- `POST /api/players/[id]/gameweek-stats` - Add gameweek stats

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create new team

### Gameweeks
- `GET /api/gameweeks` - Get all gameweeks
- `POST /api/gameweeks` - Create new gameweek

## Managing Player Points

### Automatic Point Calculation

When you add gameweek stats via the admin interface, points are calculated automatically using the Fantasy Premier League scoring system:

**Goals:**
- Goalkeeper/Defender: 6 points
- Midfielder: 5 points
- Forward: 4 points

**Other scoring:**
- Assist: 3 points
- Clean sheet (GKP/DEF): 4 points
- Clean sheet (MID): 1 point
- Every 3 saves (GKP): 1 point
- Penalty save: 5 points
- Yellow card: -1 point
- Red card: -3 points
- Own goal: -2 points
- Penalty miss: -2 points
- Every 2 goals conceded (GKP/DEF): -1 point

### Updating Player Stats

Use the admin interface at `/admin` to:

1. **Update Weekly Stats**: Select a player and enter their gameweek performance
2. **Adjust Prices**: Change player prices based on demand/performance
3. **Manage Injuries**: Mark players as available/injured
4. **View Statistics**: See comprehensive player and team stats

## Database Maintenance

### Weekly Updates
1. Create new gameweek: `POST /api/gameweeks`
2. Update player stats for each player who played
3. System automatically recalculates total points and form

### Season Management
1. At season end, create new season in `seasons` table
2. Reset player stats if needed
3. Archive previous season data

## Troubleshooting

### Common Issues

1. **"Cannot find module '@supabase/supabase-js'"**
   - Run: `bun add @supabase/supabase-js`

2. **"Failed to fetch players"**
   - Check your `.env.local` file has correct Supabase credentials
   - Ensure database schema has been created
   - Check Supabase dashboard for any RLS policies

3. **"401 Unauthorized"**
   - Verify your SUPABASE_ANON_KEY is correct
   - Check that RLS (Row Level Security) is properly configured

4. **Empty player list**
   - Make sure you ran the seed data script
   - Check Supabase Table Editor to verify data exists

### Getting Help

1. Check the Supabase logs in your dashboard
2. Use browser dev tools to inspect network requests
3. Check the console for error messages

## Security Notes

- Never commit `.env.local` to version control
- Keep your `service_role` key secret (server-side only)
- The `anon` key is safe for client-side use
- Consider enabling Row Level Security (RLS) for production

## Next Steps

Once your database is set up:

1. **Customize Teams**: Update team logos, colors, and information
2. **Add Real Players**: Replace sample data with actual Jordan Pro League players
3. **Set Up Gameweeks**: Create the full season schedule
4. **Enable User Authentication**: Add user accounts for fantasy teams
5. **Add Real-time Features**: Use Supabase real-time for live updates

Your Fantasy Jordan Pro League database is now ready! 🎉
