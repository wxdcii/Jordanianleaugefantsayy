# Firebase Setup Guide for Jordan Pro League Fantasy

This guide will help you set up Firebase Authentication and Firestore for your Fantasy League application.

## Prerequisites

- A Google account
- Node.js and bun installed
- Basic understanding of Firebase

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `jordan-fantasy-league`
4. Choose whether to enable Google Analytics (recommended)
5. Select analytics location (choose closest to your users)
6. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click, then toggle "Enable" and save
   - **Google**: Click, then toggle "Enable", add your email as test user, and save

## Step 3: Create Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security later)
4. Select a location (choose closest to your users)
5. Click "Done"

## Step 4: Get Firebase Configuration

1. Click on the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app:
   - App nickname: `Jordan Fantasy League`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
6. Copy the configuration object

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

**Example configuration:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBdVl-cTICSwYKrZ95SuvNw7dbMuDt1KG0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jordan-fantasy-league.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jordan-fantasy-league
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jordan-fantasy-league.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=874896969596
NEXT_PUBLIC_FIREBASE_APP_ID=1:874896969596:web:2bcadce9b3a6b7b62c1234
```

## Step 6: Initialize Database Structure

Go to your Firestore console and create these collections:

### 1. Teams Collection (`teams`)
```javascript
// Document structure
{
  name: "Al-Faisaly SC",
  nameAr: "الفيصلي",
  shortName: "FAI",
  primaryColor: "#ff0000",
  secondaryColor: "#ffffff",
  city: "Amman",
  cityAr: "عمان",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Players Collection (`players`)
```javascript
// Document structure
{
  teamId: "team_document_id",
  name: "Ahmad Al-Rashid",
  nameAr: "أحمد الراشد",
  position: "GKP", // GKP, DEF, MID, FWD
  price: 5.0,
  totalPoints: 85,
  form: 7.5,
  goalsScored: 0,
  assists: 2,
  cleanSheets: 8,
  minutes: 1350,
  appearances: 15,
  isAvailable: true,
  injuryStatus: "Available",
  chanceOfPlaying: 100,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. Gameweeks Collection (`gameweeks`)
```javascript
// Document structure
{
  seasonId: "2025-26",
  number: 1,
  name: "Gameweek 1",
  deadline: timestamp, // Future date
  isCurrent: true,
  isFinished: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. Users Collection (`users`)
```javascript
// Document structure (auto-created on registration)
{
  uid: "user_auth_uid",
  email: "user@example.com",
  displayName: "John Doe",
  displayNameAr: "جون دو",
  teamName: "John's Team",
  teamNameAr: "فريق جون",
  country: "Jordan",
  favoriteTeam: "",
  totalPoints: 0,
  gameweekRank: 0,
  overallRank: 0,
  createdAt: timestamp,
  lastActive: timestamp
}
```

### 5. Fantasy Teams Collection (`fantasyTeams`)
```javascript
// Document structure
{
  userId: "user_auth_uid",
  teamName: "Dream Team",
  teamNameAr: "فريق الأحلام",
  totalPoints: 150,
  budget: 95.5,
  freeTransfers: 1,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Step 7: Configure Security Rules

In Firestore, go to "Rules" tab and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Everyone can read teams and players
    match /teams/{teamId} {
      allow read: if true;
      allow write: if false; // Only admins can modify
    }

    match /players/{playerId} {
      allow read: if true;
      allow write: if false; // Only admins can modify
    }

    // Everyone can read gameweeks
    match /gameweeks/{gameweekId} {
      allow read: if true;
      allow write: if false; // Only admins can modify
    }

    // Users can manage their own fantasy teams
    match /fantasyTeams/{teamId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Users can manage their own team selections
    match /fantasyTeamSelections/{selectionId} {
      allow read, write: if request.auth != null;
    }

    // Admin collections (restrict access)
    match /playerGameweekStats/{statId} {
      allow read: if true;
      allow write: if false; // Only admins
    }
  }
}
```

## Step 8: Test the Setup

1. Start your development server:
   ```bash
   bun run dev
   ```

2. Navigate to `http://localhost:3000/register`

3. Try creating a new account

4. Check your Firebase console:
   - Authentication > Users should show your new user
   - Firestore > Data should show the new user document

## Step 9: Add Sample Data (Optional)

You can manually add some sample data in Firestore console:

### Sample Team
1. Go to Firestore > Data
2. Create collection `teams`
3. Add document with auto-ID:
```json
{
  "name": "Al-Faisaly SC",
  "nameAr": "الفيصلي",
  "shortName": "FAI",
  "primaryColor": "#ff0000",
  "secondaryColor": "#ffffff",
  "city": "Amman",
  "cityAr": "عمان",
  "createdAt": "current timestamp",
  "updatedAt": "current timestamp"
}
```

### Sample Player
1. Create collection `players`
2. Add document with auto-ID:
```json
{
  "teamId": "team_document_id_from_above",
  "name": "Ahmad Al-Rashid",
  "nameAr": "أحمد الراشد",
  "position": "GKP",
  "price": 5.0,
  "totalPoints": 85,
  "form": 7.5,
  "goalsScored": 0,
  "assists": 2,
  "cleanSheets": 8,
  "minutes": 1350,
  "appearances": 15,
  "isAvailable": true,
  "injuryStatus": "Available",
  "chanceOfPlaying": 100,
  "createdAt": "current timestamp",
  "updatedAt": "current timestamp"
}
```

### Sample Gameweek
1. Create collection `gameweeks`
2. Add document with auto-ID:
```json
{
  "seasonId": "2025-26",
  "number": 1,
  "name": "Gameweek 1",
  "deadline": "future timestamp (e.g., next Friday 6:30 PM)",
  "isCurrent": true,
  "isFinished": false,
  "createdAt": "current timestamp",
  "updatedAt": "current timestamp"
}
```

## Features Now Available

✅ **User Authentication**
- Email/password registration and login
- Google OAuth login
- User profiles with Arabic support
- Protected routes

✅ **Real-time Gameweek System**
- Countdown to deadline
- Automatic deadline enforcement
- Team changes locked after deadline
- Live deadline updates

✅ **Squad Management**
- Save teams to Firebase
- Load user's saved teams
- Real-time updates

## Next Steps

1. **Add More Sample Data**: Add more teams and players
2. **Create Admin Interface**: Build admin tools for managing gameweeks
3. **Implement Points System**: Connect real match data
4. **Add Private Leagues**: User leagues and competitions
5. **Real-time Features**: Live score updates during matches

## Troubleshooting

### Common Issues

1. **"Firebase config not found"**
   - Check your `.env.local` file exists and has correct values
   - Restart the development server after adding environment variables

2. **"Permission denied"**
   - Check Firestore security rules
   - Make sure user is authenticated for protected operations

3. **"Authentication not working"**
   - Verify authentication providers are enabled in Firebase console
   - Check domain configuration in Firebase Auth settings

4. **"Data not loading"**
   - Check browser console for errors
   - Verify collection names match exactly
   - Ensure documents have the correct structure

Your Fantasy Jordan Pro League is now ready with Firebase! 🎉🇯🇴
