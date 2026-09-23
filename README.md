# EduTech LMS - React Native Expo App

A Mini LMS (Learning Management System) built with React Native Expo.

## Tech Stack

- **Framework**: React Native Expo (SDK 56)
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Auth Storage**: Expo SecureStore (tokens), AsyncStorage (app data)
- **Forms**: React Hook Form + Zod validation
- **Images**: Expo Image (with caching)
- **Notifications**: Expo Notifications
- **AI**: Google Gemini (course insights & recommendations)
- **Offline**: @react-native-community/netinfo
- **API**: [freeapi.app](https://api.freeapi.app)
- **Server** : one can create backend server too instead of using API

## Features

- **Auth** — Register/Login with JWT, auto-login on restart, secure token storage
- **Course Catalog** — Browse courses from freeapi.app with search & pull-to-refresh
- **AI Insights** — Gemini-generated summaries, learning outcomes, and suitability on course detail
- **Bookmarks** — Save courses locally; notification when 5+ bookmarked
- **Enroll** — Enroll in courses with visual feedback
- **WebView** — Course content viewer with Native ↔ WebView messaging
- **Profile** — View user info and stats
- **Offline Banner** — Detects and displays no-connection state
- **Notifications** — Reminder if app not opened for 24 hours
- **Error Handling** — Retry logic, timeout, user-friendly errors

## Folder Structure

```
app/
  (auth)/      # login & register screens
  (tabs)/      # main tabs: courses, bookmarks, profile
  course/[id]  # course detail screen
  webview      # WebView content screen
components/    # CourseCard, SearchBar, OfflineBanner
constants/     # API endpoints, color palette
hooks/         # useNetworkStatus
providers/     # AuthProvider, CourseProvider
store/         # authStore, courseStore (context + helpers)
utils/         # api client (fetch + retry), notifications, ai (Gemini)
```

## Setup & Run

```bash
# Install dependencies
npm install

# Copy .env.example to .env and set EXPO_PUBLIC_BASE_URL and EXPO_PUBLIC_GEMINI_API_KEY

# Start Expo
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```
## Environment Variables Needed

Create a `.env` file in the project root and add:

```env
EXPO_PUBLIC_BASE_URL="https://api.freeapi.app"
EXPO_PUBLIC_GEMINI_API_KEY="AIzaSyAsHRHl5-h7hvepMPJ-q6ifiIDISgdX-Fg"
```

## API Endpoints Used

| Purpose      | Endpoint                            |
| ------------ | ----------------------------------- |
| Register     | `POST /api/v1/users/register`       |
| Login        | `POST /api/v1/users/login`          |
| Logout       | `POST /api/v1/users/logout`         |
| Current User | `GET /api/v1/users/current-user`    |
| Courses      | `GET /api/v1/public/randomproducts` |
| Instructors  | `GET /api/v1/public/randomusers`    |

## Key Architectural Decisions

- **Expo Router** for file-based navigation — simpler than React Navigation config
- **Context + useReducer** for auth state — avoids external state library overhead
- **SecureStore** for tokens, **AsyncStorage** for bookmarks/enrollments
- **Fetch with retry** — built-in retry (2 attempts) + 10s timeout on every request
- **Memoized components** — `CourseCard` wrapped in `memo`, filtered list in `useMemo`
- **Gemini API** — structured JSON insights generated on the course detail screen


##APK Build Instructions

#for eas build 

# Install dependencies
npm install

#eas login
open terminal

- type `eas login`
- asked for credentials add the below creds
- login name- your login name
- password- your password

# Create Android development build
npx eas build --platform android --profile development

#for local build
npx expo prebuild
cd android
./gradlew assembleDebug

#local build generated apk location
android/app/build/outputs/apk/debug/app-debug.apk


##Known Limitations/Issues

- Gemini AI summary may sometimes fail when the Gemini server is  busy or request limits are reached.
- Profile image update is simulated locally because there is no actual backend server for uploading/updating profile images.
- Updated profile image resets to the default image when the app is reopened.
- Course thumbnail images are fallback/demo images because product/course API image URLs may not always be reliable.
- Profile avatar is also using a fallback image instead of an actual avatar from the API.
 - *Authentication limitation*: Since the app uses FreeAPI as an external demo API, user persistence/session behavior may not always work like a production backend. In some cases after logout, login may show `"User does not exist"`, requiring the user to register again.


## App Screenshots

<p align="center">
  <img src="./screenshots/splashscreen.jpeg" width="220"/>
  <img src="./screenshots/login.jpeg" width="220"/>
  <img src="./screenshots/register.jpeg" width="220"/>
</p>

<p align="center">
  <img src="./screenshots/courseslist.jpeg" width="220"/>
  <img src="./screenshots/course-details.jpeg" width="220"/>
  <img src="./screenshots/course-content-webview.jpeg" width="220"/>
</p>

<p align="center">
  <img src="./screenshots/courses-bookmarkscreen.jpeg" width="220"/>
  <img src="./screenshots/offline-banner.jpeg" width="220"/>
  <img src="./screenshots/profile.jpeg" width="220"/>
</p>

<p align="center">
  <img src="./screenshots/notifications.jpeg" width="220"/>
</p>
