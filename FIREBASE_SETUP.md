# Firebase Setup for Shared Leaderboard

Follow these steps to get the shared leaderboard working tonight.

---

## 1. Create a Firebase Project

1. Go to **[https://console.firebase.google.com/](https://console.firebase.google.com/)**
2. Click **"Add project"** (or **Create a project**).
3. Enter a project name, e.g. `emmanuel-quiz-event`
4. Disable Google Analytics (faster, not needed for this).
5. Click **Create project** and wait for it to finish.

---

## 2. Add a Web App

1. On the **Project Overview** page, click the **"</>" (Web)** icon.
2. Give the app a nickname, e.g. `quiz-web`.
3. Click **Register app**.
4. You will see a block of code like this:

   ```javascript
   const firebaseConfig = {
     apiKey: "XXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "000000000",
     appId: "1:xxxx:web:xxxx"
   };
   ```

5. **Copy that config object exactly.**

---

## 3. Paste Config into the Project

1. Open `js/firebase-config.js` in this project.
2. Find the placeholder Firebase config object.
3. Replace the placeholder values with the real values you just copied.
4. **Save the file.**

---

## 4. Enable Firestore Database

1. In the Firebase Console left sidebar, click **Build** > **Firestore Database**.
2. Click **"Create database"**.
3. Choose **"Start in test mode"** (allows reads/writes for 30 days).
4. Click **Next**.
5. Choose the closest region to your event location.
6. Click **Enable**.

---

## 5. Set Firestore Security Rules (Quick Event Mode)

Because this is a family event and you need it working **immediately**, use these open rules. *(You can restrict them later after the event.)*

1. In Firestore Database, go to the **Rules** tab.
2. Replace the rules with this exact code:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /quizEntries/{entry} {
         allow read: if true;
         allow create: if true;
         allow update, delete: if false;
       }
     }
   }
   ```

3. Click **Publish**.

---

## 6. Deploy and Test

- Upload/deploy the website files to your host (GitHub Pages, Netlify, Vercel, your server, etc.).
- Open the quiz on **Phone A**, enter a name, and complete the quiz.
- Open the leaderboard on **Phone B** and verify you see the score from Phone A.
- Try entering the **same name** on Phone B — it should show the already-played screen with rank and answers.

---

## Troubleshooting

- **Leaderboard empty?** Open the browser console (F12 on desktop) and check for red errors.
- **Make sure** the `firebase-config.js` values are copied exactly, including quotes and commas.
- **If you see "db is not defined"**, ensure the Firebase SDK scripts and `firebase-config.js` are loaded before `quiz.js` / `leaderboard.js`.
- **Listener errors?** Check that Firestore Database has been created and the security rules are published.

