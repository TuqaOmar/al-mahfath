# Ma7fath AI — current status and teacher-scope follow-up

## Mobile responsive layout — verified 2026-10-05, local Chrome

Updated the dashboard section navigation, mobile header controls, drawer sizing, theme switch target, and safe-area handling. Desktop layouts remain on their existing styles. The browser test uses Chrome 154.0.8037.93 with mobile emulation, touch input, and Arabic locale; it does not connect to production.

The landing-page mobile header also uses a dedicated compact layout: the redundant «المحفظ الذكي» logo text is omitted from the top bar, while the language switch and all four section links remain visible at mobile widths. The section links were tapped, and the language switch was tested in both directions.

| Viewport | Accounts and flows exercised |
|---|---|
| 320 × 844 CSS px | Student, teacher, admin, and multi-role student/teacher/admin. Tapped every visible sidebar section and each primary bottom-nav item; opened More → Mind Maps; verified active `aria-current`, the recitation heading, theme toggle, and header/drawer controls. |
| 360 × 844 CSS px | Student, teacher, admin, and multi-role account in student role. Checked visible primary section taps, theme/settings controls, bottom-nav target bounds, header non-overlap, content clearance, and page width. |
| 390 × 844 CSS px | Same four account types and viewport/layout checks as 360 px. |
| 430 × 844 CSS px | Same four account types and viewport/layout checks as 360 px. |

The multi-role account was switched among student, teacher, and admin at 320 px; the role-specific drawer and bottom tabs stayed available. The student theme was switched to dark, then the page was reloaded and the saved `theme=dark` value, dark body class, and pressed switch state were verified. Chrome checks also confirmed that the document stayed within the viewport, bottom-bar controls were at least 44 px wide/high, header controls did not overlap, and main bottom padding cleared the fixed bar.

Safe-area CSS was verified through `viewport-fit=cover`, `100dvh`, and inset-aware top/bottom padding. The emulated browser used zero hardware cutout insets; physical-device nonzero inset behavior was not tested.

Sixteen dashboard screenshots (all four account types at each width), plus four signed-out landing-header screenshots, are saved under [reports/mobile-responsive/](./reports/mobile-responsive/). The tests opened the quick-settings popover at each width and confirmed it stayed onscreen, and verified the drawer bounds after its open animation.

**Checks:** `npm.cmd run build` passed (Vite emitted its existing large-chunk advisory); `npm.cmd run test:security` passed all 16 tests; `npm.cmd run test:emulator:browser -- --mobile-only` passed all four selected tests: three emulator safety checks and the responsive Chrome journey. External browser traffic was blocked in the local emulator; the recitation page loaded its local view, while remote Tafsir fetches reported expected network errors. A separate full browser-suite attempt exposed an unrelated existing failure in `Chrome quiz saves, profile refresh failures and dismiss-only reminders report persistence truthfully`: its synthetic Touch event omits the required `identifier`; this was not changed as part of the responsive fix.

## Mobile sign-in and laptop Quran map — verified locally

Fixed the email sign-in race where navigation could occur before Firebase had loaded the authenticated user's Firestore profile. Auth-state hydration and the login action now share the same pending profile load, and the login result includes that profile before the modal navigates. Email/password fields now advertise the correct autofill purposes to mobile browsers. Google sign-in uses Firebase redirect flow in mobile browsers instead of relying on a popup. The Google provider round-trip itself was not exercised because the browser run blocks external traffic and uses the local Firebase Emulator.

Changed the Quran map's compact-layout breakpoint from 1340 to 1180 CSS px so laptop widths do not unnecessarily stack the map and detail panel vertically.

| Viewport | Flow and checks |
|---|---|
| 390 × 844 CSS px, Chrome mobile emulation | Signed in with an emulator student account using email/password; confirmed arrival at the dashboard with its mobile navigation and authenticated sidebar section available. |
| 1024 × 900 CSS px | Confirmed the Quran map uses the compact stacked layout; selecting a page opens the detail overlay; document width stays within the viewport. |
| 1179 × 900 CSS px | Confirmed the compact stacked layout and page-detail overlay immediately below the desktop breakpoint. |
| 1180 × 900 CSS px | Confirmed the wide row layout and persistent side detail panel at the breakpoint. |
| 1280 × 900 CSS px | Confirmed the wide layout, detail-panel interaction, and no horizontal page overflow. |
| 1440 × 900 CSS px | Confirmed the wide layout, detail-panel interaction, and no horizontal page overflow. |

Chrome screenshots for these laptop map viewports are saved in [reports/mobile-responsive/](./reports/mobile-responsive/). These browser tests ran against the Firebase Emulator with external browser traffic blocked; no production system was accessed.

The role selector for multi-role accounts is available directly in the top bar on both mobile and desktop, rather than requiring the sidebar to be opened. It remained visible and in-bounds at 320, 360, 390 and 430 CSS px, and at laptop widths 1024, 1179, 1180, 1280 and 1440 CSS px. At 390 × 844, Chrome exercised a multi-role account: opened student Home from the bottom bar, switched to Teacher using the top-bar dropdown, confirmed the teacher dashboard loaded without its error state, then opened Student Home from the teacher sidebar. No browser JavaScript error occurred. Screenshot: [multi-role-teacher-student-home.png](./reports/mobile-responsive/multi-role-teacher-student-home.png). This local journey passed, but the user's reported error was not reproduced with the emulator account.

**Checks:** `npm.cmd run build` passed (existing Vite large-chunk advisory); `npm.cmd run test:emulator:browser -- --mobile-only` passed all 5 selected tests, including the combined-role home and laptop-layout regression. `npm.cmd run test:security` passed all 16 tests. The remote Tafsir fetch warnings during mobile navigation are expected because external traffic is blocked in this local test.

## P1 teacher access scope — verified 2026-10-05, Asia/Amman

**Tested and working for the scope/revocation scenarios below**, including actual Chrome UI requests and Firestore Rules. The former teacher has no retained historical-access entitlement. No production access, deployment, migration, original JSON modification, new rewards or page-approval workflow. This follow-up supersedes the old inactive/malformed membership and teacher-report scope findings; unrelated audit issues remain open.

### One authorization rule and historical decision

A non-admin teacher's student access requires memberships/{studentUid} with uid exactly matching its document/student identity, status=active, a nonempty groupId without slashes, and teacherId matching the authenticated teacher. The referenced groups/{groupId} must exist, be currently owned by that teacher and not have active=false. Existing groups without the optional active flag remain compatible. User-profile teacherId/groupId pointers, cached UI data and a session/note's historical teacherId never grant access. Missing/inactive/mismatched/dangling-group/nested-path memberships are denied or omitted from scoped lists.

Canonical code: server/accessControl.js:24 and server/teacherScope.js:13,22. The same condition protects individual API access, rosters/reports/dashboard, review/note transactions and Firestore reads. Original group student counters remain capacity hints; displayed counts validate active memberships against the current group owner (firestoreGroups.js:23).

No explicit product requirement was found for former-teacher access to historical sessions or notes. Therefore transfer/leave revokes that access too. Records are preserved, and the current assigned teacher can read the student's history under the current-access rule. Reports are all-time records of CURRENT students; dashboard activity is the last7 days for CURRENT students. Neither metric is approved memorization.

Existing administration policy is preserved: admin and admin-bearing multi-role accounts retain broad profile/progress/history reads. Teacher-only multi-role accounts obey their actual assignment. Review and notes always require teacher role, the actual assigned teacher UID, and a valid current membership/group; an admin cannot impersonate another teacher. A pending practice session still assigned to the former teacher returns409 to the new teacher until the student uses the existing submit action to retarget it. This retargeting was tested; it changes neither XP nor memorization counts.

### Exact routes and database paths exercised

| Route/path | Current behavior and executed evidence |
|---|---|
| GET /api/teacher/:teacherId/students | Canonical active/current-owner roster. After transfer/leave/inactive/malformed membership the former learner is absent. groupId query restricts by current owned group; foreign group403. groups.js:116; firestoreGroups.js:164. |
| GET /api/teacher/:teacherId/available-students | Scoped current students only; no global directory of independent/unassigned users. Foreign group403. No current UI caller found; direct Auth Emulator regression executed. groups.js:256. |
| GET /api/teacher/:teacherId/student/:studentId | Same canonical rule for profile, declared ayah progress, practice stats/history and plan summary. Stale users.teacherId/groupId deliberately did not grant former-teacher access. Admin read exemption tested explicitly. groups.js:120. |
| PATCH /api/teacher/:teacherId/student/:studentId/sessions/:sessionId/review | Exact teacher identity plus shared membership/group reads INSIDE transaction. Former teacher/student/unassigned actor403; no unauthorized persisted decision. New teacher review after student resubmission persisted/reloaded as practice. groups.js:145; firestoreRecitation.js:92. |
| POST /api/teacher/:teacherId/student/:studentId/notes | Exact teacher identity plus scope INSIDE note/notification transaction. Former teacher403 after transfer/leave; no note saved. Injected transaction failure503; note count unchanged. Current teacher persists note. groups.js:151. |
| GET /api/teacher/:teacherId/reports | Only valid CURRENT members, optional owned group filter. No former-student historical rows/totals after transfer/leave; inactive/malformed records excluded. groups.js:167. |
| GET /api/teacher/:teacherId/dashboard | Same roster feeds practice totals, activities and attention cards. Former student omitted and another teacher's students never included. groups.js:187. |
| GET /api/groups?teacherId=... | Authenticated scope, actual assigned groups, validated membership counts. Group-specific Chrome roster now passes group.id through Dashboard to API, rather than opening all students. groups.js:29; Dashboard.jsx:240,253. |
| POST /api/teacher/:teacherId/add-student and /enroll-student | Teacher can move an EXISTING valid current member among their own groups; cannot claim an unassigned/former/foreign learner. Student self-join and admin distribution/approval remain the entry paths. Both deny former learner403. Scope is read transactionally in setMembership. groups.js:263; firestoreGroups.js:104. |
| POST /api/recitation/sessions/:sessionId/submit | Token-owned practice only; canonical current scope required. Transferred pending practice retargets the existing submission to the new teacher; no automatic teacher decision. firestoreRecitation.js:75. |
| Firestore users/{uid}, ayah_progress, recitation_sessions, teacher_notes, memberships/{uid} | Shared current-membership/group predicate replaces cached profile pointer checks. After transfer all five actual reads403 for old teacher and200 for new; after leave/inactive/malformed access denied. Nested group path fixture exists but still denies reads. Private chat/fortress-plan owner-only exceptions remain unchanged. firestore.rules:33,38,85,101,107,126,154. |
| Other reads | General /api/user/:uid remains self/admin; portfolio and recitation history APIs remain token-owner scoped. Teacher UI uses the authenticated teacher routes above; no legacy JSON teacher roster is imported. |

### Chrome behavior and evidence

| UI | Executed result |
|---|---|
| Group-specific roster | Two groups owned by one teacher contain different students. Opening groupA displays only its student; all-groups control displays both. Transfer removes the old student from roster/report/dashboard. |
| Open student profile | A real admin transfer while the old profile was open makes note/review attempts return403, clears profile/history/progress/actions, and stores neither an unauthorized note nor decision. New teacher reads the profile, accepts retargeted practice and stores a note. Inactive membership and leave clear the open profile; refresh/report after leave shows no learner. |
| Failed reads | Injected503 responses clear previously rendered roster, reports, dashboard metrics and groups; stale names/cards/rows are removed. Profile error also removes prior private data. |
| Delayed response | A real note request for studentB commits, its HTTP response is held, then the modal closes and opens studentA. Releasing B's response neither replaces A's profile nor shows B's success feedback. |
| Role/account switch | Dashboard clears selected student/group filter; modal read/action version guards ignore responses for older subjects. Existing Chrome multi-role and account-switch regressions rerun; not every timing permutation tested. |

Sources: useTeacherRefresh.js:5; TeacherStudentProfileModal.jsx:30,76,91; TeacherStudentsView.jsx:57; TeacherGroupsView.jsx:30; TeacherDashboard.jsx:20; TeacherReportsView.jsx:14. Views revalidate on mount, explicit refresh, window focus and a visible-tab30-second interval. **There is no instant push invalidation:** an already open view updates on the next revalidation or failed action. Authorization is enforced by server/Rules on every request; browser caches do not grant access. The manual/failure revocation paths are tested; the exact timer latency was not separately measured.

### Final checks from this follow-up

| Command | Actual final result |
|---|---|
| npm.cmd run test:security | 16/16 passed,0 failed,2,306ms. New canonical relationship regression tests/security.test.js:132. |
| npm.cmd run test:emulator | 26/26 passed,0 failed,22,752ms. Final rerun includes nested-path forgery, inactive/malformed cases, stale profile pointers, two teachers/two students, teacher-only and admin-bearing multi-role behavior. Scope case tests/firebase-emulator.test.js:768. |
| npm.cmd run test:emulator:browser | 13/13 passed,0 failed,126,031ms:10 Chrome journeys +3 safety checks. Auth/Firestore/Storage use demo-ma7fath-test. Chrome154.0.8037.93. New scope journey tests/firebase-browser.test.js:843. |
| npm.cmd run build | Exit0;2293 modules, main chunk2,895.59kB/gzip679.39kB. Existing chunk-size warning remains; build is not scope evidence. |
| git -c core.safecrlf=false diff --check | Passed. |
| Four original JSON SHA-256 comparisons | Matched the pre-scope baseline; both suites also assert hashes. server/db.json, safar_data.json and their two backups unchanged. |

Evidence: reports/browser-groups/result.json has passed=true, teacherScopeRevocationP1Passed=true and sourceHashesUnchanged=true, with24-teacher-scope-revoked.png. CLI initially hit EPERM opening the user's global configstore; runner now uses temporary XDG_CONFIG_HOME, so no personal Firebase login/config is reused. An initial scope Emulator failure caught an unreplaced profile check and was corrected. Initial Chrome scope run stopped on an assertion targeting the wrong active tab after access restoration; corrected, followed by the complete final reruns above. Historical runs are not used as current acceptance evidence.

**Remaining limits:** no production credentials/rules/deployment, legacy identity migration, microphone/tajweed/live AI, offline revocation timing, native/PWA or full load/stress test. Stored historical records are not deleted; previous teachers have no retention exception. Current-teacher reports count all-time records of current students, including prior-teacher records; no group-at-session-time reporting or immutable review-event history was added. Other audit findings remain open; the whole app is not declared complete.


## P1 memorization integrity — executed 2026-10-04, Asia/Amman

**Tested and working:** rejection of protected-field tampering, owner isolation, self-declaration persistence/failure handling, and the existing assigned-teacher **practice review** decision. **Partial:** teacher-approved page memorization has no complete persisted page-decision workflow. Approved pages and memory-score assessment therefore display **غير متاح**, not a fabricated count. No approval workflow, XP, reward, production access, deployment, JSON import or migration was added. This section supersedes the historical audit's self-editable-count finding; unrelated P1/P2/P3 findings remain open.

### Field trace and exact displayed sources

| Screen/field | Current source, meaning and range | Status/evidence |
|---|---|---|
| memorizedPages / memorizedPagesCount / totalJuz / memoryScore | Legacy root users fields remain unchanged; never an authoritative approval source. Profile/onboarding allowlists exclude all four; client AuthContext rejects the whole update if any is supplied. Rules also exclude them from admin updates. Initial Firebase signup's existing fixed 0/0/100 defaults remain compatibility defaults, not measurements. | Tested and working: four direct Firestore writes403, combined onboarding forgery403, own API400, foreign API403 and legacy admin PUT400. firestore.rules:60,66,78; AuthContext.jsx:215; server/index.js:116,238. |
| Student home and QuranMap page count | users/{uid}.preferences.studentDeclaredPages: distinct valid page numbers1..604, explicitly self-reported lifetime/current declaration. No legacy count, selectedJuzList, JSON or local review fallback. Map full-juz count requires every mapped page declared, not approximate pages/20 approval. Page statuses are self declarations, not generated accuracy. | Tested and working for quick declaration2, refresh, sign-out/sign-in, student B isolation, failed profile write retaining2. src/lib/memorization.js:2; Dashboard.jsx:519; QuranMapPage.jsx:30,150,581. Single-page/bulk controls implemented but not independently clicked in this run. |
| Onboarding and fortress/AI context | Onboarding selected pages are stored as the same self-declared preference, not root approval counts. Selected surahs no longer create arbitrary21 pages. Fortress starting position and AI context use declarations/planning preferences, with explicit disclaimer. No count-to-ayah fabrication: generateInitialPortfolioFromPages returns empty. | Implemented, not tested: complete onboarding selection variants and every fortress/AI prompt variant. OnboardingWizard.jsx:201,234; portfolioService.js:12; FiveFortressesPlan/SimplifiedFortressPlan/FiveFortressesVisualMap; quranAiEngine. Existing plan/browser regression passed. |
| Student analytics / visual tracker | users/{tokenUid}/ayah_progress, explicitly student-recorded ayahs, all saved records/current statuses; practice counters from same owner's recitation_sessions with documented Amman daily/weekly ranges. Approved-page card is unavailable regardless of declared progress, fake preferences.verifiedPages or practice reviewStatus. | Tested and working: A declares one memorized ayah; B sees0. analytics.profile.verifiedMemorizedPages=null/source=unavailable_no_page_approval_workflow and memoryScore=null. AnalyticsView.jsx:37–42; VisualProgressTracker.jsx:11; groups.js:252. |
| Teacher roster/profile | Assigned user's preferences for declared pages; recordedProgress status totals for self-reported ayahs. Approved pages and memory assessment unavailable. Removed unsupported amount-of-approved-memorization sort from UI. Public user responses mask legacy four fields to null. | Tested and working for permitted profile/read and unavailable count after review/reload; unassigned teacher denied. firestoreGroups.js:10,174; TeacherStudentsView; TeacherStudentProfileModal.jsx:318. |
| Teacher reports/review | Existing users/{studentUid}/recitation_sessions reviewStatus approved/rejected is **practice accepted/rejected**, lifetime persisted training decisions, never approved pages. Decision requires actual teacher role/scope, active membership, existing active group owned by that teacher, and pending submission assigned to that teacher. | Tested and working: student/unassigned teacher403, inactive membership403, injected transaction failure503 leavespending, authorized decision persists/reloads with reviewedBy, classification=practice, rewardedXp=0. firestoreRecitation.js:74,92; TeacherReportsView.jsx:28; TeacherStudentProfileModal.jsx:72. The teacher-scope follow-up above now supersedes the report membership-scope finding. |
| Admin users/distribution/performance | Declared page helper or explicit request-declared juz; authoritative verifiedMemorizedPages=null, unavailable workflow source. No approved count inferred from old roots, ayahs or practice. Existing real practice/activity metrics remain separate. | Tested and working for API null approved count and Chrome regression of performance/zero states. firestoreGroups.js:10; firestoreRecitation.js:262; AdminDashboard, AdminDistributionView, AdminPerformanceDashboard.jsx:59. |
| Quran ayah modal/card and recitation labels | memorized status/completion is labeled self-reported; optional student-written recitationScore labeled self-recorded, not mastery. High text-match ratings describe practice, not certification. Persisted earnedBadges preserved; Baqarah/stability awards no longer inferred from old count/score fields. | Implemented, not tested for detached ayah-modal controls and all historical badge variants. QuranSurahAyahsModal; QuranMapSurahCard:163; recitationEngine; Dashboard.jsx:866. |
| Legacy JSON helpers | database.js and safarEcosystem.js retain historical seeded/calculated counts and memory-score helpers. They are not the current Firestore approved-page source, nor imported into declarations. Private recitation/profile/group routes use Firestore. | Not migrated or executed against original data. All four original JSON SHA-256 values matched the pre-P1 baseline. Legacy identity/membership verification still required before any future migration. |

### Actual commands and evidence from this run

| Command | Result |
|---|---|
| npm.cmd run test:security | 15/15 passed,0 failed; expanded protected-field allowlist regression. |
| npm.cmd run test:emulator | 25/25 passed,0 failed,21,670ms; real Auth Emulator students integrity-a/integrity-b and assigned/unassigned teachers, Firestore Rules and API persistence. P1 case tests/firebase-emulator.test.js:708. |
| npm.cmd run test:emulator:browser | Final12/12 passed,0 failed,129,272ms:9 Chrome journeys +3 safety checks, Auth/Firestore/Storage Emulators. P1 case tests/firebase-browser.test.js:777. |
| npm.cmd run build | Finalexit0,2292 modules; main bundle approximately2,893kB. Existing chunk-size warning remains; compilation is not functional evidence. |
| git -c core.safecrlf=false diff --check and four SHA-256 comparisons | Passed. server/db.json, safar_data.json and both backups unchanged from pre-task baseline; both Emulator suites independently assert original hashes. |

Chrome exercised self-declared pages2 versus synthetic legacy approved-looking77/12/99 values. Reload/login preserved the declaration, never surfaced77 as approved. Temporarily deleting only the synthetic user's profile forced a real Firestore update failure; UI showed error and kept2 instead of6, then the fixture was restored. Injected review503 showed an error and leftpending; real subsequent teacher review persisted, survived reload, and still showed approved pages unavailable and XP unchanged. The existing Chrome text-recitation journey also saved a server-verified practice attempt and reviewed it. Evidence: reports/browser-groups/result.json (memorizationIntegrityP1Passed/sourceHashesUnchanged) and23-memorization-integrity.png; screenshots alone are not database proof.

The initial Chrome run failed an outdated empty-metric string assertion; an intermediate render edit also failed compilation and was corrected. Only the complete final rerun above is acceptance evidence. All data are synthetic in demo-ma7fath-test; browser blocks external requests and server Emulator mode disables Gemini calls.

**Limits:** microphone/audio recognition, tajweed accuracy, live AI/provider delivery, production rules, mobile/PWA and every onboarding/modal/AI variant were not tested. This change does not claim teacher-approved memorization works: no persisted page-approval source exists. Practice review and student declarations remain separate. Inactive-membership/report-history scope is superseded by the teacher-scope follow-up above; false-success and other historical audit findings remain open.


## P0 findings fixed locally — 2026-10-04, Asia/Amman

**Tested and working for the ownership/persistence scenarios below.** The P0 findings from the audit are resolved in local code and exercised with real Auth Emulator tokens, Firestore Rules and Chrome. No production access, deployment, migration or original JSON modification. The comprehensive audit below remains a historical baseline; its old server line references and P0 descriptions are superseded by this section. The P1 integrity follow-up above supersedes that specific finding; other P1/P2/P3 findings remain open.

### Caller trace completed before changing routes

| Endpoint | Actual frontend callers and change |
|---|---|
| GET/POST/DELETE /api/ai/chat | AiAssistant loads, sends and clears history. All use fetchWithAuth; no targeting userId in requests; server history replaces cached history even when empty. Failed send/delete displays an error, does not create a fake locally saved AI response or clear the existing history. |
| POST /api/ai/chat | FiveFortressesPlan generates an AI plan; SimilaritiesView generates similarities. Both migrated from anonymous fetch to fetchWithAuth, remove guest/mutashabihat_ai identity and check HTTP/success result. |
| GET /api/user/fortress-plan/:uid | No actual frontend HTTP caller found. fortressService reads/subscribes to the Firestore current plan. API secured for legitimate future/existing external callers. |
| POST /api/user/fortress-plan | fortressService previously saved directly to Firestore then optionally JSON. It now awaits this authenticated API and caches only after committed success; errors propagate. Existing wizard, simplified and visual fortress clients retain the same service contract; simplified/visual save failures expose an alert. |
| /api/auth/signup, login, google, demo, admin | No current UI HTTP callers. AuthContext/AuthModal use Firebase signup/password login/Google popup directly. Legacy docs were references, not callers, and were corrected. All five JSON endpoints now return410/success=false in every environment. No test-only seeded login retained. |

### Routes, data and authorization changed

| Route/source | Current behavior and evidence |
|---|---|
| GET /api/ai/chat (server/index.js:301) | requireAuth, token uid only, own Firestore history. Foreign uid/userId hints in query/body rejected403 even for admin/multi-role. |
| POST /api/ai/chat (server/index.js:368) | requireAuth/token uid; no client history identity trusted. Bounded latest100 messages, paired append in Firestore transaction. Persistence failure503/success=false, no successful invented fallback history. Server can generate its ordinary local reply when no AI key, but must commit it before success. |
| DELETE /api/ai/chat (server/index.js:310) | Deletes only token owner's current chat document; no global delete or arbitrary UID branch. Foreign hints403; commit error503. |
| GET /api/user/fortress-plan/:uid (server/index.js:167) | Firebase auth, URL must match token; no admin override. Own Firestore plan; missing404/read failure503. |
| POST /api/user/fortress-plan (server/index.js:153) | Firebase auth; body uid/userId and nested plan uid/userId, if present, must match token. Requires plan object. Writes token-owned current Firestore document with merge and server timestamp; success only after awaited write. Failure503. |
| POST /api/auth/{signup,login,google,demo,admin} (server/index.js:79) | Always410; no JSON account/password/client-asserted Google identity authentication. Standard Firebase signup/login code unchanged. |
| server/privateUserData.js:5 | Central identity-hint rejection; document paths derive from verified req.user.uid. Chat: users/{uid}/private_ai_chat/current. Plan: users/{uid}/five_fortresses_plans/current, same document as existing client. No JSON import. |
| firestore.rules:109,113 | Private chat owner-read/server-write only; plan owner-read/write only. Broad subcollection rule explicitly excludes these paths, preventing teacher/admin bypass. Tests deny other-owner/admin/teacher reads and client chat forgery. |

Admin has no exceptional private-history access. No product requirement permitting it was found. Incoming UID hints are compatibility checks, never an identity source. Nested userContext affects generated text only, never the account/storage target. No DELETE plan endpoint was added.

### Executed checks for this follow-up

| Command | Actual result |
|---|---|
| npm.cmd run test:security | Final15/15 passed,0 failed. Includes all retired legacy endpoints in normal non-Emulator runtime with asserted admin/Google/seed identity; no database request or production token verification needed for their unconditional410. |
| npm.cmd run test:emulator | Final24/24 passed,0 failed,19,407ms. Auth/Firestore demo only. |
| npm.cmd run test:emulator:browser | Final11/11 passed,0 failed,101,047ms:8 Chrome journeys plus3 safety checks. |
| npm.cmd run build | Exit0,2291 modules; main chunk2,896.43kB/gzip679.56kB. Chunk-size warning remains. Compilation is not ownership evidence. |
| git diff --check | Passed, no whitespace errors. |

New assertions: tests/firebase-emulator.test.js:631 and :686; tests/api-security.test.js:78; tests/firebase-browser.test.js:703.

- Actual Auth Emulator users private-a/private-b create and retrieve their own chats/plans. Missing and invalid token rejected401 on all five private route/method combinations.
- A cannot read/write/delete B's chat via uid/userId in URL/body or write/read B's plan, including nested plan identity. Admin and multi-role accounts also denied foreign ownership. Direct Firestore reads by foreign student/admin/teacher denied; own chat read permitted, client chat forgery denied.
- Deleting A's history leaves B's two messages and B's plan intact. No-token delete cannot clear any account.
- Injected chat transaction failure, plan write failure and chat delete failure each return503/success=false and leave stored documents unchanged.
- Chrome sends chat via UI, verifies Firestore, refreshes and signs out/in to retrieve it. A clears only A; B's fresh login displays B's history, not A's. Injected503 send restores the draft/shows error; failed delete retains displayed history.
- Chrome executes authenticated fortress-service save/read/refresh plus a real simplified-plan completion button. The button commits to Firestore; injected503 displays an alert and the database retains the saved plan. Complete fortress-wizard/day/week behavior is not claimed by this test.

Logs: %TEMP%/ma7fath-p0/{security-final,emulator-final,browser-final,build-final}.log. Chrome checkpoint: reports/browser-groups/22-private-chat-and-plan.png. Both Emulator suites now verify hashes of the original JSON files and backups.

### Original files unchanged

Independent pre/post SHA-256 check also passed for all four files:

| File | Unchanged SHA-256 |
|---|---|
| server/db.json | D474671CE57395993C6C16F937B35A485D80F87E2254372C11FEAF8459DC4A86 |
| server/safar_data.json | 30AC0AAD7F218FDF46CF3258CE40B48A37374103261279379CB408569A6448E2 |
| server/db.backup.json | 8B17FAF14EB42CF7E632A0E2DA5531F22889EE2A284314AF80D8FF7E29743E90 |
| server/safar_data.backup.json | 785E2650D2365BD7B7087EF88AE7BE5BEF48C54526F831B8FE079CF3DB8D8CE5 |

### Limitations and compatibility

- All data fixtures synthetic/demo; no production credentials/data/rules deployment. Local rules changes must eventually be deployed only in a separately authorized task.
- No legacy JSON chat/plan data automatically migrated. Old JSON histories will not appear in the new Firestore-only history. Existing Firestore fortress current documents keep their path.
- Gemini/provider calls intentionally disabled in isolated Emulator tests. Local deterministic reply and persistence exercised; live AI response quality/Google popup not tested. Firebase signup implementation unchanged; existing password login/sign-out rerun through Chrome, not a fresh signup journey.
- Generative FiveFortressesPlan/SimilaritiesView callers were traced/migrated; their full model-generated outputs not exercised by Chrome. Private API and AiAssistant UI are exercised.
- Existing fortress optimistic display/cross-profile preferences, full wizard/reset/scheduling and unrelated audit findings remain separate work. A save failure is explicit and no successful API response/cache commit occurs; whole fortress lifecycle is not declared complete.
- No new load/rate-limit/oversized-history/provider-cost test. Firestore failure is an error, never invented success. This follow-up closes the specified P0 authorization paths, not all project security findings.

---

# Whole-project audit baseline — before P0 fixes

Audit date: **2026-10-04, Asia/Amman**. Reference: current working tree, including pre-existing uncommitted changes. This replaces the old report; historical T-numbered results are not current evidence. This was an audit: only PROJECT_STATUS.md edited; no application/rules/original JSON/production data changed, no migration or deployment. Build/browser artifacts and temporary synthetic data were generated normally.

## Overall health

The tested core journeys work on demo Emulators: sign-in, role switching, group lifecycle, profile photo, community/in-app notifications, manual plan, declared ayah progress, text practice, assigned-teacher review/notes and selected analytics. **The whole project is not complete or fully verified.** Static gaps include public AI history read/delete, unauthenticated legacy plan reads, self-editable counts presented as approved memorization, inconsistent active-membership checks, fabricated leaderboard values and false-success paths.

## Status labels

- **Tested and working**: only the explicitly executed scenario.
- **Implemented, not tested**: implementation exists, without functional evidence this run.
- **Partial**: some connected/tested behavior with a known gap.
- **Broken**: code demonstrates a flow cannot satisfy its stated behavior; static/reproduced identified.
- **Not assessed**: insufficient evidence.

Source references below are repository-relative implementation anchors, not test evidence. Partial rows can contain successful tests.

## Executed commands and evidence

| ID | Command/result | Boundaries |
|---|---|---|
| E1 | npm.cmd run build: exit0, 2292 modules, main chunk2,915.46kB/gzip686.73kB | Compilation only; >500kB warning. |
| E2 | npm.cmd run test:security:14 passed/0 failed | Policy/anonymous rejection/stat isolation/rules assertions/Amman boundary/Emulator safety; not all routes. |
| E3 | npm.cmd run test:emulator:22 passed/0 failed; Node duration19,935ms | Auth/Firestore rules/API tests including3 environment-safety tests. |
| E4 | npm.cmd run test:emulator:browser:10 passed/0 failed; Node duration95,219ms | Seven Chrome journeys plus3 safety tests; Auth/Firestore/Storage; student, two teachers, admin, multi-role. |
| E5 | Read-only temporary Node inventory and SHA-256 | All4 server JSON files unchanged including backups; inventory below. |

Logs: %TEMP%/ma7fath-audit-20261004. Browser artifacts: reports/browser-groups/. Build is not functional evidence.

**Isolation:** scripts/runFirebaseEmulatorTests.mjs:7–76 copies rules/config into temporary directories; demo-ma7fath-test; NODE_ENV=test/MA7FATH_EMULATOR_TEST=1; credentials removed; Auth127.0.0.1:9099, Firestore:8080, browser Storage:9199. Test API JSON files are temporary. Chrome blocks non-loopback traffic/service workers. Frontend/API use the same demo/default database. Unsafe-configuration rejection rerun. No real Firebase provider/database/bucket accessed or migration/deploy run.

Inventory initially failed from inline Node quoting; Python unavailable. Temporary .mjs then verified hashes/primary inventories and failed on malformed backup as recorded E5.

| Test source | Exact coverage rerun |
|---|---|
| tests/firebase-emulator.test.js:107,116,177 | Self role/XP/level/streak/memory/membership denied; allowed profile, other-student isolation, assigned teacher/admin/multi-role, invalid token/revoked role. Does not test own page-count denial. |
| Same:198,264,273 | Create/assign/join/transfer/leave/approval/new tokens; direct write denial; concurrent count once; injected transaction503/no mutation. |
| Same:305,336,346 | Login/no activity/same-day/next-day/gap streak via test clock; admin-only configuration; Uthmani marks/coordinate rejection. |
| Same:157,372,420,447,487,502 | Ayah ownership; atomic/idempotent practice, forgery/conflict/rollback/zero/no rewards; server reference; teacher approval/rejection/notes/reports. |
| Same:126,543,588,613 | Known/empty metrics, own scope/multi-group active roster, missing cache fields null, live count overrides stale counter. |
| tests/firebase-browser.test.js:133 | Group UI lifecycle/new reads/login. |
| Same:247 | Typed practice/save/submit/approve/note/report/student notification after login; zero/503/retry/no XP/pages; visible page2 reference equality,6 marks,RTL/bundled font load. |
| Same:388 | Role UI switch; post/create/edit/delete/foreign-denial/interactions/read; real avatar upload/save/refresh/login/type-size rejection/profile-save failure/foreign Storage403. |
| Same:505 | Manual plan and ayah2:5 declared review saved by UI/recovered after sign-in/teacher-admin read/no XP/pages. |
| Same:567 | Admin visibility/order/badge display data/refreshed UI/nonadmin denial; earnedBadges field unchanged, not historic badge display. |
| Same:611,657 | Admin known/empty/different group counts; own chart/zero/second account isolation/distinct teacher totals/group labels after refresh. |

## Feature-by-feature status

Filenames without directory in this section are src/components/; pages are src/pages/. Each row identifies UI action, source/connection, execution or gap.

### Public, account, navigation and profile

| Feature | Status | Data/service, connection, evidence/gap and sources |
|---|---|---|
| Landing sections/FAQ/CTA/navigation | Implemented, not tested | Local landing components/account modal. No complete links/responsive test. LandingPage.jsx:58; landing/*; src/App.jsx:14. |
| Marketing statistics/testimonials | Partial | Fixed +50,000/+2.5M/99.4%/testimonials not measured. LandingStats.jsx:9; LandingHero.jsx:301; LandingTestimonials.jsx. |
| Mobile welcome | Implemented, not tested | Responsive local branch; no mobile/device test. mobile/MobileWelcomeView.jsx; LandingPage.jsx:58. |
| Landing live recitation | Implemented, not tested | Recorder/API; public analysis separately tested, demo recording UI not. landing/LandingLiveDemo.jsx; src/hooks/useRecitationRecorder.js. |
| Existing email/password login/logout | Tested and working | Firebase Auth/users/AuthContext; E4 repeated fresh logins. src/context/AuthContext.jsx:29; AuthModal.jsx. |
| Registration | Implemented, not tested | Auth then Firestore profile; callback also creates profile, race/partial-save untested. AuthContext.jsx:90; firestore.rules:42. |
| Google popup | Implemented, not tested | Firebase provider/profile; no provider/popup test. AuthModal.jsx; src/lib/firebase.js:19. |
| Multi-role switch | Tested and working | Granted roles+per-uid active-role UI preference; E4 home/nav/tab switches retain roles. Server authorizes all grants, independent of active UI role; not reduced-privilege session. AuthContext.jsx:19,291; Dashboard.jsx:223; Sidebar.jsx. |
| Route/wizard guard | Partial | Cached profile fallback; any preferences can qualify onboarding complete. Only /,/wizard,/dashboard routes. Backend still requires tokens. ProtectedRoute.jsx:14,30; App.jsx:14–29. |
| Onboarding goal/style/portfolio | Partial | users preferences/local calculations; AI stage timeout, selected surahs converted to first21pages. Full wizard not run. OnboardingWizard.jsx:155,212. |
| Wizard group join | Partial | Public lookup/auth transaction API tested; standalone modal E4, full wizard untested. OnboardingWizard.jsx; server/routes/groups.js:33,39. |
| Profile photo | Tested and working | Storage avatars/{uid}→URL→Firestore→UI; E4 upload/save/refresh/login/validation/profile-save failure/foreign-write denial. Actual own upload-network interruption not tested. UserProfileModal.jsx:36; storage.rules:4. |
| Profile name | Implemented, not tested | updateUserData Firestore result checked; no name-edit UI assertion. UserProfileModal.jsx:91. |
| Delete account | Partial | Auth deletion only; Firestore/subcollections/Storage remain; reauth/cleanup untested. AuthContext.jsx:206. |
| Sidebar/bottom nav/more tools/theme/language/settings | Partial | Context/preferences/localStorage; desktop role navigation tested, mobile/all English/accessibility not. Sidebar.jsx; BottomNavBar.jsx; MoreToolsModal.jsx; QuickSettingsMenu.jsx; LanguageContext/ThemeContext. |
| Refresh/PullToRefresh | Partial | Static false-success: helper catches read failure and returns success; toast ignores result. Dashboard.jsx:120; AuthContext.jsx:269; PullToRefresh.jsx. |
| Documentation/presentation modals | Implemented, not tested | Local content/images; no navigation/layout test, claims not evidence. DocumentationModal.jsx; PresentationModal.jsx. |

### Student Quran, plan and progress

| Feature | Status | Data/service, connection, evidence/gap and sources |
|---|---|---|
| Home counts/goal/group | Partial | Profile/preferences/pointers; E4 streak/group. Approved/mastery labels not trusted. Dashboard.jsx:281,518,534. |
| Days with Quran | Tested and working | Committed new practice→server streak/date; E3 login/same-day/next-day/gap, E4 persistence. Consecutive active days, not lifetime; text practice qualifies without approval. server/quranActivityStreak.js; firestoreRecitation.js:126. |
| Manual plan | Tested and working | users.preferences; E4 manual target save/login/teacher read, other automatic modes untested. MyPlanManager.jsx:54; browser test:505. |
| Declare ayah status | Tested and working | portfolioService→own ayah_progress/uid cache; E3/E4 2:5/new login/teacher-admin/no XP-pages. QuranMapPage.jsx; src/lib/portfolioService.js:109. |
| Quran map page/quick/bulk actions | Partial | Profile counts/preferences/local reviews/legacy REST; synthetic95/75/50 scores, ignored rejected write/optimistic celebration. Full actions untested. QuranMapPage.jsx:176; portfolioService.js:15. |
| Portfolio cache/realtime/bulk | Partial | Firestore/local cache; empty snapshot skips notification leaving stale last record; chunks partially commit; legacy JSON separate. portfolioService.js:221; index.js:374. |
| Surah cards/old ayah modal | Partial | Local/reference/portfolio; old QuranSurahAyahsModal no mounted import found. quranMap/QuranSurahAyahsModal.jsx; QuranMapSurahCard.jsx. |
| Mushaf/daily-session text | Tested and working | Server Uthmani→UI; E4 page2 exact text/marks/RTL/font, not every page/device. QuranInteractiveView.jsx:335; server/quranReference.js:21,44; src/index.css. |
| Tafsir | Implemented, not tested | External alquran.cloud blocked in suite. QuranInteractiveView.jsx:304. |
| Reciter playback | Implemented, not tested | everyayah/CDN; no audible/provider/mobile test. QuranAudioPlayer.jsx. |
| Typed comparison | Tested and working | Validated coordinates/server corpus ignores forged expectedText; E3/E4. Matching normalization separate from display. quranReference.js:44; recitationEngine.js; index.js:645. |
| Microphone/recognition/tajweed | Implemented, not tested | MediaRecorder/AI services; no real audio/provider/tajweed accuracy evidence. useRecitationRecorder.js; recitationEngine.js. |
| Practice/history/page stats | Tested and working | Atomic Firestore sessions/stats/page_progress; E3 forgery/concurrency/rollback/zero, E4 persistence/retry; no XP-pages. firestoreRecitation.js:126; index.js:736–773. |
| Submit for teacher review | Tested and working | Own session/current assignment; E3/E4. Inactive edge untested/check incomplete. firestoreRecitation.js:76,93. |
| Approved memorization/XP awards | Not assessed | No complete authoritative approval/reward path proved; practice review intentionally not pages/XP. |
| Fortresses setup/generation | Partial | users.fortressPlan/preferences/cache/optional JSON; failure returns success with cache fallback. No day/week cycle. fortressService.js:128–159; fortress/FortressSetupWizard.jsx. |
| Fortress toggles/simplified/visual map | Partial | Client XP claim filtered by AuthContext; success/sync timers before persistence; UTC daily reset. FiveFortressesPlan.jsx:168,212; FiveFortressesVisualMap.jsx:187; SimplifiedFortressPlan.jsx:93,111. |
| Learning-style quiz | Partial | Local weighted quiz→preferences/REST; save result/status ignored before success toast, untested UI. LearningStyleProfiler.jsx:65–104. |
| AI assistant | Partial | JSON/localStorage/Gemini or local fallback; arbitrary userId/public history/delete-all. No live model test. AiAssistant.jsx:86,164,207; index.js:495,506,564; database.js:434. |
| Mind maps | Partial | Static maps/favorites Firestore/per-uid local node completion; celebration not trusted award, cross-device/content untested. MindMapsView.jsx:84,90,109. |
| Similarities/custom/favorites | Partial | Static/global localStorage/public AI; cache shared users, custom entries not DB-durable, content/AI unverified. SimilaritiesView.jsx. |
| Achievements | Partial | Profile thresholds/app_config; E4 metadata and earnedBadges field retention only; UI ignores earnedBadges, Baqarah pages>=49 not surah identity. Dashboard.jsx:863–870; uiConfiguration.js. |
| Analytics/chart | Partial | Own API/Firestore; E3/E4 real7Amman-day counts/zero/empty/isolation. Approved-pages label reads self-editable count. AnalyticsView.jsx:38; VisualProgressTracker.jsx:5; groups.js:217,252. |
| Dhikr/celebrations | Implemented, not tested | Local/static UI, no durability proof. PostSessionDhikr.jsx; CelebrationOverlay.jsx. |

### Groups and teacher flows

Teacher components below are in src/components/teacher/.

| Feature | Status | Data/service, connection, evidence/gap and sources |
|---|---|---|
| Join/leave/transfer/approval | Tested and working | Firestore groups/memberships/users/requests/invites transaction; E3/E4 repeat/concurrent/failure/new login. firestoreGroups.js:72; routes/groups.js:39,43,274,285; onboarding/JoinGroupModal.jsx. |
| Group displayed count | Tested and working | Live status=active memberships/groupId; E3 stale stored counter ignored, E4 differing/empty groups. Member role/account-status integrity not separately validated. firestoreGroups.js:20. |
| One membership/one request | Partial | memberships/{uid}/enrollmentRequests/{uid}: one active group and one pending request per user. **Implementation constraint, not confirmed final requirement.** Later request overwrites previous history; no legacy import. |
| Capacity | Partial | Cached groups.studentsCount used despite live displayed count; stale cached counter can affect capacity. firestoreGroups.js:72. |
| TeacherDashboard | Tested and working | Assigned active roster/groups/sessions; E3/E4 real total/per-group labels replaces24/default names; rolling168hour activity, pending/recent. TeacherDashboard.jsx; groups.js:187. |
| Roster/search/sort/filter | Partial | Active membership/profiles; scope tested; consistencyRate/thisWeekSessions nullable denormalized without proved writer. Fetch failure can leave stale list, filters not all run. TeacherStudentsView.jsx:62,80; firestoreGroups.js:159. |
| Groups/invites/open roster | Partial | Scoped groups/live counts tested; open-group callback shows all students without group filter, copy/share errors untested. TeacherGroupsView.jsx:32; Dashboard.jsx:243. |
| Add/enroll by email | Partial | Existing identity/scoped transaction; relevant API scope covered, full email-add UI not. First-group behavior unclear with multiple groups. TeacherStudentsView.jsx; groups.js:255,262. |
| Assigned student profile/plan/progress | Tested and working | Membership teacher pointer/Firestore; E4 records visible, E3 transfer revokes former teacher. Inactive check absent. TeacherStudentProfileModal.jsx; groups.js:118. |
| Practice approval/rejection | Tested and working | Pending/submitted teacher/current membership transaction; E3 both decisions/spoof denial, E4 approve; no XP/pages. Inactive edge unresolved. groups.js:144; firestoreRecitation.js:93. |
| Notes | Tested and working | Batch teacher_notes/recipient notification; E3/E4 persistence and spoof denial. Inactive edge untested. groups.js:150; TeacherStudentProfileModal.jsx. |
| TeacherReportsView | Partial | Firestore lifetime sessions/notes for teacherId members; E4 real approved/note/zero. No active filter; prior teachers' history included. Approved means practice review. groups.js:167; TeacherReportsView.jsx:12. |

### Community, notifications and administration

| Feature | Status | Data/service, connection, evidence/gap and sources |
|---|---|---|
| Post create/list/edit/delete | Tested and working | Auth API/Firestore; E4 UI/DB and foreign denial; direct Firestore collection blocked. Community.jsx; community.js:41–76. |
| Comments/likes | Tested and working | Token identity/transactional uid likes/comments/notifications; E4. Comment edit/delete absent despite canDelete serialization. Load/concurrency not fully covered. community.js:94,117. |
| Anonymous posts | Partial | Name hidden but authorId exposed in API; static privacy caveat. community.js:47. |
| Community progress/leaderboard | Partial | Profile count/static array; untrusted mastery claim and fake14,250/12,800/11,400XP; own2,450XP/14days. Community.jsx:216,722. |
| Durable in-app notifications | Tested and working | Owner API/users/{uid}/notifications; E4 likes/comments/notes/read/foreign-denial. community.js:140–169; NotificationCenter.jsx. |
| Local reminders/achievement notices | Partial | State/cache/browser-open timers; decorative XP50 not award; reminder key shared accounts, UTC/local mix, closed-browser untested. NotificationContext.jsx:25,347,415; NotificationCenter.jsx:592. |
| Mark review done | Broken | Static: local celebration says review/mastery updated without persisting review. ReviewReminderAlert.jsx:39. |
| Push/FCM | Broken | Static disconnected: denied fcmToken user write + missing register-token route. Emulator disables FCM; no actual Push evidence. firebase.js:31,86,94; public/firebase-messaging-sw.js. |
| Admin users/teachers/roles | Partial | Protected Firestore APIs/roles map; E3/E4 selected role/list/create, removal constrained by assigned groups; every action/error/filter not tested. admin/AdminDashboard.jsx:70,149; groups.js:49,100,105. |
| Admin groups/distribution/requests | Tested and working | Firestore transactions; E3/E4 setup/transfer/approval/new reads; no legacy import. admin/AdminDistributionView.jsx; groups.js:274–285. |
| Admin overview activity | Tested and working | Firestore activity markers/sessions/memberships; E3/E4 known/empty; distinct active users not fabricated percentage. groups.js:61–98; AdminDashboard.jsx:70. |
| Recent joins | Partial | memberships.updatedAt counts touched current records: retries/transfers not first joins; deleted members vanish. groups.js:61; firestoreGroups.js:72. |
| Admin performance | Partial | Sessions/ayah collection groups; E3/E4 real/zero/failure/retry. Approved pages constant0; inactive member filter missing; multi-role teacher/admin excluded learner cohort while sessions include all. firestoreRecitation.js:210; AdminPerformanceDashboard.jsx. |
| Completion simulator | Implemented, not tested | Explicit hypothetical inputs, not actual projection. AdminPerformanceDashboard.jsx:18. English reference disclaimer stale versus Arabic trusted-reference copy. |
| Section visibility/order/badge metadata | Tested and working | app_config/navigation signed-in read/admin write; E4 refresh/nonadmin denial. No schema rule/historic-badge display proof. admin/AdminExperienceSettings.jsx; uiConfiguration.js:39,53. |
| Old badges/community moderation screens | Broken | Static no mounted import found; create/edit/grant/approve-all handlers missing. Not same as working display settings. admin/AdminBadgesView.jsx; AdminCommunityView.jsx. |
| Old AdminPanel/duplicate tab | Partial | Wrapper; second admin-panel switch unreachable after earlier case. Dashboard.jsx:257,898; AdminPanel.jsx. |

### Infrastructure and disconnected data

| Feature | Status | Source/evidence/limits |
|---|---|---|
| REST auth/roles | Partial | E2/E3/E4 protected flows; roles reread Firestore. Public legacy routes below remain. server/middleware/auth.js:37,83; accessControl.js. |
| Firestore rules | Partial | E3 actual denies/allowed scenarios. Teacher read trusts users.teacherId; page counts editable; owner wildcard subcollections/app_config schema gap. firestore.rules:35,64,85. |
| Storage rules | Partial | E4 own upload/foreign403. image/.* broader than picker, not byte validation; any signed-in user reads avatars; old successful images not removed. storage.rules:4–14. |
| Quran corpus | Partial | Local Uthmani/114surahs/6236verses and tested fixtures; not independently verified whole corpus. server/quranReference.js:1,21,44,69; server/data/. |
| PWA/install/offline/update | Implemented, not tested | Manifest/SW/hooks exist; suite blocks SW; no install/cache/offline/account-isolation proof. public/; src/hooks/usePWAInstall.js. |
| Capacitor Android/iOS | Not assessed | No native build/sync/device. capacitor.config.ts; android/; ios/. |
| Error boundaries | Implemented, not tested | No deliberate error/recovery run. ErrorBoundary.jsx; SafeBoundary.jsx. |
| UI primitives/floating AI/juz selector | Implemented, not tested | Render/navigation code, no independent tests. ui/Button.jsx/Card.jsx/Logo.jsx; FloatingAiButton.jsx; JuzMultiSelector.jsx. |
| AudioWaveVisualizer | Broken | Static mic denial fake animation and random88–98% analysis; no mounted import found, not attributed to current recorder. AudioWaveVisualizer.jsx:64,85–89. |
| JSON/Safar/migration | Partial | Seeds/fallbacks still present; new groups Firestore; JSON auth/AI/fortress/portfolio survive. Migration not run. safarEcosystem.js; database.js; scripts/migrateToFirestore.js. |
| Old tests/helpers | Partial | test-auth.js prints; testStreak.cjs configured Firestore deliberately not run; source-mutating tests/append-tests.mjs not run. |
| Extra entries | Not assessed | Actual React entry main.jsx; main.ts/counter.ts/server/db.js not established active routes. |

## Registered API inventory

Prefix /api omitted. Enumerated from server/index.js and server/routes/{groups,community}. “Covered” means selective assertions, not all branches. Routers precede broad admin guard but protect admin routes explicitly.

| Routes | Authentication/source/UI connection/assessment and line |
|---|---|
| GET health; quran/reference/page/:pageNumber; quran/reference/surah/:surahNumber | Public health/corpus; reference connected/tested. index.js:46,51,59. |
| POST auth/signup; auth/login; auth/google | Public JSON legacy identity, not Firebase UI. Google trusts client identity/email, not verified credential. Untested. index.js:81,129,160. |
| POST auth/demo; auth/admin | Public seeded JSON account; not Firebase role bypass but local identity disclosure, untested. index.js:227,243. |
| GET/PUT user/:uid | Auth self/admin read, self-only restricted write/Firestore; selected identity tests, all fields not. API rejects counts unlike rules. index.js:259,285. |
| POST user/fortress-plan; GET user/fortress-plan/:uid | Auth self JSON POST returns success missing local user; GET arbitrary plan unauthenticated. Static findings. index.js:325,353. |
| GET user/:uid/portfolio; POST user/:uid/portfolio/ayah; portfolio/bulk-surah | Auth self JSON, disconnected from current Firestore portfolio; roundtrip untested. index.js:374,389,405. |
| PUT/DELETE admin/user/:uid | Broad admin guard, JSON-only, not Firebase source; untested. index.js:427,429,463. |
| GET quran/pages; POST quran/pages/:pageNumber/review | Public seeded JSON/global pages; authenticated review deliberate410 deprecated. index.js:476,486. |
| GET/DELETE/POST ai/chat | Public arbitrary userId JSON history; missing uid delete-all. Static vulnerability not covered. index.js:495,506,564; database.js:434. |
| POST ai/recitation-check | optionalAuth public analysis/save requires auth; server reference/transaction. Typed/save/forgery E3/E4, voice untested. index.js:645. |
| POST recitation/save; recitation/sessions/:sessionId/submit; GET recitation/history; recitation/page-stats/:pageNumber | Owner token/Firestore; save confirms existing result. E3/E4. index.js:736,751,761,773. |
| GET ai/recitation-status | Public capabilities/config flags, not provider invocation; untested separately. index.js:785. |
| GET admin/memorization-performance | Admin Firestore, E3/E4/cited cohort gaps. index.js:802. |
| GET groups; groups/lookup; POST groups/join; groups/leave | Auth scoped list/public minimal lookup/token self mutation, E3/E4. Rules broader: all signed-in read group invite codes. groups.js:27–43. |
| POST admin/groups/create; GET admin/users; admin/safar-users; admin/overview | Explicit admin/Firestore, selected E3/E4, filters not complete. groups.js:46–98. |
| POST admin/assign-teacher; admin/remove-teacher; admin/create-teacher | Explicit admin/existing identity/group constraint; E3 selected errors. groups.js:100–105. |
| GET teacher/:teacherId/students; available-students | Own teacher/admin; active roster, independent users excludes teacher/admin multi-role. Roster covered, full add UI not. groups.js:114,255. |
| GET teacher/:teacherId/student/:studentId | Scope+teacher pointer/no active check, Firestore profile/history/progress. Normal E3/E4. groups.js:118. |
| PATCH teacher/:teacherId/student/:studentId/sessions/:sessionId/review; POST teacher/:teacherId/student/:studentId/notes | Scope+exact uid, admin cannot impersonate reviewer; no member active check. E3 decisions/denial, E4 approve/note. groups.js:144,150. |
| GET teacher/:teacherId/reports; dashboard | Teacher own/admin; reports lack active filter, dashboard active; normal E3/E4. groups.js:167,187. |
| GET student/analytics | Token uid own Firestore; E3/E4/approved-page semantics gap. groups.js:217. |
| POST teacher/:teacherId/enroll-student; add-student | Scope/group owner/transaction/existing identity; relevant API tests, full email UI untested. groups.js:262. |
| POST admin/distribute-student; safar/enrollment-request; GET admin/enrollment-requests; POST admin/enrollment-requests/approve | Admin except self request; Firestore atomic, E3/E4 spoof/repeat/concurrency. groups.js:274–285. |
| GET/POST community/posts; PUT/DELETE community/posts/:id | Auth list/create, owner/admin edit/delete, Firestore E4. community.js:41–76. |
| POST community/posts/:id/like; comments | Token uid transactions E4; no comment edit/delete route. community.js:94,117. |
| GET notifications; PATCH notifications/:id/read; POST notifications/read-all; DELETE notifications/:id; notifications | Owner API/Firestore; E4 reads/mark/cleanup; unbounded batches may exceed500, no pagination. community.js:140–169. |
| Static SPA catch-all | Navigation fallback, not authorization. index.js:829. |
| Missing POST notifications/register-token | Client calls but no registered route. firebase.js:94. |

## Data ownership and metric definitions

1. Declared ayahs: own ayah_progress documents/statuses; self-written scores/repetitions are not teacher assessment. Rules bound ayah1–286, not actual surah length; document/global IDs not consistent by enforcement.
2. Practice: server sessions/stats/page_progress, server reference, immutable client result, idempotent IDs. Teacher approval is practice review only.
3. Profile pages: memorizedPages/memorizedPagesCount/totalJuz self-editable (rules:64/AuthContext:218); XP/level/streak protected. memoryScore starts100 without proved measurement writer. Approved/perfect-mastery labels unsupported.
4. Student chart: seven Amman calendar dates including today; attempts per date, all-time accuracy and review-status counts. Empty accuracy unavailable.
5. Teacher dashboard: active assigned membership total/per-group; trailing168hour sessions, active-student ratio, pending submitted to this teacher. Different date range than calendar-day student/admin metrics. Attention omits students with no practice ever.
6. Teacher reports: lifetime sessions/notes for teacherId member records including inactive and previous teachers' history, not teacher-attributed decisions.
7. Admin overview: distinct users with qualified activity today/last7calendar days; recorded practice sessions. Recent joins actually membership.updatedAt touches.
8. Admin performance: all sessions/progress versus learner cohort excluding teacher/admin even multi-role; inactive records not uniformly excluded; authoritative approved pages unavailable.
9. Community: Firestore authoritative posts/interactions/notifications; leaderboard static; anonymous authorId exposed.
10. Badges: app_config display metadata admin-only write, not award issuance. Legacy earnedBadges document retained in E4, historic display unproved.

## Legacy inventory — no migration

| Original file | Read-only E5 findings |
|---|---|
| server/db.json | 3 users,0 membership-pointer records; SHA-256 unchanged. |
| server/safar_data.json | 25 students with membership pointers,3 teachers,3 groups,3 requests; SHA-256 unchanged. |
| server/db.backup.json | 3 users,0 membership pointers; SHA-256 unchanged. |
| server/safar_data.backup.json | SHA-256 unchanged; invalid JSON character45350/line1597/column6: expected comma or closing bracket. No record count claimed. |

Counts are records, not verified Firebase identities/unique people/production memberships. Old teacher_aisha seeds and consistency fallbacks remain (safarEcosystem.js:76,1936,1954). No automatic import or Firebase reconciliation. Future separately authorized migration requires uid/email ownership, teacher/group ownership, duplicate resolution, role/status and request provenance.

## Prioritized remaining issues

New security findings are **static**, not reproduced exploit claims. Reproduced successes/denials/failure injection are E2–E4. No application fix or test-source change made.

| Priority | Finding | Next work beyond this audit |
|---|---|---|
| P1 | Self-editable count labelled approved, rules:64/AnalyticsView:38/groups:252 | Separate declared from authoritative approval; never auto-reward practice. |
| P1 | Inactive/malformed membership scope inconsistencies | Shared active member/group-owner policy, inactive/malformed/multi-role fixtures. |
| P1 | Fortress/quiz/refresh/reminder false success | Propagate real results; distinguish drafts/local celebration from committed progress. |
| P1 | FCM blocked write/missing register route | Durable authorized registration/actual nonproduction delivery test. |
| P2 | Fake leaderboard/marketing, map scores, XP decorations | Remove/label samples; trustworthy scoped data only. |
| P2 | Historic award visibility unsupported | Durable award rendering independent of thresholds and metadata. |
| P2 | Group roster opens all/stale list after errors | Carry group filter and explicit error states. |
| P2 | Cohort/date-range/join metric mismatch | Document/count boundaries/null/multi-role correctly. |
| P2 | Unbounded interaction/notification batches | Pagination/bounded cleanup and >500record tests. |
| P2 | Storage MIME mismatch/orphans/no interrupted upload evidence | Align validation/cleanup and Storage network-failure test. |
| P2 | Shared localStorage/empty progress snapshot stale | Per-uid isolation/deletion/account-switch tests. |
| P3 | Malformed backup/dead UI/helpers/2.9MB chunk | Separately authorized repair/cleanup/performance work. |

## Explicit limitations

- No production/deployment/real account/migration. Emulator rules are copied rules, not deployed-state evidence.
- Seven Chrome journeys do not cover every tab/modal/action. Mobile Safari/native/PWA/offline/accessibility and entire English UI untested.
- No physical microphone/audio/Gemini/Hugging Face/tajweed/audible playback/external tafsir; external traffic deliberately blocked.
- Storage actual upload succeeds; validation/profile-save failure/foreign-write denial tested. Own interrupted-upload and production Storage behavior untested.
- No FCM Emulator or actual Push delivery; in-app notifications are separate.
- No load/>500document batch/malicious image bytes/every malformed date-membership/all Unicode corpus-independent validation/all exception coverage.
- Existing dirty application files preserved. Four original JSON hashes match before/after. Test artifacts are synthetic.
- Passing tests do not negate static defects. Verified core journeys have listed evidence; unresolved security, semantics, persistence and external services prevent declaring the project complete.
