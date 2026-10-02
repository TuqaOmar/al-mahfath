# Isolated Firebase verification

Run from the repository root on Windows:

```powershell
npm.cmd run test:security
npm.cmd run test:emulator
npm.cmd run test:emulator:browser
```

The runner uses `demo-ma7fath-test`, Auth at `127.0.0.1:9099`, and Firestore at `127.0.0.1:8080`. It copies the checked-in rules to a temporary configuration, creates disposable accounts with password sign-in, seeds synthetic documents, and verifies real rules and HTTP responses. JSON fixtures live in a temporary directory; hashes verify that repository databases stay unchanged. There is no deployment or production migration command.

Install Firebase CLI locally with `npm.cmd install --save-dev firebase-tools` when npm connectivity is available. Alternatively download the [official Windows standalone CLI](https://github.com/firebase/firebase-tools/releases) to `.tools/firebase.exe`. The runner can also use the CLI cache populated by the standalone tool. This session used CLI 15.32.1 and Firestore emulator 1.22.0.

Java 21 is required. Put a portable JDK under `.tools/java/jdk-21...` or make Java 21 available on PATH. This session used Temurin 21.0.12.1. The runner copies a local JDK and rules to Latin-character temporary paths because the Windows Java launcher failed with the Arabic repository path. Downloads and caches are ignored by Git. Network access is needed for the first emulator download; subsequent runs use the cached JAR.

The application server rejects any emulator configuration unless `NODE_ENV=test`, `MA7FATH_EMULATOR_TEST=1`, a `demo-*` project, and both loopback emulator hosts are present. The runner sets these variables for its child process, never in `.env` or production configuration. It verifies that production startup rejects emulator hosts. Outside tests, the server uses the same named database specified in `firebase-applet-config.json` as the frontend; `FIRESTORE_DATABASE_ID` is an explicit override.

`memberships/{uid}` currently holds one active membership per learner. Transfers replace this document, and leaving removes it; concurrent memberships and membership history are not represented. A server transaction updates this document, user membership pointers, group counts, and request approval together. This is a current implementation constraint, not an agreed final product requirement.

`enrollmentRequests/{uid}` currently holds one request document per learner, including after approval. A pending duplicate returns the previous request without changing its details. Submitting after approval (or any non-pending status) uses `tx.set` without merge and replaces the previous document, removing approval fields such as `approvedBy`, `approvedAt`, `groupId`, and `teacherId`. Request history is not preserved. Transaction test success does not endorse this constraint as a final requirement; multiple memberships and request history need a product decision before moving legacy data.

Direct client writes to groups, memberships, requests, and user membership pointers are denied. Teacher assignment uses existing registered Firebase accounts. Existing JSON memberships are not migrated or silently imported. To reproduce the local-only legacy inventory without accessing Firebase, run `node scripts/auditLegacyMemberships.mjs --output reports/legacy-memberships.md`; the [redacted report](../reports/legacy-memberships.md) distinguishes primary files from backups and is not a production Firestore/Auth inventory.

API coverage includes role escalation and system field rejection, allowed profile edits, student progress isolation, real ID tokens for four roles, teacher scope and revocation, group creation/join/transfer/leave, approval retry, concurrent joins, and an injected transaction failure returning 503 without modifying membership.

The browser command runs installed Google Chrome headless through Playwright, with disposable contexts (no personal Chrome profile), the real React UI served in Vite `emulator` mode, and the same demo Auth/Firestore services. It assigns teacher roles, creates two groups, checks the displayed invitation code and clipboard copy, joins from the student dashboard, verifies membership and teacher rosters after reload, transfers the learner between teachers, logs out/in, leaves, approves a seeded pending request, and signs in as its owner to verify approved membership after reload. Assertions accompany screenshots and `result.json` in `reports/browser-groups/`. External browser traffic is blocked; repository JSON hashes must stay unchanged.

The frontend switch is set only in the child process: `VITE_MA7FATH_EMULATOR=1`. It requires development mode named `emulator` and a loopback page hostname, and selects a demo config with the default database. Production builds and ordinary development reject this switch; the safety tests exercise both. Do not put the switch or emulator hosts in production configuration.

Chrome must be installed at its standard location; `@playwright/test` is a dev dependency. The in-app browser tool was unavailable (`codex/sandbox-state-meta: missing field sandboxPolicy`), so the independent local browser was used. A pending request is seeded as a fixture: the browser test proves approval, not a request-submission screen. Wizard, mobile/native builds, production credentials, and deployment remain outside this evidence.
