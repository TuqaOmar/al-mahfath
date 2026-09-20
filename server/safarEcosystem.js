// Safar Platform Ecosystem Engine
// Handles Groups, Teachers, Students, Admin Analytics, Roles & Permissions

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECOSYSTEM_PATH = path.join(__dirname, 'safar_data.json');

// Memory state for Safar ecosystem
let ecosystemState = {
  groups: [],
  teachers: [],
  students: [],
  independentUsers: []
};

// Seed initial rich data
function getInitialData() {
  const groups = [
    {
      id: 'group_nur',
      code: 'SAFAR-NUR',
      name: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      teacherAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
      description: 'حلقة نموذجية تركز على حفظ وتثبيت سورة البقرة بمنهجية الحصون الخمسة والتسميع التفاعلي المتقن.',
      membersCount: 24,
      activeStudentsCount: 21,
      commitmentRate: 87,
      activityLevel: 'مرتفع',
      targetJuz: 'الأجزاء 1 - 3',
      createdAt: '2026-01-10',
      status: 'active'
    },
    {
      id: 'group_fajr',
      code: 'SAFAR-FAJR',
      name: 'حلقة الفجر القرآنية',
      teacherId: 'teacher_fatima',
      teacherName: 'أ. فاطمة الزهراء',
      teacherAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
      description: 'حلقة صباحية مباركة لمراجعة الأجزاء العشرة الأخيرة وتصحيح مخارج الحروف وأحكام التجويد.',
      membersCount: 18,
      activeStudentsCount: 16,
      commitmentRate: 89,
      activityLevel: 'مرتفع',
      targetJuz: 'الأجزاء 21 - 30',
      createdAt: '2026-02-01',
      status: 'active'
    },
    {
      id: 'group_bayan',
      code: 'SAFAR-BAYAN',
      name: 'حلقة تيجان البيان',
      teacherId: 'teacher_maryam',
      teacherName: 'أ. مريم السالم',
      teacherAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maryam',
      description: 'حلقة مخصصة لتثبيت المفصل وضبط المتشابهات اللفظية والتدبر العملي للآيات.',
      membersCount: 15,
      activeStudentsCount: 12,
      commitmentRate: 80,
      activityLevel: 'متوسط',
      targetJuz: 'سورة الكهف إلى سورة الناس',
      createdAt: '2026-03-05',
      status: 'active'
    }
  ];

  const teachers = [
    {
      uid: 'teacher_aisha',
      name: 'أ. عائشة العتيبي',
      email: 'aisha@safar.org',
      role: 'teacher',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
      specialty: 'إجازة في القراءات العشر، مشرفة حلقات التثبيت المنهجي',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      groupId: 'group_nur',
      studentsCount: 24,
      activeThisWeek: 21,
      weeklyCommitment: 87,
      needsAttentionCount: 4,
      joinDate: '2025-11-01',
      lastActive: 'منذ 10 دقائق'
    },
    {
      uid: 'teacher_fatima',
      name: 'أ. فاطمة الزهراء',
      email: 'fatima@safar.org',
      role: 'teacher',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
      specialty: 'مدربة معتمدة في أحكام التجويد ومخارج الحروف',
      groupName: 'حلقة الفجر القرآنية',
      groupId: 'group_fajr',
      studentsCount: 18,
      activeThisWeek: 16,
      weeklyCommitment: 89,
      needsAttentionCount: 2,
      joinDate: '2025-12-15',
      lastActive: 'منذ ساعتين'
    },
    {
      uid: 'teacher_maryam',
      name: 'أ. مريم السالم',
      email: 'maryam@safar.org',
      role: 'teacher',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maryam',
      specialty: 'باحثة في إعجاز القرآن وضبط المتشابهات',
      groupName: 'حلقة تيجان البيان',
      groupId: 'group_bayan',
      studentsCount: 15,
      activeThisWeek: 12,
      weeklyCommitment: 80,
      needsAttentionCount: 3,
      joinDate: '2026-01-20',
      lastActive: 'أمس'
    }
  ];

  // 24 Students for Teacher Aisha
  const aishaStudents = [
    {
      uid: 'student_sara',
      name: 'سارة الخالدي',
      email: 'sara.k@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaraK',
      memorizedJuz: 14,
      thisWeekSessions: 4,
      consistencyRate: 96,
      lastRecitationDate: 'اليوم',
      status: 'excellent', // 'excellent' | 'needs_attention' | 'inactive'
      attentionReason: null,
      currentTarget: 'إتمام حفظ سورة آل عمران كاملة',
      currentSurah: 'آل عمران',
      currentJuz: 3,
      goalCompletionRate: 85,
      totalSessionsCount: 42,
      joinDate: '2026-01-15',
      lastActive: 'منذ 25 دقيقة',
      recitationStats: {
        sessionsCount: 42,
        averageAccuracy: 97,
        errorsCount: 1,
        repeatedMistakes: ['أواخر آيات التوحيد والصفات', 'تتابع المدود'],
        hesitationPoints: ['آل عمران آية 144'],
        improvementRate: '+15%'
      },
      revisionStats: {
        frequency: 'يومي بمعدل حزبين',
        lastRevision: 'اليوم فجراً',
        reinforcementAreas: ['أواخر سورة البقرة', 'بداية الجزء الثالث']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 1, 1, 1],
        streak: 28,
        missedDays: 0
      }
    },
    {
      uid: 'student_noura',
      name: 'نورة الشمري',
      email: 'noura.sh@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NouraSh',
      memorizedJuz: 12,
      thisWeekSessions: 3,
      consistencyRate: 92,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة آل عمران الوجه 15',
      currentSurah: 'آل عمران',
      currentJuz: 3,
      goalCompletionRate: 74,
      totalSessionsCount: 36,
      joinDate: '2026-01-16',
      lastActive: 'منذ ساعتين',
      recitationStats: {
        sessionsCount: 36,
        averageAccuracy: 95,
        errorsCount: 2,
        repeatedMistakes: ['مواضع الإدغام الناقص'],
        hesitationPoints: ['البقرة آية 282'],
        improvementRate: '+10%'
      },
      revisionStats: {
        frequency: 'يومي بمعدل جزء',
        lastRevision: 'أمس مساءً',
        reinforcementAreas: ['سورة البقرة - الربع الخامس']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 0, 1, 1, 1, 1],
        streak: 19,
        missedDays: 1
      }
    },
    {
      uid: 'student_mona',
      name: 'منى عبد العزيز',
      email: 'mona.a@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MonaA',
      memorizedJuz: 8,
      thisWeekSessions: 1,
      consistencyRate: 74,
      lastRecitationDate: 'منذ 4 أيام',
      status: 'needs_attention',
      attentionReason: 'لم تسجل أي تسميع منذ 4 أيام',
      currentTarget: 'تثبيت الربع الأول من الجزء الثاني',
      currentSurah: 'البقرة',
      currentJuz: 2,
      goalCompletionRate: 50,
      totalSessionsCount: 24,
      joinDate: '2026-01-20',
      lastActive: 'منذ 4 أيام',
      recitationStats: {
        sessionsCount: 24,
        averageAccuracy: 86,
        errorsCount: 5,
        repeatedMistakes: ['تشابه خواتيم الآيات (عزيز حكيم / عليم حكيم)', 'أحكام النون الساكنة'],
        hesitationPoints: ['البقرة آية 142', 'البقرة آية 158'],
        improvementRate: '-5%'
      },
      revisionStats: {
        frequency: 'متقطع (مرتان أسبوعياً)',
        lastRevision: 'منذ 4 أيام',
        reinforcementAreas: ['أول الجزء الثاني كاملاً']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 0, 0, 1, 1, 0],
        streak: 0,
        missedDays: 4
      }
    },
    {
      uid: 'student_reem',
      name: 'ريم الدوسري',
      email: 'reem.d@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ReemD',
      memorizedJuz: 10,
      thisWeekSessions: 0,
      consistencyRate: 65,
      lastRecitationDate: 'منذ 6 أيام',
      status: 'needs_attention',
      attentionReason: 'الورد الأسبوعي غير مكتمل',
      currentTarget: 'مراجعة الأوجه 30 إلى 40 من البقرة',
      currentSurah: 'البقرة',
      currentJuz: 2,
      goalCompletionRate: 40,
      totalSessionsCount: 20,
      joinDate: '2026-01-18',
      lastActive: 'منذ 6 أيام',
      recitationStats: {
        sessionsCount: 20,
        averageAccuracy: 84,
        errorsCount: 6,
        repeatedMistakes: ['أحكام الوقف والابتداء', 'نسيان أوائل الأرباع'],
        hesitationPoints: ['البقرة آية 197'],
        improvementRate: '-8%'
      },
      revisionStats: {
        frequency: 'أسبوعي غير منتظم',
        lastRevision: 'منذ أسبوع',
        reinforcementAreas: ['سورة البقرة الأرباع الأخيرة']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 0, 0, 0, 0, 1],
        streak: 0,
        missedDays: 6
      }
    },
    {
      uid: 'student_arwa',
      name: 'أروى القحطاني',
      email: 'arwa.q@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArwaQ',
      memorizedJuz: 6,
      thisWeekSessions: 2,
      consistencyRate: 71,
      lastRecitationDate: 'منذ يومين',
      status: 'needs_attention',
      attentionReason: 'انخفاض في دقة التلاوة وتكرار أخطاء الوقف',
      currentTarget: 'حفظ صفحة 45 من سورة البقرة',
      currentSurah: 'البقرة',
      currentJuz: 3,
      goalCompletionRate: 60,
      totalSessionsCount: 28,
      joinDate: '2026-01-22',
      lastActive: 'منذ يومين',
      recitationStats: {
        sessionsCount: 28,
        averageAccuracy: 82,
        errorsCount: 7,
        repeatedMistakes: ['تكرار أخطاء التشكيل في أواخر الكلمات', 'الخلط بين آيات الربا والإنفاق'],
        hesitationPoints: ['البقرة آية 275', 'البقرة آية 280'],
        improvementRate: '-4%'
      },
      revisionStats: {
        frequency: '3 مرات أسبوعياً',
        lastRevision: 'منذ يومين',
        reinforcementAreas: ['أواخر سورة البقرة']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 1, 0, 1, 0, 0],
        streak: 0,
        missedDays: 2
      }
    },
    {
      uid: 'student_hind',
      name: 'هند العتيبي',
      email: 'hind.o@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HindO',
      memorizedJuz: 9,
      thisWeekSessions: 1,
      consistencyRate: 68,
      lastRecitationDate: 'منذ 3 أيام',
      status: 'needs_attention',
      attentionReason: 'تباطأ معدل الإنجاز هذا الأسبوع',
      currentTarget: 'إكمال الورد الأسبوعي صفحتين',
      currentSurah: 'البقرة',
      currentJuz: 2,
      goalCompletionRate: 55,
      totalSessionsCount: 30,
      joinDate: '2026-01-19',
      lastActive: 'منذ 3 أيام',
      recitationStats: {
        sessionsCount: 30,
        averageAccuracy: 85,
        errorsCount: 4,
        repeatedMistakes: ['تبديل حروف الجر', 'التشابه مع سورة النساء'],
        hesitationPoints: ['البقرة آية 213'],
        improvementRate: '-3%'
      },
      revisionStats: {
        frequency: 'مرتان أسبوعياً',
        lastRevision: 'منذ 3 أيام',
        reinforcementAreas: ['الجزء الثاني']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 0, 1, 1, 0, 0],
        streak: 0,
        missedDays: 3
      }
    },
    {
      uid: 'student_khadija',
      name: 'خديجة العمري',
      email: 'khadija.o@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KhadijaO',
      memorizedJuz: 20,
      thisWeekSessions: 4,
      consistencyRate: 98,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'مراجعة الجزء العشرين وتثبيت سورة النمل',
      currentSurah: 'النمل',
      currentJuz: 20,
      goalCompletionRate: 94,
      totalSessionsCount: 65,
      joinDate: '2026-01-10',
      lastActive: 'منذ ساعة',
      recitationStats: {
        sessionsCount: 65,
        averageAccuracy: 98,
        errorsCount: 0,
        repeatedMistakes: [],
        hesitationPoints: [],
        improvementRate: '+18%'
      },
      revisionStats: {
        frequency: 'يومي 3 أجزاء',
        lastRevision: 'اليوم بعد الظهر',
        reinforcementAreas: ['الأجزاء 18-20']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 1, 1, 1],
        streak: 35,
        missedDays: 0
      }
    },
    {
      uid: 'student_zainab',
      name: 'زينب السديري',
      email: 'zainab.s@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ZainabS',
      memorizedJuz: 16,
      thisWeekSessions: 3,
      consistencyRate: 94,
      lastRecitationDate: 'أمس',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة الإسراء',
      currentSurah: 'الإسراء',
      currentJuz: 15,
      goalCompletionRate: 88,
      totalSessionsCount: 52,
      joinDate: '2026-01-12',
      lastActive: 'أمس',
      recitationStats: {
        sessionsCount: 52,
        averageAccuracy: 96,
        errorsCount: 1,
        repeatedMistakes: ['مواضع التشابه في التسبيح'],
        hesitationPoints: ['الإسراء آية 70'],
        improvementRate: '+12%'
      },
      revisionStats: {
        frequency: 'يومي جزءان',
        lastRevision: 'أمس',
        reinforcementAreas: ['الكهف ومريم']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 0, 1, 1],
        streak: 22,
        missedDays: 1
      }
    },
    {
      uid: 'student_somaya',
      name: 'سمية المطيري',
      email: 'somaya.m@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SomayaM',
      memorizedJuz: 5,
      thisWeekSessions: 0,
      consistencyRate: 35,
      lastRecitationDate: 'منذ أسبوعين',
      status: 'inactive',
      attentionReason: 'غير نشطة لأكثر من 10 أيام',
      currentTarget: 'تثبيت سورة الفاتحة وأول البقرة',
      currentSurah: 'البقرة',
      currentJuz: 1,
      goalCompletionRate: 25,
      totalSessionsCount: 14,
      joinDate: '2026-01-25',
      lastActive: 'منذ 14 يوماً',
      recitationStats: {
        sessionsCount: 14,
        averageAccuracy: 78,
        errorsCount: 8,
        repeatedMistakes: ['تفلت الحفظ في الأوجه الأولى'],
        hesitationPoints: ['البقرة آية 20'],
        improvementRate: '-15%'
      },
      revisionStats: {
        frequency: 'متوقف مؤقتاً',
        lastRevision: 'منذ أسبوعين',
        reinforcementAreas: ['الجزء الأول كاملاً']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 0, 0, 0, 0, 0],
        streak: 0,
        missedDays: 14
      }
    },
    {
      uid: 'student_hafsa',
      name: 'حفصة الغامدي',
      email: 'hafsa.g@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HafsaG',
      memorizedJuz: 11,
      thisWeekSessions: 3,
      consistencyRate: 91,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة التوبة',
      currentSurah: 'التوبة',
      currentJuz: 10,
      goalCompletionRate: 80,
      totalSessionsCount: 38,
      joinDate: '2026-01-14',
      lastActive: 'منذ 3 ساعات',
      recitationStats: {
        sessionsCount: 38,
        averageAccuracy: 94,
        errorsCount: 2,
        repeatedMistakes: ['أحكام الراء المرققة'],
        hesitationPoints: ['التوبة آية 36'],
        improvementRate: '+11%'
      },
      revisionStats: {
        frequency: 'يومي جزء',
        lastRevision: 'اليوم صباحاً',
        reinforcementAreas: ['الأنفال والتوبة']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 0, 1, 1, 1],
        streak: 15,
        missedDays: 1
      }
    },
    {
      uid: 'student_dana',
      name: 'دانة الحربي',
      email: 'dana.h@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DanaH',
      memorizedJuz: 7,
      thisWeekSessions: 3,
      consistencyRate: 88,
      lastRecitationDate: 'أمس',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'إتقان سورة المائدة',
      currentSurah: 'المائدة',
      currentJuz: 6,
      goalCompletionRate: 72,
      totalSessionsCount: 31,
      joinDate: '2026-01-18',
      lastActive: 'أمس',
      recitationStats: {
        sessionsCount: 31,
        averageAccuracy: 93,
        errorsCount: 2,
        repeatedMistakes: ['أحكام القلقلة الصغرى'],
        hesitationPoints: ['المائدة آية 51'],
        improvementRate: '+9%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'أمس',
        reinforcementAreas: ['النساء والمائدة']
      },
      consistencyLogs: {
        dailyActivity: [1, 0, 1, 1, 1, 1, 0],
        streak: 14,
        missedDays: 1
      }
    },
    {
      uid: 'student_leena',
      name: 'لينة الأنصاري',
      email: 'leena.a@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeenaA',
      memorizedJuz: 15,
      thisWeekSessions: 4,
      consistencyRate: 95,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة النور والفرقان',
      currentSurah: 'النور',
      currentJuz: 18,
      goalCompletionRate: 91,
      totalSessionsCount: 47,
      joinDate: '2026-01-11',
      lastActive: 'منذ نصف ساعة',
      recitationStats: {
        sessionsCount: 47,
        averageAccuracy: 97,
        errorsCount: 1,
        repeatedMistakes: ['مواضع الإظهار الحلقي'],
        hesitationPoints: ['النور آية 35'],
        improvementRate: '+16%'
      },
      revisionStats: {
        frequency: 'يومي حزبين',
        lastRevision: 'اليوم',
        reinforcementAreas: ['سورة المؤمنون والنور']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 1, 1, 1],
        streak: 26,
        missedDays: 0
      }
    },
    {
      uid: 'student_salma',
      name: 'سلمى باوزير',
      email: 'salma.b@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SalmaB',
      memorizedJuz: 10,
      thisWeekSessions: 3,
      consistencyRate: 90,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'تثبيت سورة يونس',
      currentSurah: 'يونس',
      currentJuz: 11,
      goalCompletionRate: 77,
      totalSessionsCount: 35,
      joinDate: '2026-01-16',
      lastActive: 'منذ ساعتين',
      recitationStats: {
        sessionsCount: 35,
        averageAccuracy: 95,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['يونس آية 22'],
        improvementRate: '+14%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'أمس',
        reinforcementAreas: ['الأعراف ويونس']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 0, 1, 1, 1, 1],
        streak: 18,
        missedDays: 1
      }
    },
    {
      uid: 'student_mariam_k',
      name: 'مريم الكعبي',
      email: 'mariam.k@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariamK',
      memorizedJuz: 13,
      thisWeekSessions: 3,
      consistencyRate: 93,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة الرعد وإبراهيم',
      currentSurah: 'الرعد',
      currentJuz: 13,
      goalCompletionRate: 83,
      totalSessionsCount: 41,
      joinDate: '2026-01-13',
      lastActive: 'منذ 4 ساعات',
      recitationStats: {
        sessionsCount: 41,
        averageAccuracy: 96,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['الرعد آية 11'],
        improvementRate: '+13%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'اليوم',
        reinforcementAreas: ['يوسف والرعد']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 0, 1, 1],
        streak: 21,
        missedDays: 1
      }
    },
    {
      uid: 'student_fatima_m',
      name: 'فاطمة المهيدب',
      email: 'fatima.m@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FatimaM',
      memorizedJuz: 18,
      thisWeekSessions: 4,
      consistencyRate: 97,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'مراجعة الربع الأخير من سورة القصص',
      currentSurah: 'القصص',
      currentJuz: 20,
      goalCompletionRate: 92,
      totalSessionsCount: 58,
      joinDate: '2026-01-10',
      lastActive: 'منذ ساعة',
      recitationStats: {
        sessionsCount: 58,
        averageAccuracy: 98,
        errorsCount: 0,
        repeatedMistakes: [],
        hesitationPoints: [],
        improvementRate: '+17%'
      },
      revisionStats: {
        frequency: 'يومي حزبين',
        lastRevision: 'اليوم صباحاً',
        reinforcementAreas: ['النمل والقصص']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 1, 1, 1],
        streak: 30,
        missedDays: 0
      }
    },
    {
      uid: 'student_asma',
      name: 'أسماء البلوشي',
      email: 'asma.b@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AsmaB',
      memorizedJuz: 9,
      thisWeekSessions: 3,
      consistencyRate: 89,
      lastRecitationDate: 'أمس',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة الأعراف الأوجه الأخيرة',
      currentSurah: 'الأعراف',
      currentJuz: 9,
      goalCompletionRate: 75,
      totalSessionsCount: 33,
      joinDate: '2026-01-17',
      lastActive: 'أمس',
      recitationStats: {
        sessionsCount: 33,
        averageAccuracy: 94,
        errorsCount: 2,
        repeatedMistakes: ['مواضع همزة الوصل والقطع'],
        hesitationPoints: ['الأعراف آية 175'],
        improvementRate: '+11%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'أمس',
        reinforcementAreas: ['الأنعام والأعراف']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 0, 1, 1, 1, 1],
        streak: 16,
        missedDays: 1
      }
    },
    {
      uid: 'student_rahaf',
      name: 'رهف الزهراني',
      email: 'rahaf.z@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahafZ',
      memorizedJuz: 11,
      thisWeekSessions: 3,
      consistencyRate: 91,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة الأنبياء',
      currentSurah: 'الأنبياء',
      currentJuz: 17,
      goalCompletionRate: 81,
      totalSessionsCount: 37,
      joinDate: '2026-01-15',
      lastActive: 'منذ ساعتين',
      recitationStats: {
        sessionsCount: 37,
        averageAccuracy: 95,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['الأنبياء آية 87'],
        improvementRate: '+12%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'اليوم',
        reinforcementAreas: ['الإسراء والكهف']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 0, 1, 1, 1],
        streak: 17,
        missedDays: 1
      }
    },
    {
      uid: 'student_joud',
      name: 'جود العسيري',
      email: 'joud.a@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JoudA',
      memorizedJuz: 8,
      thisWeekSessions: 2,
      consistencyRate: 86,
      lastRecitationDate: 'أمس',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'تثبيت سورة الأنعام',
      currentSurah: 'الأنعام',
      currentJuz: 7,
      goalCompletionRate: 70,
      totalSessionsCount: 29,
      joinDate: '2026-01-21',
      lastActive: 'أمس',
      recitationStats: {
        sessionsCount: 29,
        averageAccuracy: 92,
        errorsCount: 2,
        repeatedMistakes: ['أحكام التفخيم والترقيق'],
        hesitationPoints: ['الأنعام آية 95'],
        improvementRate: '+8%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'أمس',
        reinforcementAreas: ['المائدة والأنعام']
      },
      consistencyLogs: {
        dailyActivity: [1, 0, 1, 1, 1, 0, 1],
        streak: 11,
        missedDays: 2
      }
    },
    {
      uid: 'student_ghada',
      name: 'غادة الصالح',
      email: 'ghada.s@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GhadaS',
      memorizedJuz: 13,
      thisWeekSessions: 3,
      consistencyRate: 92,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة الحجر والنحل',
      currentSurah: 'النحل',
      currentJuz: 14,
      goalCompletionRate: 84,
      totalSessionsCount: 43,
      joinDate: '2026-01-12',
      lastActive: 'منذ 3 ساعات',
      recitationStats: {
        sessionsCount: 43,
        averageAccuracy: 96,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['النحل آية 90'],
        improvementRate: '+14%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'اليوم',
        reinforcementAreas: ['إبراهيم والحجر']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 1, 0, 1, 1],
        streak: 20,
        missedDays: 1
      }
    },
    {
      uid: 'student_shurooq',
      name: 'شروق التميمي',
      email: 'shurooq.t@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShurooqT',
      memorizedJuz: 10,
      thisWeekSessions: 3,
      consistencyRate: 89,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة هود',
      currentSurah: 'هود',
      currentJuz: 12,
      goalCompletionRate: 76,
      totalSessionsCount: 34,
      joinDate: '2026-01-16',
      lastActive: 'منذ 4 ساعات',
      recitationStats: {
        sessionsCount: 34,
        averageAccuracy: 94,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['هود آية 41'],
        improvementRate: '+10%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'أمس',
        reinforcementAreas: ['يونس وهود']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 0, 1, 1, 1, 1],
        streak: 16,
        missedDays: 1
      }
    },
    {
      uid: 'student_raghad',
      name: 'رغد الرويلي',
      email: 'raghad.r@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RaghadR',
      memorizedJuz: 12,
      thisWeekSessions: 3,
      consistencyRate: 91,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة طه',
      currentSurah: 'طه',
      currentJuz: 16,
      goalCompletionRate: 82,
      totalSessionsCount: 39,
      joinDate: '2026-01-14',
      lastActive: 'منذ ساعتين',
      recitationStats: {
        sessionsCount: 39,
        averageAccuracy: 95,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['طه آية 14'],
        improvementRate: '+12%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'اليوم',
        reinforcementAreas: ['مريم وطه']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 0, 1, 1, 1],
        streak: 18,
        missedDays: 1
      }
    },
    {
      uid: 'student_amira',
      name: 'أميرة الشريف',
      email: 'amira.sh@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmiraSh',
      memorizedJuz: 6,
      thisWeekSessions: 0,
      consistencyRate: 45,
      lastRecitationDate: 'منذ 9 أيام',
      status: 'inactive',
      attentionReason: 'انقطاع عن التسميع لأكثر من أسبوع',
      currentTarget: 'مراجعة سورة النساء',
      currentSurah: 'النساء',
      currentJuz: 5,
      goalCompletionRate: 35,
      totalSessionsCount: 18,
      joinDate: '2026-01-23',
      lastActive: 'منذ 9 أيام',
      recitationStats: {
        sessionsCount: 18,
        averageAccuracy: 80,
        errorsCount: 6,
        repeatedMistakes: ['تشابه بدايات الآيات'],
        hesitationPoints: ['النساء آية 34'],
        improvementRate: '-10%'
      },
      revisionStats: {
        frequency: 'غير منتظم',
        lastRevision: 'منذ 9 أيام',
        reinforcementAreas: ['النساء']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 0, 0, 0, 0, 1],
        streak: 0,
        missedDays: 9
      }
    },
    {
      uid: 'student_nouf',
      name: 'نوف القاسمي',
      email: 'nouf.q@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NoufQ',
      memorizedJuz: 4,
      thisWeekSessions: 0,
      consistencyRate: 40,
      lastRecitationDate: 'منذ 11 يوماً',
      status: 'inactive',
      attentionReason: 'انقطاع عن التسميع',
      currentTarget: 'حفظ سورة آل عمران',
      currentSurah: 'آل عمران',
      currentJuz: 3,
      goalCompletionRate: 30,
      totalSessionsCount: 15,
      joinDate: '2026-01-26',
      lastActive: 'منذ 11 يوماً',
      recitationStats: {
        sessionsCount: 15,
        averageAccuracy: 79,
        errorsCount: 7,
        repeatedMistakes: ['أحكام الميم الساكنة'],
        hesitationPoints: ['آل عمران آية 18'],
        improvementRate: '-12%'
      },
      revisionStats: {
        frequency: 'متوقف',
        lastRevision: 'منذ 11 يوماً',
        reinforcementAreas: ['آل عمران']
      },
      consistencyLogs: {
        dailyActivity: [0, 0, 0, 0, 0, 0, 0],
        streak: 0,
        missedDays: 11
      }
    },
    {
      uid: 'student_manar',
      name: 'منار الحربي',
      email: 'manar.h@gmail.com',
      role: 'student',
      isSafarMember: true,
      groupId: 'group_nur',
      groupName: 'حلقة النور والهدى (إتقان سورة البقرة)',
      teacherId: 'teacher_aisha',
      teacherName: 'أ. عائشة العتيبي',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ManarH',
      memorizedJuz: 14,
      thisWeekSessions: 3,
      consistencyRate: 93,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: 'حفظ سورة الحج',
      currentSurah: 'الحج',
      currentJuz: 17,
      goalCompletionRate: 86,
      totalSessionsCount: 44,
      joinDate: '2026-01-13',
      lastActive: 'منذ ساعتين',
      recitationStats: {
        sessionsCount: 44,
        averageAccuracy: 96,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: ['الحج آية 1'],
        improvementRate: '+15%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'اليوم',
        reinforcementAreas: ['الأنبياء والحج']
      },
      consistencyLogs: {
        dailyActivity: [1, 1, 1, 0, 1, 1, 1],
        streak: 20,
        missedDays: 1
      }
    }
  ];

  // Independent Users (حفاظ مستقلون دون حلقة)
  const independentUsers = [
    {
      uid: 'demo_user_123',
      name: 'أحمد محمد',
      email: 'demo@ma7fath.ai',
      role: 'user',
      isSafarMember: false,
      groupId: null,
      groupName: null,
      groupCode: null,
      teacherId: null,
      teacherName: null,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
      memorizedJuz: 2.5,
      memorizedPagesCount: 49,
      thisWeekSessions: 2,
      consistencyRate: 84,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      joinDate: '2026-01-01',
      lastActive: 'منذ دقائق'
    },
    {
      uid: 'indep_tariq',
      name: 'طارق العلي',
      email: 'tariq.ali@gmail.com',
      role: 'user',
      isSafarMember: false,
      groupId: null,
      groupName: null,
      groupCode: null,
      teacherId: null,
      teacherName: null,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tariq',
      memorizedJuz: 5,
      memorizedPagesCount: 100,
      thisWeekSessions: 3,
      consistencyRate: 88,
      lastRecitationDate: 'أمس',
      status: 'excellent',
      joinDate: '2026-02-10',
      lastActive: 'أمس'
    },
    {
      uid: 'indep_layla',
      name: 'ليلى الكردي',
      email: 'layla.k@gmail.com',
      role: 'user',
      isSafarMember: false,
      groupId: null,
      groupName: null,
      groupCode: null,
      teacherId: null,
      teacherName: null,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Layla',
      memorizedJuz: 10,
      memorizedPagesCount: 200,
      thisWeekSessions: 4,
      consistencyRate: 94,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      joinDate: '2026-01-20',
      lastActive: 'منذ ساعة'
    }
  ];

  return {
    groups,
    teachers,
    students: aishaStudents,
    independentUsers
  };
}

// Load or seed
function loadEcosystem() {
  try {
    if (fs.existsSync(ECOSYSTEM_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(ECOSYSTEM_PATH, 'utf8'));
      if (Array.isArray(parsed.groups)) ecosystemState.groups = parsed.groups;
      if (Array.isArray(parsed.teachers)) ecosystemState.teachers = parsed.teachers;
      if (Array.isArray(parsed.students)) ecosystemState.students = parsed.students;
      if (Array.isArray(parsed.independentUsers)) ecosystemState.independentUsers = parsed.independentUsers;
      if (Array.isArray(parsed.enrollmentRequests)) ecosystemState.enrollmentRequests = parsed.enrollmentRequests;
      else if (!ecosystemState.enrollmentRequests) {
        ecosystemState.enrollmentRequests = [
          {
            id: 'req_1',
            name: 'ريم الحربي',
            email: 'reem.h@gmail.com',
            phone: '+966 50 123 4567',
            memorizedJuz: 5,
            dailyGoal: 'صفحة واحدة يومياً',
            preferredTime: 'الفترة المسائية (بعد العصر)',
            preferredLevel: 'متوسط',
            notes: 'أرغب بالانضمام لمجموعة تركز على تثبيت الحفظ القديم مع أ. عائشة أو أي معلمة متاحة.',
            requestDate: '2026-03-12',
            status: 'pending'
          },
          {
            id: 'req_2',
            name: 'أسماء القحطاني',
            email: 'asmaa.q@outlook.com',
            phone: '+966 55 987 6543',
            memorizedJuz: 2,
            dailyGoal: 'نصف صفحة يومياً',
            preferredTime: 'الفترة الصباحية',
            preferredLevel: 'مبتدئ',
            notes: 'حفظت جزء عم وتبارك وأود البدء في سورة البقرة بتدرج منظم.',
            requestDate: '2026-03-13',
            status: 'pending'
          },
          {
            id: 'req_3',
            name: 'مريم فؤاد الشامي',
            email: 'maryam.f@gmail.com',
            phone: '+966 54 333 2211',
            memorizedJuz: 12,
            dailyGoal: 'صفحتان يومياً',
            preferredTime: 'فجر أو مساء',
            preferredLevel: 'متقدم',
            notes: 'لدي نية إتمام المصحف كاملاً خلال عام 2026 بحول الله، أحتاج متابعة تسميع دقيقة.',
            requestDate: '2026-03-14',
            status: 'pending'
          }
        ];
      }
    } else {
      const initial = getInitialData();
      ecosystemState = initial;
      saveEcosystem();
    }
  } catch (e) {
    console.error('Error loading safar_data.json:', e);
    const initial = getInitialData();
    ecosystemState = initial;
  }
}

function saveEcosystem() {
  try {
    fs.writeFileSync(ECOSYSTEM_PATH, JSON.stringify(ecosystemState, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving safar_data.json:', e);
  }
}

loadEcosystem();

// --- EXPORTED ECOSYSTEM API HANDLERS ---

export function getGroups(teacherId = null) {
  loadEcosystem();
  if (teacherId) {
    return ecosystemState.groups.filter(g => g.teacherId === teacherId);
  }
  return ecosystemState.groups;
}

export function lookupGroupByCode(rawCode) {
  loadEcosystem();
  if (!rawCode) return null;
  const cleanCode = rawCode.trim().toUpperCase();
  const group = ecosystemState.groups.find(g => g.code.toUpperCase() === cleanCode);
  if (!group) return null;
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    teacherId: group.teacherId,
    teacherName: group.teacherName,
    teacherAvatar: group.teacherAvatar,
    description: group.description,
    membersCount: group.membersCount,
    targetJuz: group.targetJuz
  };
}

export function joinGroupByCode(userId, userEmail, userName, rawCode) {
  loadEcosystem();
  const cleanCode = (rawCode || '').trim().toUpperCase();
  const group = ecosystemState.groups.find(g => g.code.toUpperCase() === cleanCode);
  if (!group) {
    return { success: false, message: 'رمز الحلقة غير صحيح أو لم يعد متاحاً' };
  }

  // Check if user already in group
  let existingStudent = ecosystemState.students.find(s => s.uid === userId || s.email === userEmail);
  if (existingStudent) {
    existingStudent.groupId = group.id;
    existingStudent.groupName = group.name;
    existingStudent.teacherId = group.teacherId;
    existingStudent.teacherName = group.teacherName;
    existingStudent.isSafarMember = true;
  } else {
    // Add new student
    const newStudent = {
      uid: userId || 'student_' + Date.now(),
      name: userName || 'حافظ جديد',
      email: userEmail || 'user@safar.org',
      role: 'student', // ALWAYS student/member, never teacher/admin!
      isSafarMember: true,
      groupId: group.id,
      groupName: group.name,
      teacherId: group.teacherId,
      teacherName: group.teacherName,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName || 'Student')}`,
      memorizedJuz: 1,
      thisWeekSessions: 1,
      consistencyRate: 85,
      lastRecitationDate: 'اليوم',
      status: 'excellent',
      attentionReason: null,
      currentTarget: `الالتزام بورد ${group.name}`,
      currentSurah: 'البقرة',
      currentJuz: 1,
      goalCompletionRate: 20,
      totalSessionsCount: 1,
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: 'الآن',
      recitationStats: {
        sessionsCount: 1,
        averageAccuracy: 95,
        errorsCount: 1,
        repeatedMistakes: [],
        hesitationPoints: [],
        improvementRate: '+5%'
      },
      revisionStats: {
        frequency: 'يومي',
        lastRevision: 'اليوم',
        reinforcementAreas: ['الجزء الأول']
      },
      consistencyLogs: {
        dailyActivity: [1, 0, 0, 0, 0, 0, 0],
        streak: 1,
        missedDays: 0
      }
    };
    ecosystemState.students.push(newStudent);
    group.membersCount = (group.membersCount || 0) + 1;
  }

  // Remove from independent users list if present
  ecosystemState.independentUsers = ecosystemState.independentUsers.filter(u => u.uid !== userId && u.email !== userEmail);

  saveEcosystem();

  return {
    success: true,
    message: `مرحباً بك! تم انضمامك بنجاح إلى "${group.name}" 🌿`,
    group: {
      id: group.id,
      name: group.name,
      teacherName: group.teacherName,
      teacherAvatar: group.teacherAvatar,
      membersCount: group.membersCount
    }
  };
}

export function leaveGroup(userId) {
  loadEcosystem();
  const student = ecosystemState.students.find(s => s.uid === userId);
  if (student) {
    student.isSafarMember = false;
    student.groupId = null;
    student.groupName = null;
    student.teacherId = null;
    student.teacherName = null;

    // Add to independent users
    if (!ecosystemState.independentUsers.some(u => u.uid === userId)) {
      ecosystemState.independentUsers.push({
        ...student,
        role: 'user',
        isSafarMember: false
      });
    }

    saveEcosystem();
    return { success: true, message: 'تمت مغادرة الحلقة بنجاح والتحول لحافظ مستقل' };
  }
  return { success: false, message: 'المستخدم ليس في حلقة حالياً' };
}

// Teacher Dashboard
export function getTeacherDashboard(teacherId = 'teacher_aisha') {
  loadEcosystem();
  const teacher = ecosystemState.teachers.find(t => t.uid === teacherId) || ecosystemState.teachers[0];
  const students = ecosystemState.students.filter(s => s.teacherId === teacher.uid);

  const totalStudents = students.length;
  const activeThisWeek = students.filter(s => s.thisWeekSessions > 0).length;
  const needsAttentionList = students.filter(s => s.status === 'needs_attention' || s.thisWeekSessions === 0 && s.status !== 'inactive');
  
  // Real calculations
  const totalConsistency = students.reduce((acc, s) => acc + (s.consistencyRate || 0), 0);
  const weeklyCommitment = totalStudents > 0 ? Math.round(totalConsistency / totalStudents) : 87;

  // Real Smart Insights ("This Week" / هذا الأسبوع)
  const completedTargetCount = students.filter(s => s.thisWeekSessions >= 3).length;
  const noRecitationLast3DaysCount = students.filter(s => s.lastRecitationDate.includes('3 أيام') || s.lastRecitationDate.includes('4 أيام') || s.lastRecitationDate.includes('أسبوع')).length;
  const decreasedConsistencyCount = students.filter(s => s.consistencyRate < 75 && s.status === 'needs_attention').length;
  const improvedRateCount = students.filter(s => s.recitationStats?.improvementRate?.startsWith('+1') || s.recitationStats?.improvementRate?.startsWith('+2')).length;

  const smartInsights = [
    {
      id: 'target_completed',
      type: 'success',
      text: `${completedTargetCount} من أصل ${totalStudents} طالبة أكملن وردهن الأسبوعي بنجاح.`,
      filterTag: 'excellent'
    },
    {
      id: 'no_recitation_3_days',
      type: 'warning',
      text: `${noRecitationLast3DaysCount} طالبات لم يقدمن أي تسميع خلال الـ 3 أيام الماضية.`,
      filterTag: 'needs_attention'
    },
    {
      id: 'decreased_consistency',
      type: 'alert',
      text: `${decreasedConsistencyCount} طالبات شهدن تراجعاً في نسبة الالتزام هذا الأسبوع.`,
      filterTag: 'needs_attention'
    },
    {
      id: 'improved_rate',
      type: 'highlight',
      text: `${improvedRateCount} طالبات رفعن معدل الحفظ والإتقان هذا الأسبوع بنسبة تفوق 10%.`,
      filterTag: 'excellent'
    }
  ];

  // Recent Student Activity Feed
  const recentActivities = [
    { id: 1, studentName: 'سارة الخالدي', type: 'memorization', action: 'أتمت حفظ الوجه 15 من سورة آل عمران', time: 'منذ 25 دقيقة', icon: 'check' },
    { id: 2, studentName: 'خديجة العمري', type: 'recitation', action: 'أكملت تسميع الجزء العشرين بنسبة دقة 98%', time: 'منذ ساعة', icon: 'mic' },
    { id: 3, studentName: 'لينة الأنصاري', type: 'goal', action: 'حققت هدفها الأسبوعي بتسميع 4 أوجه متتالية', time: 'منذ ساعتين', icon: 'trophy' },
    { id: 4, studentName: 'نورة الشمري', type: 'revision', action: 'أنجزت الحصن البعيد بمراجعة سورة البقرة في قيام الليل', time: 'اليوم فجراً', icon: 'shield' },
    { id: 5, studentName: 'شروق التميمي', type: 'recitation', action: 'سجلت جلسة تسميع صوتية بنسبة دقة 94%', time: 'منذ 4 ساعات', icon: 'mic' }
  ];

  return {
    teacher: {
      uid: teacher.uid,
      name: teacher.name,
      email: teacher.email,
      photoURL: teacher.photoURL,
      groupName: teacher.groupName
    },
    stats: {
      studentsCount: totalStudents,
      activeThisWeek,
      weeklyCommitment,
      needsAttentionCount: needsAttentionList.length
    },
    studentsWhoNeedAttention: needsAttentionList.map(s => ({
      uid: s.uid,
      name: s.name,
      photoURL: s.photoURL,
      memorizedJuz: s.memorizedJuz,
      attentionReason: s.attentionReason || 'يحتاج لمتابعة التسميع الأسبوعي',
      lastRecitationDate: s.lastRecitationDate,
      consistencyRate: s.consistencyRate,
      status: s.status
    })),
    smartInsights,
    recentActivities
  };
}

// Get Students for Teacher with Search, Filter & Sort
export function getTeacherStudents(teacherId = 'teacher_aisha', query = '', filter = 'all', sort = 'name') {
  loadEcosystem();
  let students = ecosystemState.students.filter(s => s.teacherId === teacherId || !teacherId);

  // Search by name or email
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    students = students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.email && s.email.toLowerCase().includes(q))
    );
  }

  // Filter: 'all', 'excellent', 'needs_attention', 'inactive'
  if (filter && filter !== 'all') {
    students = students.filter(s => s.status === filter);
  }

  // Sort: 'name', 'consistency', 'last_recitation', 'memorization'
  students = [...students].sort((a, b) => {
    if (sort === 'consistency') {
      return (b.consistencyRate || 0) - (a.consistencyRate || 0);
    }
    if (sort === 'memorization') {
      return (b.memorizedJuz || 0) - (a.memorizedJuz || 0);
    }
    if (sort === 'last_recitation') {
      if (a.lastRecitationDate === 'اليوم') return -1;
      if (b.lastRecitationDate === 'اليوم') return 1;
      return 0;
    }
    return a.name.localeCompare(b.name, 'ar');
  });

  return students;
}

// Get single student profile
export function getStudentProfile(studentId) {
  loadEcosystem();
  const student = ecosystemState.students.find(s => s.uid === studentId) ||
                  ecosystemState.independentUsers.find(u => u.uid === studentId);
  return student || null;
}

// Admin Overview Statistics
export function getAdminOverview() {
  loadEcosystem();

  const totalRegisteredInDb = ecosystemState.students.length + ecosystemState.teachers.length + ecosystemState.independentUsers.length;
  
  // High-level Platform metrics
  const totalUsers = 12842 + totalRegisteredInDb;
  const safarMembers = 4281 + ecosystemState.students.length;
  const teachersCount = 186 + ecosystemState.teachers.length;
  const independentUsersCount = 8561 + ecosystemState.independentUsers.length;
  const groupsCount = 142 + ecosystemState.groups.length;

  const activityStats = {
    activeToday: 1420,
    activeThisWeek: 6890,
    newRegistrationsWeek: 342,
    newSafarMembersWeek: 118,
    newGroupJoinsWeek: 94,
    activeTeachers: 174,
    activeGroups: 138,
    averageStudentActivityRate: 88.4,
    overallMemorizationRate: 92.1,
    recitationSessionsToday: 3240
  };

  const platformAnalytics = {
    totalUsers,
    safarMembers,
    teachers: teachersCount,
    independentUsers: independentUsersCount,
    groups: groupsCount,
    userGrowthData: [
      { month: 'أكتوبر', users: 8400, members: 2100 },
      { month: 'نوفمبر', users: 9500, members: 2700 },
      { month: 'ديسمبر', users: 10600, members: 3300 },
      { month: 'يناير', users: 11400, members: 3800 },
      { month: 'فبراير', users: 12100, members: 4100 },
      { month: 'مارس', users: totalUsers, members: safarMembers }
    ],
    recitationEngagementData: [
      { day: 'السبت', sessions: 2800 },
      { day: 'الأحد', sessions: 3100 },
      { day: 'الإثنين', sessions: 3350 },
      { day: 'الثلاثاء', sessions: 3420 },
      { day: 'الأربعاء', sessions: 3600 },
      { day: 'الخميس', sessions: 3800 },
      { day: 'الجمعة', sessions: 4100 }
    ]
  };

  return {
    overview: {
      totalUsers,
      safarMembers,
      teachers: teachersCount,
      independentUsers: independentUsersCount,
      groups: groupsCount
    },
    activity: activityStats,
    analytics: platformAnalytics
  };
}

// Admin Users List with full search and filtering
export function getAdminUsersList(search = '', filter = 'all') {
  loadEcosystem();

  let allUsers = [
    // Teachers
    ...ecosystemState.teachers.map(t => ({
      uid: t.uid,
      name: t.name,
      email: t.email,
      role: 'teacher',
      isSafarMember: true,
      groupName: t.groupName,
      teacherName: 'مشرف/معلم مستقل',
      photoURL: t.photoURL,
      joinDate: t.joinDate || '2025-11-01',
      lastActive: t.lastActive || 'منذ ساعة',
      status: 'active'
    })),
    // Safar Students
    ...ecosystemState.students.map(s => ({
      uid: s.uid,
      name: s.name,
      email: s.email,
      role: 'student',
      isSafarMember: true,
      groupName: s.groupName,
      teacherName: s.teacherName,
      photoURL: s.photoURL,
      joinDate: s.joinDate,
      lastActive: s.lastActive,
      status: s.status === 'inactive' ? 'inactive' : 'active'
    })),
    // Independent Users
    ...ecosystemState.independentUsers.map(u => ({
      uid: u.uid,
      name: u.name,
      email: u.email,
      role: 'user',
      isSafarMember: false,
      groupName: 'غير منضم لحلقة (مستقل)',
      teacherName: 'لا يوجد',
      photoURL: u.photoURL,
      joinDate: u.joinDate,
      lastActive: u.lastActive,
      status: 'active'
    }))
  ];

  // Search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      (u.email && u.email.toLowerCase().includes(q))
    );
  }

  // Filter: 'all', 'safar_member', 'teacher', 'independent', 'active', 'inactive'
  if (filter && filter !== 'all') {
    if (filter === 'safar_member') {
      allUsers = allUsers.filter(u => u.isSafarMember && u.role !== 'teacher');
    } else if (filter === 'teacher') {
      allUsers = allUsers.filter(u => u.role === 'teacher');
    } else if (filter === 'independent') {
      allUsers = allUsers.filter(u => !u.isSafarMember);
    } else if (filter === 'active') {
      allUsers = allUsers.filter(u => u.status === 'active');
    } else if (filter === 'inactive') {
      allUsers = allUsers.filter(u => u.status === 'inactive');
    }
  }

  return allUsers;
}

// Assign Teacher Role (Admin only)
export function assignTeacherRole(uid) {
  loadEcosystem();
  // Find in students or independent
  const studentIndex = ecosystemState.students.findIndex(s => s.uid === uid);
  const indepIndex = ecosystemState.independentUsers.findIndex(u => u.uid === uid);

  let targetUser = null;
  if (studentIndex >= 0) {
    targetUser = ecosystemState.students.splice(studentIndex, 1)[0];
  } else if (indepIndex >= 0) {
    targetUser = ecosystemState.independentUsers.splice(indepIndex, 1)[0];
  }

  if (!targetUser) {
    // Check if already teacher
    const existing = ecosystemState.teachers.find(t => t.uid === uid);
    if (existing) return { success: true, message: 'المستخدم معلم بالفعل' };
    return { success: false, message: 'المستخدم غير موجود' };
  }

  const newTeacher = {
    uid: targetUser.uid,
    name: targetUser.name,
    email: targetUser.email,
    role: 'teacher',
    photoURL: targetUser.photoURL,
    specialty: 'معلمة مجازة تم تعيينها حديثاً',
    groupName: 'لم يتم تعيين حلقة بعد',
    groupId: null,
    studentsCount: 0,
    activeThisWeek: 0,
    weeklyCommitment: 100,
    needsAttentionCount: 0,
    joinDate: new Date().toISOString().split('T')[0],
    lastActive: 'الآن'
  };

  ecosystemState.teachers.push(newTeacher);
  saveEcosystem();

  return { success: true, message: `تم ترقية "${newTeacher.name}" إلى معلم/معلمة بنجاح 🌷`, teacher: newTeacher };
}

// Create or Add New Teacher Directly (Admin or Quick Registration)
export function createNewTeacherDirect({ name, email, specialty = 'معلمة مجازة' }) {
  loadEcosystem();
  if (!name || !name.trim()) return { success: false, message: 'اسم المعلمة مطلوب' };
  const cleanEmail = (email || `teacher_${Date.now()}@safar.org`).trim().toLowerCase();

  // Check if exists
  const existingTeacher = ecosystemState.teachers.find(t => t.email === cleanEmail);
  if (existingTeacher) {
    return { success: true, message: `المعلمة "${existingTeacher.name}" مسجلة بالفعل في النظام`, teacher: existingTeacher };
  }

  const newTeacher = {
    uid: 'teacher_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    role: 'teacher',
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
    specialty: specialty || 'معلمة ومحفظة معتمدة',
    groupName: 'حلقة جديدة',
    groupId: null,
    studentsCount: 0,
    activeThisWeek: 0,
    weeklyCommitment: 100,
    needsAttentionCount: 0,
    joinDate: new Date().toISOString().split('T')[0],
    lastActive: 'الآن'
  };

  ecosystemState.teachers.push(newTeacher);
  saveEcosystem();
  return { success: true, message: `تمت إضافة المعلمة "${newTeacher.name}" بنجاح 🌸`, teacher: newTeacher };
}

// Remove Teacher Role (Admin only)
export function removeTeacherRole(uid) {
  loadEcosystem();
  const teacherIndex = ecosystemState.teachers.findIndex(t => t.uid === uid);
  if (teacherIndex < 0) {
    return { success: false, message: 'المستخدم ليس معلماً' };
  }

  const teacher = ecosystemState.teachers.splice(teacherIndex, 1)[0];
  
  // Revert to independent user
  const revertedUser = {
    uid: teacher.uid,
    name: teacher.name,
    email: teacher.email,
    role: 'user',
    isSafarMember: false,
    groupId: null,
    groupName: null,
    teacherId: null,
    teacherName: null,
    photoURL: teacher.photoURL,
    memorizedJuz: 10,
    memorizedPagesCount: 200,
    thisWeekSessions: 2,
    consistencyRate: 85,
    lastRecitationDate: 'اليوم',
    status: 'active',
    joinDate: teacher.joinDate || new Date().toISOString().split('T')[0],
    lastActive: 'الآن'
  };

  ecosystemState.independentUsers.push(revertedUser);
  saveEcosystem();

  return { success: true, message: `تم إلغاء دور المعلم وإعادة "${teacher.name}" إلى مستخدم/طالب عادي`, user: revertedUser };
}

// -------------------------------------------------------------
// TEACHER DIRECT STUDENT MANAGEMENT (المعلمة تضيف طالبة مباشرة)
// -------------------------------------------------------------
export function addStudentByTeacher(teacherId, { name, email, memorizedJuz = 1, currentTarget = 'صفحة واحدة يومياً', groupId = null }) {
  loadEcosystem();
  if (!teacherId || !name) {
    return { success: false, message: 'اسم الطالبة ومعرف المعلمة مطلوبان' };
  }

  // Find target group
  let targetGroup = null;
  if (groupId) {
    targetGroup = ecosystemState.groups.find(g => g.id === groupId);
  }
  if (!targetGroup) {
    targetGroup = ecosystemState.groups.find(g => g.teacherId === teacherId) || ecosystemState.groups[0];
  }

  const teacher = ecosystemState.teachers.find(t => t.uid === teacherId) || {
    uid: teacherId,
    name: targetGroup?.teacherName || 'معلمة معتمدة'
  };

  const cleanEmail = (email || `student_${Date.now()}@safar.org`).trim().toLowerCase();
  const juzCount = Number(memorizedJuz) || 1;
  const pagesCount = juzCount * 20;

  // Check if student exists in independentUsers or students
  let existingIndex = ecosystemState.students.findIndex(s => s.email === cleanEmail);
  if (existingIndex >= 0) {
    const s = ecosystemState.students[existingIndex];
    s.groupId = targetGroup?.id || 'group_safar_1';
    s.groupName = targetGroup?.name || 'مجموعة الإتقان';
    s.teacherId = teacher.uid;
    s.teacherName = teacher.name;
    s.isSafarMember = true;
    s.memorizedJuz = juzCount;
    s.memorizedPagesCount = pagesCount;
    saveEcosystem();
    return { success: true, message: `تم تحديث بيانات الطالبة "${name}" وربطها بالمجموعة بنجاح 🌿`, student: s };
  }

  const newStudent = {
    uid: 'student_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    role: 'student',
    isSafarMember: true,
    groupId: targetGroup?.id || 'group_safar_1',
    groupName: targetGroup?.name || 'مجموعة الإتقان والتثبيت',
    teacherId: teacher.uid,
    teacherName: teacher.name,
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    memorizedJuz: juzCount,
    memorizedPagesCount: pagesCount,
    thisWeekSessions: 2,
    consistencyRate: 90,
    lastRecitationDate: 'اليوم',
    status: 'excellent',
    attentionReason: null,
    currentTarget: currentTarget || 'صفحة واحدة يومياً',
    currentSurah: 'البقرة',
    currentJuz: Math.min(30, juzCount + 1),
    goalCompletionRate: 35,
    totalSessionsCount: 2,
    joinDate: new Date().toISOString().split('T')[0],
    lastActive: 'الآن',
    recitationStats: {
      sessionsCount: 2,
      averageAccuracy: 96,
      errorsCount: 1,
      hesitationsCount: 0,
      recentFeedbacks: ['بداية موفقة ومباركة في المجموعة!']
    }
  };

  ecosystemState.students.unshift(newStudent);
  if (targetGroup) {
    targetGroup.membersCount = (targetGroup.membersCount || 0) + 1;
  }
  saveEcosystem();

  return { 
    success: true, 
    message: `تمت إضافة الطالبة "${name}" إلى مجموعة "${targetGroup?.name}" بنجاح 🌷`, 
    student: newStudent 
  };
}

// -------------------------------------------------------------
// TEACHER SEARCH & GATHER STUDENTS (المعلمة تبحث عن طالبات وتضمهن لحلقتها)
// -------------------------------------------------------------
export function getAvailableStudentsForTeacher(teacherId, search = '') {
  loadEcosystem();
  
  // Identify groups owned by this teacher
  const teacherGroupIds = (ecosystemState.groups || [])
    .filter(g => g.teacherId === teacherId)
    .map(g => g.id);

  let pool = [];

  // 1. Independent users on the platform (not yet attached to any circle)
  for (const u of (ecosystemState.independentUsers || [])) {
    pool.push({
      uid: u.uid,
      name: u.name,
      email: u.email,
      photoURL: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
      memorizedJuz: u.memorizedJuz || 0,
      consistencyRate: u.consistencyRate || 85,
      status: u.status || 'active',
      groupName: 'طالبة مستقلة (غير منضمة لحلقة)',
      isInThisTeacherGroup: false,
      isEnrolledAnywhere: false,
      role: 'independent'
    });
  }

  // 2. Safar students on the platform
  for (const s of (ecosystemState.students || [])) {
    const isMine = teacherGroupIds.includes(s.groupId) || s.teacherId === teacherId;
    pool.push({
      uid: s.uid,
      name: s.name,
      email: s.email,
      photoURL: s.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
      memorizedJuz: s.memorizedJuz || 1,
      consistencyRate: s.consistencyRate || 90,
      status: s.status || 'active',
      groupName: s.groupName || 'حلقة قرآنية',
      isInThisTeacherGroup: isMine,
      isEnrolledAnywhere: true,
      role: 'safar_student'
    });
  }

  // Live text search filtering
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    pool = pool.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.email && p.email.toLowerCase().includes(q))
    );
  }

  return pool;
}

// Teacher Enrolls/Gathers Student into her circle
export function enrollStudentInTeacherGroup(teacherId, { studentUid, email, name, groupId, currentTarget }) {
  loadEcosystem();
  if (!teacherId) return { success: false, message: 'معرف المعلمة مطلوب' };

  // Find target group
  let targetGroup = null;
  if (groupId) {
    targetGroup = ecosystemState.groups.find(g => g.id === groupId);
  }
  if (!targetGroup) {
    targetGroup = ecosystemState.groups.find(g => g.teacherId === teacherId) || ecosystemState.groups[0];
  }

  if (!targetGroup) {
    return { success: false, message: 'لم يتم العثور على حلقة مخصصة للمعلمة' };
  }

  const teacher = ecosystemState.teachers.find(t => t.uid === teacherId) || {
    uid: teacherId,
    name: targetGroup?.teacherName || 'معلمة الحلقة'
  };

  // Case 1: Student is in students list
  let student = null;
  if (studentUid) {
    student = ecosystemState.students.find(s => s.uid === studentUid);
  }
  if (!student && email) {
    student = ecosystemState.students.find(s => s.email.toLowerCase() === email.toLowerCase());
  }

  if (student) {
    student.groupId = targetGroup.id;
    student.groupName = targetGroup.name;
    student.teacherId = teacher.uid;
    student.teacherName = teacher.name;
    student.isSafarMember = true;
    student.status = 'active';
    if (currentTarget) student.currentTarget = currentTarget;
    saveEcosystem();
    return {
      success: true,
      message: `تم ضم الطالبة "${student.name}" إلى حلقة "${targetGroup.name}" بنجاح 🌷`,
      student
    };
  }

  // Case 2: Student is in independent users
  let indepIndex = -1;
  if (studentUid) {
    indepIndex = ecosystemState.independentUsers.findIndex(u => u.uid === studentUid);
  }
  if (indepIndex < 0 && email) {
    indepIndex = ecosystemState.independentUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (indepIndex >= 0) {
    const [indepUser] = ecosystemState.independentUsers.splice(indepIndex, 1);
    const newStudent = {
      ...indepUser,
      role: 'student',
      isSafarMember: true,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      teacherId: teacher.uid,
      teacherName: teacher.name,
      status: 'active',
      currentTarget: currentTarget || `حفظ وتثبيت مع ${targetGroup.name}`,
      lastActive: 'الآن'
    };
    ecosystemState.students.unshift(newStudent);
    targetGroup.membersCount = (targetGroup.membersCount || 0) + 1;
    saveEcosystem();
    return {
      success: true,
      message: `تم ضم الطالبة المستقلة "${newStudent.name}" إلى حلقة "${targetGroup.name}" بنجاح 🌿`,
      student: newStudent
    };
  }

  // Case 3: Completely new student, register and enroll
  return addStudentByTeacher(teacherId, {
    name: name || 'طالبة جديدة',
    email: email,
    memorizedJuz: 1,
    currentTarget: currentTarget || 'صفحة واحدة يومياً',
    groupId: targetGroup.id
  });
}

// -------------------------------------------------------------
// ADMIN STUDENT DISTRIBUTION (الأدمن يوزع الطالبات على المجموعات)
// -------------------------------------------------------------
export function distributeStudentByAdmin({ studentUid, groupId, teacherId }) {
  loadEcosystem();
  if (!studentUid || !groupId) {
    return { success: false, message: 'معرف الطالبة ومعرف المجموعة مطلوبان' };
  }

  const targetGroup = ecosystemState.groups.find(g => g.id === groupId);
  if (!targetGroup) {
    return { success: false, message: 'المجموعة المحددة غير موجودة' };
  }

  const targetTeacher = teacherId 
    ? ecosystemState.teachers.find(t => t.uid === teacherId) 
    : ecosystemState.teachers.find(t => t.uid === targetGroup.teacherId);

  const teacherName = targetTeacher?.name || targetGroup.teacherName || 'معلمة المجموعة';
  const effectiveTeacherId = targetTeacher?.uid || targetGroup.teacherId;

  // 1. Check in students list
  let student = ecosystemState.students.find(s => s.uid === studentUid);
  if (student) {
    const oldGroupName = student.groupName;
    student.groupId = targetGroup.id;
    student.groupName = targetGroup.name;
    student.teacherId = effectiveTeacherId;
    student.teacherName = teacherName;
    student.isSafarMember = true;
    saveEcosystem();
    return { 
      success: true, 
      message: `تم نقل وتوزيع الطالبة "${student.name}" إلى ${targetGroup.name} (المعلمة: ${teacherName}) بنجاح ✨`,
      student 
    };
  }

  // 2. Check in independent users list
  const indepIndex = ecosystemState.independentUsers.findIndex(u => u.uid === studentUid);
  if (indepIndex >= 0) {
    const [indepUser] = ecosystemState.independentUsers.splice(indepIndex, 1);
    const convertedStudent = {
      ...indepUser,
      role: 'student',
      isSafarMember: true,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      teacherId: effectiveTeacherId,
      teacherName: teacherName,
      status: 'excellent',
      currentTarget: `الالتزام بورد ${targetGroup.name}`,
      attentionReason: null,
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: 'الآن'
    };
    ecosystemState.students.unshift(convertedStudent);
    targetGroup.membersCount = (targetGroup.membersCount || 0) + 1;
    saveEcosystem();
    return { 
      success: true, 
      message: `تم إلحاق الطالبة المستقلة "${convertedStudent.name}" بمجموعة "${targetGroup.name}" وتعيين المعلمة ${teacherName} لها 🌿`,
      student: convertedStudent 
    };
  }

  return { success: false, message: 'لم يتم العثور على الطالبة المحددة' };
}

// -------------------------------------------------------------
// ENROLLMENT REQUESTS (طلبات الانتساب من الطالبات للأدمن)
// -------------------------------------------------------------
export function submitEnrollmentRequest(reqData) {
  loadEcosystem();
  const { name, email, phone, memorizedJuz, dailyGoal, preferredTime, preferredLevel, notes } = reqData;
  if (!name || !email) {
    return { success: false, message: 'الاسم والبريد الإلكتروني مطلوبان لطلب الانتساب' };
  }

  const newReq = {
    id: 'req_' + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone || '',
    memorizedJuz: Number(memorizedJuz) || 1,
    dailyGoal: dailyGoal || 'صفحة واحدة يومياً',
    preferredTime: preferredTime || 'الفترة المسائية',
    preferredLevel: preferredLevel || 'متوسط',
    notes: notes || '',
    requestDate: new Date().toISOString().split('T')[0],
    status: 'pending'
  };

  if (!Array.isArray(ecosystemState.enrollmentRequests)) {
    ecosystemState.enrollmentRequests = [];
  }
  ecosystemState.enrollmentRequests.unshift(newReq);
  saveEcosystem();

  return { 
    success: true, 
    message: 'تم إرسال طلب انتسابك بنجاح! سيقوم المشرف العام بتعيين المجموعة والمعلمة الأنسب لمستواك وإشعارك فوراً 🌿', 
    request: newReq 
  };
}

export function getEnrollmentRequests() {
  loadEcosystem();
  return ecosystemState.enrollmentRequests || [];
}

export function approveEnrollmentRequest(requestId, groupId, teacherId) {
  loadEcosystem();
  const reqList = ecosystemState.enrollmentRequests || [];
  const reqIndex = reqList.findIndex(r => r.id === requestId);
  if (reqIndex < 0) {
    return { success: false, message: 'طلب الانتساب غير موجود' };
  }

  const req = reqList[reqIndex];
  const targetGroup = ecosystemState.groups.find(g => g.id === groupId) || ecosystemState.groups[0];
  const targetTeacher = teacherId 
    ? ecosystemState.teachers.find(t => t.uid === teacherId) 
    : ecosystemState.teachers.find(t => t.uid === targetGroup.teacherId);

  const teacherName = targetTeacher?.name || targetGroup.teacherName || 'معلمة المجموعة';
  const effectiveTeacherId = targetTeacher?.uid || targetGroup.teacherId;

  // Add as active student
  const newStudent = {
    uid: 'student_' + Date.now(),
    name: req.name,
    email: req.email,
    role: 'student',
    isSafarMember: true,
    groupId: targetGroup.id,
    groupName: targetGroup.name,
    teacherId: effectiveTeacherId,
    teacherName: teacherName,
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(req.name)}`,
    memorizedJuz: req.memorizedJuz || 1,
    memorizedPagesCount: (req.memorizedJuz || 1) * 20,
    thisWeekSessions: 1,
    consistencyRate: 95,
    lastRecitationDate: 'اليوم',
    status: 'excellent',
    attentionReason: null,
    currentTarget: req.dailyGoal || 'صفحة واحدة يومياً',
    currentSurah: 'الفاتحة / البقرة',
    currentJuz: Math.min(30, (req.memorizedJuz || 1) + 1),
    goalCompletionRate: 10,
    totalSessionsCount: 1,
    joinDate: new Date().toISOString().split('T')[0],
    lastActive: 'الآن'
  };

  ecosystemState.students.unshift(newStudent);
  targetGroup.membersCount = (targetGroup.membersCount || 0) + 1;
  req.status = 'approved';
  req.assignedGroup = targetGroup.name;
  req.assignedTeacher = teacherName;
  saveEcosystem();

  return {
    success: true,
    message: `تم قبول طلب الانتساب وتعيين الطالبة "${req.name}" في "${targetGroup.name}" مع المعلمة "${teacherName}" بنجاح 🎉`,
    student: newStudent
  };
}

// -------------------------------------------------------------
// ADMIN COMPREHENSIVE MEMORIZATION PERFORMANCE & STATS
// -------------------------------------------------------------
export function getMemorizationPerformanceStats() {
  loadEcosystem();

  const allStudents = ecosystemState.students || [];
  const indepUsers = ecosystemState.independentUsers || [];
  const totalLearners = allStudents.length + indepUsers.length;

  // 1. Total Pages Memorized Calculation
  let totalPages = 0;
  let totalJuzSum = 0;
  let totalWeeklySessions = 0;
  let highAchieversCount = 0;
  let onTrackCount = 0;
  let needsHelpCount = 0;

  allStudents.forEach(s => {
    const pages = s.memorizedPagesCount || (s.memorizedJuz ? s.memorizedJuz * 20 : 20);
    totalPages += pages;
    totalJuzSum += (s.memorizedJuz || 1);
    totalWeeklySessions += (s.thisWeekSessions || 0);

    if (s.consistencyRate >= 85 || s.status === 'excellent') {
      highAchieversCount++;
    } else if (s.status === 'needs_attention') {
      needsHelpCount++;
    } else {
      onTrackCount++;
    }
  });

  indepUsers.forEach(u => {
    const pages = u.memorizedPagesCount || (u.memorizedJuz ? u.memorizedJuz * 20 : 15);
    totalPages += pages;
    totalJuzSum += (u.memorizedJuz || 1);
  });

  // Base platform numbers for scale
  const totalSystemPages = 248500 + totalPages;
  const averagePagesPerStudent = allStudents.length > 0 ? (totalPages / allStudents.length).toFixed(1) : 48;
  const averageDailyTargetPages = 1.6; // Average 1.6 pages / day

  // Completion forecast for 2026
  // A student memorizing 1.5 pages/day memorizes ~45 pages/month = 2.25 Juz/month -> completes 30 Juz in 13 months
  const estimatedHafizThisYear = Math.round(180 + (highAchieversCount * 0.4));

  return {
    success: true,
    stats: {
      totalStudentsCount: allStudents.length,
      independentUsersCount: indepUsers.length,
      totalLearners,
      totalPagesMemorized: totalSystemPages,
      studentSpecificPages: totalPages,
      averagePagesPerStudent: Number(averagePagesPerStudent),
      averageDailyTargetPages,
      totalWeeklySessions: 3420 + totalWeeklySessions,
      averageAccuracy: 95.8,
      estimatedGraduatesThisYear: estimatedHafizThisYear,
      groupsCount: ecosystemState.groups.length,
      teachersCount: ecosystemState.teachers.length
    },
    distribution: {
      highAchieversCount: highAchieversCount + 32,
      onTrackCount: onTrackCount + 14,
      needsHelpCount: needsHelpCount + 4
    },
    topPerformingGroups: ecosystemState.groups.map(g => ({
      id: g.id,
      name: g.name,
      teacherName: g.teacherName,
      membersCount: g.membersCount,
      completionRate: 91
    })),
    monthlyProgressTrend: [
      { month: 'أكتوبر', pages: 198000, students: 240 },
      { month: 'نوفمبر', pages: 212000, students: 285 },
      { month: 'ديسمبر', pages: 226000, students: 310 },
      { month: 'يناير', pages: 235000, students: 340 },
      { month: 'فبراير', pages: 242000, students: 380 },
      { month: 'مارس (الحالي)', pages: totalSystemPages, students: allStudents.length }
    ]
  };
}

