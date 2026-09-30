import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  BookOpen, 
  ChevronDown, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RoleSwitcher = ({ onRoleChanged }) => {
  const { user, updateUserData } = useAuth();
  const { lang, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    {
      id: 'student_safar',
      title: 'طالبة في سَفَر',
      subtitle: 'حلقة النور والهدى (أ. عائشة)',
      role: 'user',
      isSafarMember: true,
      groupName: 'حلقة النور والهدى',
      groupId: 'g_nur',
      teacherName: 'أ. عائشة العتيبي',
      icon: Users,
      color: '#10B981',
      badge: 'طالبة حلقة'
    },
    {
      id: 'teacher',
      title: 'معلمة حلقة (أ. عائشة)',
      subtitle: 'إشراف على 24 طالبة وتنبيهات',
      role: 'teacher',
      isSafarMember: true,
      icon: GraduationCap,
      color: '#8B5CF6',
      badge: 'معلمة'
    },
    {
      id: 'admin',
      title: 'مدير المنصة (Admin)',
      subtitle: 'إحصائيات كاملة وإدارة الأدوار',
      role: 'admin',
      icon: ShieldCheck,
      color: '#EF4444',
      badge: 'المدير'
    },
    {
      id: 'student_independent',
      title: 'حافظ مستقل (دون حلقة)',
      subtitle: 'حفظ شخصي واستكشاف المصحف',
      role: 'user',
      isSafarMember: false,
      groupName: null,
      groupId: null,
      teacherName: null,
      icon: BookOpen,
      color: '#F59E0B',
      badge: 'مستقل'
    }
  ];

  // Determine currently active preview
  const currentActiveRole = user?.role === 'admin' 
    ? 'admin' 
    : (user?.role === 'teacher' ? 'teacher' : (user?.isSafarMember ? 'student_safar' : 'student_independent'));

  const activeOption = roles.find(r => r.id === currentActiveRole) || roles[0];

  const handleSelect = (r) => {
    setIsOpen(false);
    if (updateUserData) {
      if (r.id === 'teacher') {
        updateUserData({
          role: 'teacher',
          name: 'أ. عائشة العتيبي',
          email: 'aisha@safar.org',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AishaTeacher',
          isSafarMember: true,
          groupId: 'g_nur',
          groupName: 'حلقة النور والهدى'
        });
      } else if (r.id === 'admin') {
        updateUserData({
          role: 'admin',
          name: 'مدير منصة سَفَر',
          email: 'admin@ma7fath.ai',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminSafar'
        });
      } else if (r.id === 'student_safar') {
        updateUserData({
          role: 'user',
          name: 'سارة الخالدي',
          email: 'sara@safar.org',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaraKh',
          isSafarMember: true,
          groupId: 'g_nur',
          groupName: 'حلقة النور والهدى',
          teacherName: 'أ. عائشة العتيبي'
        });
      } else {
        updateUserData({
          role: 'user',
          name: 'أحمد محمد',
          email: 'ahmad@example.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
          isSafarMember: false,
          groupId: null,
          groupName: null,
          teacherName: null
        });
      }
    }
    if (onRoleChanged) onRoleChanged(r.role);
  };

  const Icon = activeOption.icon;

  return null;
};
