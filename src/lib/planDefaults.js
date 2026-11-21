// Shared defaults for the plan targets stored in users/{uid}.preferences.
// MyPlanManager (plan builder) and FiveFortressesPlan (quick «تخصيص الخطة») edit the
// SAME preference fields through the same server merge, so they always stay in sync;
// keep their fallbacks here so the two screens can never disagree.
export const DEFAULT_DAILY_TARGET = 'صفحة واحدة يومياً';
export const DEFAULT_OLD_REVIEW_TARGET = 'نصف جزء يومياً (10 صفحات)';
