# SorsU Bulan Attendance Monitoring System

A React and TypeScript attendance monitoring application for Sorsogon State University - Bulan Campus. Teachers manage students, classes, daily attendance, and reports. Students can review only their own attendance history.

## Features

- Email/password Firebase Authentication with teacher and student roles
- Verified `@sorsu.edu.ph` teacher accounts activate automatically
- Firestore-backed student roster, class, and attendance records
- Create, read, update, and delete student, class, and attendance records
- Realtime updates through Firestore snapshots
- Per-class daily attendance for Present, Absent, Late, and Excused statuses
- Search students and filter reports by class, date range, and status
- Student registration is restricted by Firestore rules to an existing roster ID and matching email
- Role-aware Firestore reads and teacher-only data writes
- Responsive dashboard, accessible form validation, loading, success, and error states

## Technology

- React 18, TypeScript, Vite, and React Router
- Firebase Authentication and Cloud Firestore
- HTML5 and responsive CSS3
- Git/GitHub collaboration and Vercel deployment configuration

## Project layout

```text
.
├── .env.example
├── .gitignore
├── firebase.json
├── firestore.rules
├── index.html
├── start-app.bat
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
├── vite.config.ts
└── src
    ├── components
    │   ├── AttendanceTable.tsx
    │   ├── ClassForm.tsx
    │   ├── ConfirmModal.tsx
    │   ├── Footer.tsx
    │   ├── Icon.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── Navbar.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── StatusBadge.tsx
    │   ├── StudentCard.tsx
    │   └── StudentForm.tsx
    ├── context
    │   └── AuthContext.tsx
    ├── firebase
    │   ├── firebase.ts
    │   └── teacherAccess.ts
    ├── pages
    │   ├── AttendancePage.tsx
    │   ├── ClassesPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── HomePage.tsx
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── ReportsPage.tsx
    │   ├── StudentsPage.tsx
    │   └── TeacherVerifyEmailPage.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── main.tsx
    ├── types.ts
    └── vite-env.d.ts
```

## Local setup

1. Install Node.js LTS.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/), register a Web App, and enable **Authentication → Email/Password**.
4. Create a Cloud Firestore database.
5. Copy `.env.example` to `.env` and replace every example value with the Web App configuration from **Project settings → Your apps**. These `VITE_*` values are public client configuration, not service-account credentials. Do not commit `.env`.
6. Publish the Firestore rules from `firestore.rules` using the Firebase Console **Firestore → Rules** editor, or install the Firebase CLI, sign in, select your project, then run:

   ```sh
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules
   ```

7. On Windows, double-click `start-app.bat` to start the local Vite server and open the app in your browser. Alternatively, start it from the project directory:

   ```sh
   npm run dev
   ```

   Do not open the project-root `index.html` directly. It loads React/TypeScript modules and Firebase, which require an HTTP origin; the source HTML is not a standalone app file.

8. Verify the production build:

   ```sh
   npm run build
   ```

## Accounts and roles

Student registration requires a student ID that exists in the `students` collection and an email matching that roster document. Teacher registration requires an `@sorsu.edu.ph` email and sends a Firebase email-verification link. The teacher profile starts with `role: "teacher"` and `status: "pendingEmailVerification"`; after the email is verified, the app promotes the profile to `status: "active"` automatically. Firestore rules independently require the verified university-email claim and active teacher profile for teacher-only data access. Publish the updated `firestore.rules` before enabling teacher registration.

Teacher registration stores the submitted teacher ID in the user's profile. Existing approved teacher profiles are preserved and marked active after their university email is verified. Legacy teacher applications are migrated to active teacher profiles after verification; `/teacher/pending` redirects to the email-verification page. Student profiles cannot change their role, and student users can read only their own attendance records. A class section filters its roster to students with the same section; leave the section blank to include all students.

## Firestore collections

| Collection | Document ID | Main fields |
| --- | --- | --- |
| `users` | Firebase Auth UID | `uid`, `fullName`, `email`, `role`, optional `status`, `studentId` or `teacherId`, `createdAt` |
| `students` | Student ID | `studentId`, `fullName`, `course`, `yearLevel`, `section`, `email`, `contactNumber`, `createdAt` |
| `classes` | Firestore-generated ID | `classCode`, `subjectName`, `teacherName`, `schedule`, `room`, `section`, `createdAt` |
| `attendance` | Encoded student ID + class ID + date | `studentId`, `studentName`, `classId`, `classCode`, `subjectName`, `date`, `status`, `remarks`, `markedBy`, `createdAt` |

`firestore.rules` is the authoritative access policy. Teachers can manage roster, classes, and attendance. Students can read their own profile, matching roster document, and attendance records, but cannot write those collections.

## GitHub collaboration

Create or use the group's shared repository, then from the project directory:

```sh
git init
git add .
git commit -m "Prepare SorsU Bulan attendance system"
git branch -M main
git remote add origin https://github.com/<group>/<repository>.git
git push -u origin main
```

Keep `.env` and Firebase service-account keys out of Git. Use focused branches and commits for group work; review changes with pull requests before merging into `main`.

## Vercel deployment

1. Import the GitHub repository into Vercel.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add all six variables from `.env.example` in **Project Settings → Environment Variables** for each deployment environment. Redeploy after changing variables.
4. Deploy. `vercel.json` rewrites application routes to `index.html`, so routes such as `/reports` work on direct visits and refresh.
5. Add the deployed domain to Firebase Authentication's **Authorized domains**.
6. Open the deployed URL, sign in with a provisioned account, and verify Firestore reads/writes. The Firebase project, credentials, GitHub repository, and Vercel account must be supplied by the project owner; none are embedded in this repository.

## Group members

- Member 1: Gordola, Rosefe G.
- Member 2: Espena, Anabelle M.
- Member 3: Gillego, Cristel Joy 

