import {
  Home,
  Compass,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Map,
  BookOpen,
  Users,
  Trophy,
  BarChart3,
  Sliders,
  GraduationCap,
  Layers,
  FileText,
  TrendingUp,
  FlaskConical
} from 'lucide-react';

/**
 * Single source of truth for app navigation.
 * Sidebar (desktop), BottomNavBar and MoreToolsModal (mobile) all read from here,
 * so adding a section means editing this file only.
 *
 * - `sections`: grouped list shown in the desktop sidebar.
 * - `primary`: the 4 ids pinned to the mobile bottom bar; everything else goes to "More".
 */
export const getNavigation = (role, lang, configuration) => {
  const ar = lang === 'ar';
  const item = (id, label, shortLabel, icon, extra = {}) => ({ id, label, shortLabel, icon, ...extra });

  // Each role shows only its own sections; multi-role accounts switch roles from RoleSwitcherMenu.
  if (role === 'admin') {
    return {
      primary: ['admin-dashboard', 'admin-users', 'admin-groups', 'admin-analytics'],
      sections: [
        {
          title: ar ? 'إدارة المنصة' : 'Administration',
          items: [
            item('admin-dashboard', ar ? 'لوحة القيادة' : 'Dashboard', ar ? 'القيادة' : 'Dashboard', BarChart3),
            item('admin-users', ar ? 'المستخدمون والأدوار' : 'Users & Roles', ar ? 'المستخدمين' : 'Users', Users),
            item('admin-teachers', ar ? 'المعلمات المعتمدات' : 'Teachers', ar ? 'المعلمات' : 'Teachers', GraduationCap),
            item('admin-groups', ar ? 'الحلقات والمجموعات' : 'Groups', ar ? 'الحلقات' : 'Groups', Layers),
            item('admin-analytics', ar ? 'التحليلات ومعدلات النمو' : 'Analytics', ar ? 'التحليلات' : 'Analytics', TrendingUp)
          ]
        },
        {
          // Modules under review, not yet visible to teachers or students.
          title: ar ? 'قيد التطوير' : 'In Development',
          items: [
            item('admin-tajweed', ar ? 'مخارج الحروف وصفاتها' : 'Makharij & Sifat', ar ? 'المخارج' : 'Makharij', FlaskConical)
          ]
        }
      ]
    };
  }

  if (role === 'teacher') {
    return {
      primary: ['teacher-dashboard', 'teacher-students', 'teacher-groups', 'teacher-reports'],
      sections: [
        {
          title: ar ? 'بوابة المعلمة' : 'Teacher Portal',
          items: [
            item('teacher-dashboard', ar ? 'الرئيسية' : 'Home', ar ? 'الرئيسية' : 'Home', Home),
            item('teacher-students', ar ? 'طالباتي' : 'My Students', ar ? 'طالباتي' : 'Students', Users),
            item('teacher-groups', ar ? 'حلقاتي القرآنية' : 'My Groups', ar ? 'الحلقات' : 'Groups', Layers),
            item('teacher-reports', ar ? 'التقارير التحليلية' : 'Reports', ar ? 'التقارير' : 'Reports', FileText)
          ]
        },
        {
          title: ar ? 'أدوات الدعم' : 'Support Tools',
          items: [
            item('daily-session', ar ? 'المصحف والتسميع' : 'Quran & Recitation', ar ? 'التسميع' : 'Recitation', BookOpen),
            item('similarities', ar ? 'المتشابهات القرآنية' : 'Similarities', ar ? 'المتشابهات' : 'Similarities', BookOpen),
            item('mind-maps', ar ? 'الخرائط الذهنية' : 'Mind Maps', ar ? 'الخرائط الذهنية' : 'Mind Maps', Map)
          ]
        }
      ]
    };
  }

  const sections = configuration?.sections || {};
  return {
    primary: ['home', 'quran-map', 'daily-session', 'five-fortresses'],
    sections: [
      {
        title: ar ? 'مساري القرآني' : 'My Journey',
        items: [
          item('home', ar ? 'الرئيسية' : 'Home', ar ? 'الرئيسية' : 'Home', Home),
          item('quran-map', ar ? 'مصحفي وخريطة الختمة' : 'My Quran', ar ? 'مصحفي' : 'My Quran', Compass),
          item('daily-session', ar ? 'التسميع الصوتي الذكي' : 'Smart Recitation', ar ? 'التسميع' : 'Recite', PlayCircle),
          item('five-fortresses', ar ? 'الحصون وإنجازاتي' : 'Five Fortresses', ar ? 'إنجازاتي' : 'Progress', ShieldCheck),
          item('analytics', ar ? 'تحليلاتي الفعلية' : 'My Analytics', ar ? 'تحليلاتي' : 'Analytics', BarChart3),
          item('my-plan', ar ? 'خطتي والورد اليومي' : 'My Plan', ar ? 'خطتي' : 'My Plan', Sliders)
        ]
      },
      {
        title: ar ? 'الأدوات والمعالم' : 'Quranic Tools',
        items: [
          item('ai-assistant', ar ? 'المعلم الإيماني' : 'AI Guide', ar ? 'المعلم الذكي' : 'AI Guide', Sparkles),
          item('similarities', ar ? 'المتشابهات' : 'Similarities', ar ? 'المتشابهات' : 'Similarities', BookOpen),
          item('mind-maps', ar ? 'الخرائط الذهنية' : 'Mind Maps', ar ? 'الخرائط الذهنية' : 'Mind Maps', Map),
          item('community', ar ? 'المجتمع والهمة' : 'Community', ar ? 'المجتمع' : 'Community', Users, sections.community),
          item('achievements', ar ? 'الأوسمة والثمار' : 'Achievements', ar ? 'الأوسمة' : 'Badges', Trophy, sections.achievements)
        ].filter(entry => entry.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      }
    ]
  };
};

/** Tabs that render another tab's page share its active highlight. */
export const isNavItemActive = (itemId, activeTab) =>
  activeTab === itemId ||
  (itemId === 'admin-dashboard' && activeTab === 'admin-panel') ||
  (itemId === 'daily-session' && activeTab === 'mushaf');
