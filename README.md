# EduTech LMS – React Native Internship Task

A React Native Expo-based Learning Management System enhanced as part of the React Native Intern Task.

The application provides course discovery, authentication, bookmarking, enrollment, payment simulation, structured learning modules, lesson progression, and AI-powered quizzes.

---

## 📱 Project Overview

**Project:** EduTech LMS  
**Platform:** React Native + Expo  
**Primary Testing:** Android  
**Backend:** FreeAPI-based REST API deployed on Railway  
**Database:** MongoDB Atlas  
**AI:** Google Gemini API  
**Navigation:** Expo Router  
**State Management:** React Context / Zustand-based stores  
**Styling:** NativeWind + React Native StyleSheet

---

## ✨ Features

### Authentication
- User registration
- User login
- Logout
- Persistent authentication
- Secure token storage on native devices
- Form validation for registration and login

### Course Discovery
- Course listing
- Search courses
- Course details
- Instructor information
- Ratings and pricing
- Course thumbnails
- Bookmark/unbookmark courses

### Enrollment & Checkout
- Course enrollment
- Demo checkout flow
- UPI payment option
- Card payment option
- Net banking option
- Payment processing state
- Enrollment confirmation
- Start Learning flow

> This is a demo payment flow. No real money is charged.

### Learning Hub
- Course-specific Learning Hub
- Module-based learning structure
- Lesson progression
- Module progression
- Course progress tracking
- Locked/unlocked modules
- Locked/unlocked lessons
- Lesson completion tracking

### AI-Powered Learning
- AI-generated quizzes
- Quiz questions generated from learning content
- Multiple-choice questions
- Score calculation
- Configurable passing requirement
- Quiz retry flow
- Next module unlocking after successful quiz completion
- Gemini model fallback handling

### Profile
- User profile
- Enrolled course count
- Bookmark count
- Account information
- Logout

---

# 🧪 Application Testing

The application was tested on an Android device using Expo Go.

The following user flows were tested:

### Authentication
- Registration with valid details
- Registration validation
- Login with valid credentials
- Login with invalid/non-existing credentials
- Logout
- Login again after logout
- App restart with an existing authenticated session

### Courses
- Course listing
- Course search
- Course details
- Instructor information
- Bookmarking/unbookmarking
- Course enrollment

### Checkout
- Opening checkout
- Selecting UPI
- Selecting Card
- Selecting Net Banking
- Processing payment
- Successful enrollment confirmation
- Starting learning after enrollment

### Learning Flow
- Opening Learning Hub
- Opening modules
- Opening lessons
- Completing lessons
- Lesson locking
- Module locking
- Course progress updates
- Module progress updates

### AI Quiz
- Generating an AI quiz
- Answering quiz questions
- Score calculation
- Failed quiz attempt
- Retry flow
- Successful quiz attempt
- Unlocking the next module after passing

### Edge Cases
- Invalid login credentials
- Locked lessons
- Locked modules
- Quiz score below passing threshold
- Temporary Gemini model availability issues
- API request timeout handling
- Restarting the application while authenticated

---

# 🔎 Limitations, Bugs & Findings

The following issues were identified while exploring and testing the application.

## 1. AI Model Availability

**Finding:**  
AI generation depends on external Gemini model availability. During testing, some Gemini models temporarily returned high-demand/503 responses.

**Solution:**  
Implement model fallback logic so that if one Gemini model is unavailable, the application automatically attempts another supported model. This reduces failures caused by temporary model availability issues.

---

## 2. Mobile Learning Card Layout

**Finding:**  
On Android, some Learning Hub and Module cards can have layout issues where the lesson/module icon and trailing navigation icon do not remain aligned horizontally as intended.

**Solution:**  
Use explicit flex constraints such as `flexShrink`, fixed-width trailing action containers, and platform-specific layout adjustments. This keeps icons and text aligned while allowing descriptions to wrap naturally.

**Status:** Identified; further mobile UI polishing can be performed without changing the learning logic.

---

## 3. Duplicate Learning Hub Header on Android

**Finding:**  
The Learning Hub currently contains both the Expo Router native header and a custom Learning Hub header on Android.

**Solution:**  
Use platform-specific navigation header configuration or disable the native header for this route when the custom header is displayed. This prevents duplicated navigation elements while preserving the web layout.

**Status:** Identified.

---

## 4. External API Dependency

**Finding:**  
Course and instructor information depends on the backend/API being reachable. Network problems can prevent fresh data from loading.

**Solution:**  
Use request timeouts, clear error states, retry actions, and offline indicators so users receive meaningful feedback instead of waiting indefinitely.

---

## 5. Development-Time Expo Warnings

**Finding:**  
Some development-only warnings can appear during Expo development, such as deprecated React Native properties or Expo Router development warnings.

**Solution:**  
Track these warnings during future maintenance and update affected dependencies/components when stable replacements are available. They do not prevent the primary application flows from functioning.

---

# 🐛 Resolved Bug / Limitation

## AI Quiz Reliability and Flow

The original AI quiz flow could fail when a single configured Gemini model was unavailable.

This was improved by implementing a fallback-based generation flow. The application attempts the configured Gemini models sequentially instead of depending on only one model.

### Result

The application can continue attempting quiz generation when an individual Gemini model temporarily fails or is unavailable.

The quiz flow was also tested with:

- Successful quiz generation
- Quiz answering
- Score calculation
- Failed attempts
- Retry
- Passing attempts
- Module unlocking

---

# 🚀 Unique Feature

## AI-Powered Learning Quiz

### Purpose

The Learning Hub was extended with an AI-powered quiz system that converts course/lesson learning content into an interactive assessment.

Instead of providing only static learning material, the application allows students to test their understanding immediately after completing a module.

### How It Works

1. The student completes the required lessons in a module.
2. The AI quiz becomes available.
3. The application generates quiz questions using Google Gemini.
4. The student answers the multiple-choice questions.
5. The application calculates the score.
6. A minimum score of **90%** is required to pass.
7. If the student does not reach the required score, they can retry.
8. Once the quiz is passed, the next module becomes available.

### Why It Adds Value

This connects learning and assessment inside the same application.

The feature provides an additional learning loop:

```text
Learn Lesson
     ↓
Complete Lessons
     ↓
AI Generated Quiz
     ↓
Evaluate Understanding
     ↓
Pass / Retry
     ↓
Unlock Next Module


---

# 📚 Learning Progress Structure

Each course contains:

* 5 modules
* 5 normal lessons per module
* 1 AI quiz per module

Therefore:

```text
5 Modules
   ×
5 Lessons
   =
25 Lessons
```

The AI quiz is treated as the assessment gate for each module.

### Unlocking Rules

```text
Module 1
   ↓
Complete all 5 lessons
   ↓
Take AI Quiz
   ↓
Score ≥ 90%
   ↓
Module 2 unlocked
```

The same process continues for the remaining modules.

---

# 📊 Progress Tracking

### Course Progress

Course progress is calculated from completed lessons across the course.

Example:

```text
1 / 25 lessons completed
= 4% course progress
```

### Module Progress

Module progress is calculated from the five normal lessons belonging to that module.

Example:

```text
1 / 5 lessons completed
= 20% module progress
```

### Quiz Progression

AI quizzes act as module completion gates and determine whether the next module can be accessed.

---

# 🛠️ Technical Architecture

```text
                    EduTech LMS
                         │
                         ▼
              React Native + Expo
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        Expo Router              App State
             │                       │
             ▼                       ▼
      Application Screens       Learning Store
             │
             ▼
        REST API Layer
             │
             ▼
      Railway Backend
             │
             ▼
       MongoDB Atlas
             
             ┌───────────────────────┐
             │                       │
             ▼                       ▼
       Course / User APIs      Gemini AI API
```

---

# 🌐 Backend Deployment

The application communicates with the project's deployed backend.

Backend deployment:

```text
Railway
```

Database:

```text
MongoDB Atlas
```

The Expo application uses the following environment variable:

```env
EXPO_PUBLIC_BASE_URL=https://freeapi-app-mongodburi.up.railway.app
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_BASE_URL=https://freeapi-app-mongodburi.up.railway.app
EXPO_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Security

Do not commit `.env` files or API keys to GitHub.

The repository's `.gitignore` excludes environment files.

Never expose production database credentials in the mobile application.

---

# 💻 Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/nayan777pratyush/edutech-lms-intern-task.git
```

## 2. Enter the project

```bash
cd edutech-lms-intern-task
```

## 3. Install dependencies

```bash
npm install
```

## 4. Configure environment variables

Create:

```text
.env
```

Add:

```env
EXPO_PUBLIC_BASE_URL=https://freeapi-app-mongodburi.up.railway.app
EXPO_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

## 5. Start Expo

```bash
npx expo start
```

For a clean Metro cache:

```bash
npx expo start --clear
```

---

# 📱 Android Testing

Install **Expo Go** on an Android device.

Make sure the development machine and Android device can communicate with the Expo development server.

Then run:

```bash
npx expo start
```

Scan the QR code using Expo Go.

---

# 🧪 Recommended Test Flow

For a complete evaluation, use the following flow:

```text
Register
   ↓
Login
   ↓
Browse Courses
   ↓
Open Course
   ↓
Enroll
   ↓
Checkout
   ↓
Start Learning
   ↓
Open Module 1
   ↓
Complete Lessons
   ↓
Generate AI Quiz
   ↓
Attempt Quiz
   ↓
Pass with ≥ 90%
   ↓
Module 2 Unlocks
```

---

# 🏗️ Android Preview Build

The project is configured with an EAS preview profile that generates an Android APK.

Build command:

```bash
eas build --platform android --profile preview
```

The generated APK can be downloaded from the EAS build page and installed on an Android device for testing.

---

# 📦 GitHub Release

The final Android Preview APK should be uploaded to the GitHub Release for this repository.

Repository:

```text
https://github.com/nayan777pratyush/edutech-lms-intern-task
```

The release should contain the testable Android APK required for evaluation.

---

# 🧰 Main Technologies

* React Native
* Expo
* Expo Router
* TypeScript
* NativeWind
* React Native WebView
* Expo Secure Store
* AsyncStorage
* Google Gemini API
* REST APIs
* Railway
* MongoDB Atlas
* EAS Build

---

# 📁 Important Project Structure

```text
edutech-lms-intern-task/
│
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── course/
│   ├── learning/
│   │   ├── [id].tsx
│   │   ├── module/
│   │   ├── lesson/
│   │   └── quiz/
│   ├── payment/
│   └── webview.tsx
│
├── components/
│   ├── CourseCard.tsx
│   ├── OfflineBanner.tsx
│   └── SearchBar.tsx
│
├── constants/
│
├── hooks/
│
├── providers/
│
├── store/
│   ├── authStore.ts
│   ├── courseStore.ts
│   └── learningStore.ts
│
├── utils/
│   ├── api.ts
│   └── notifications.ts
│
├── assets/
│
├── .env
├── .gitignore
├── app.json
├── eas.json
├── package.json
└── README.md
```

---

# 🔒 Security Notes

* Environment files are excluded from Git.
* API keys should only be stored locally through environment variables.
* Database credentials must remain on the backend.
* The mobile application communicates with the deployed backend rather than directly accessing MongoDB.
* No database credentials should be included in the Expo application.

---

# ✅ Submission Checklist

* [x] Existing application explored
* [x] Android testing completed
* [x] Authentication tested
* [x] Course flow tested
* [x] Enrollment flow tested
* [x] Checkout flow tested
* [x] Learning Hub implemented
* [x] Lesson progression implemented
* [x] Module locking implemented
* [x] AI quiz implemented
* [x] Quiz retry implemented
* [x] Progress tracking implemented
* [x] Limitations and bugs documented
* [x] Feasible solutions documented
* [x] Limitation/bug resolved
* [x] Unique feature added
* [x] Backend deployed
* [x] MongoDB connected
* [x] Source code pushed to GitHub
* [ ] Final README committed
* [ ] Android Preview APK generated
* [ ] APK tested independently
* [ ] GitHub Release created
* [ ] APK uploaded to GitHub Release
* [ ] Final submission completed

---

# 👨‍💻 Repository

GitHub:

[https://github.com/nayan777pratyush/edutech-lms-intern-task](https://github.com/nayan777pratyush/edutech-lms-intern-task)

---

## Internship Task

This project was completed as part of the React Native Internship Task.

The implementation focuses on understanding the existing application, testing real user flows, identifying practical limitations, resolving an application issue, adding a meaningful AI-powered feature, documenting the work, and preparing a testable Android build.

```

### One small correction before you paste it

I intentionally marked the **mobile card alignment** and **duplicate Learning Hub header** as **identified but not fully resolved**. That's better than claiming they're fixed when your latest screenshots clearly show they're still present.

Also, the bottom checklist makes our remaining work crystal clear:

**Right now:**

1. Replace `README.md` with the above.
2. `git add README.md`
3. Commit + push.
4. Build the APK.
5. Test the APK.
6. Create GitHub Release + upload APK.
7. **Then** we can touch the CSS if time remains.

And don't put your actual Gemini key into the README. Use `YOUR_GEMINI_API_KEY` exactly as above.
```
