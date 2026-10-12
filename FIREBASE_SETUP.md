# Firebase setup for Calpino Uno

The application is configured for project `calpino-uno` and remains hosted on GitHub Pages. Its public Firebase web configuration is in `firebase-client.js`. No service account, OAuth secret or administrator credential belongs in this repository.

## Finish configuration in the Firebase console

1. Open **Authentication → Sign-in method → Google**, enable the provider and choose the support email address.
2. Open **Authentication → Settings → Authorized domains** and add **`vchaillo.github.io`**. Enter the hostname only, without a protocol or `/calpino-uno/`. Keep `calpino-uno.firebaseapp.com` authorized.
3. Open **Firestore Database**, create a **Standard / Native** Cloud Firestore database with database ID **`(default)`** in production mode. This application uses Cloud Firestore, not Realtime Database.
4. In **Firestore Database → Rules**, replace the rules with the complete contents of [`firestore.rules`](firestore.rules), then click **Publish**. The rules are checked into GitHub but a GitHub Pages deployment does not deploy them to Firebase.

Alternatively, after installing and signing into Firebase CLI, run:

```sh
firebase login
firebase deploy --only firestore:rules --project calpino-uno
```

Firebase Hosting, Cloud Storage and Analytics are not required for these features. No additional OAuth scopes are requested beyond Google sign-in.

## Data model

- `users/{uid}`: editable name, favorite team, theme, per-view gallery/list choices, migration marker and server timestamps.
- `users/{uid}/collection/{season-round}`: favorite, watched and watchlist flags, a bounded race snapshot and a server timestamp.
- `users/{uid}/signins/{signInTimestamp}`: application-recorded connection history based on Firebase Auth's last-sign-in timestamp, browser and device category. It is not an administrator security audit log.

Each path is isolated by the authenticated Firebase UID. Rules validate allowed keys and types; clients cannot browse all users, access another user's data, introduce administrative fields or put a race in both watched and watchlist states.

Firestore uses a memory cache only. Application code does not save personal data or API responses to localStorage/sessionStorage. Firebase Auth can retain its own session so users remain signed in after a reload. Transactions require an online connection and successful authorization; there is no silent local fallback.

Authenticated theme and layout choices synchronize across devices. Guests can explore the archives and temporarily switch appearance/layout in memory; saving a collection requires sign-in. Profile email and photo come from Google and are not editable application credentials. Security and password changes are managed at https://myaccount.google.com/security.

## Optional migration

After signing in, the profile page can offer **Import from this browser** when legacy local data exists. The user explicitly chooses the destination account. The import preserves existing cloud favorites, merges flags with watched taking precedence over watchlist, and does not import old email addresses, demo sessions or anonymous visit history. Legacy entries are removed only after every import and its completion marker have committed successfully. A failed or interrupted import can be retried without duplicate race documents.

## Verification

```sh
npm install
npm test
```

To test Firestore rules, install Firebase CLI and the Java runtime required by your CLI version (Java 21+ for current CLI releases), then run:

```sh
npm run test:rules
```

The rules suite uses the isolated **`demo-calpino-uno`** project with an emulator bound to `127.0.0.1:8086`; it never writes to the live project.

After finishing console configuration:

1. Open https://vchaillo.github.io/calpino-uno/#connexion and sign in with Google.
2. Add a favorite and mark another race as watched or watchlisted.
3. Open the same account in another browser and confirm the collection, profile and preferences appear there.
4. Sign out and use a second account: the first account's collection must not appear.
5. If needed, run the optional import from the original browser that contains the old favorites.

The real Google popup cannot be validated without completing Google's interactive sign-in; the deployment, account isolation logic and Firestore rules can be checked independently.

Official references:
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/security/rules-fields
- https://firebase.google.com/docs/firestore/manage-data/enable-offline
