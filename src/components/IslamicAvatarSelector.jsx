import React, { useState } from 'react';
import { Check, User, Heart } from 'lucide-react';

export const islamicAvatars = {
  male: [
    { id: 'm1', name: 'أحمد', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Ahmad&baseColor=f9c9b6&hair=short' },
    { id: 'm2', name: 'عمر', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Omar&baseColor=f9c9b6&hair=short' },
    { id: 'm3', name: 'يوسف', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Youssef&baseColor=ac6651&hair=short' },
    { id: 'm4', name: 'عبد الله', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Abdullah&baseColor=77311d&hair=short' }
  ],
  female: [
    { id: 'f1', name: 'مريم (محجبة)', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Maryam&hijab=true' },
    { id: 'f2', name: 'فاطمة (محجبة)', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Fatima&hijab=true' },
    { id: 'f3', name: 'سارة (محجبة)', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Sara&hijab=true' },
    { id: 'f4', name: 'عائشة (محجبة)', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Aisha&hijab=true' }
  ]
};

export const IslamicAvatarSelector = ({ currentAvatar, onSelectAvatar }) => {
  const [gender, setGender] = useState('male'); // 'male' | 'female'

  const activeAvatars = gender === 'male' ? islamicAvatars.male : islamicAvatars.female;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      
      {/* Gender Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '4px',
        borderRadius: '12px',
        background: 'var(--bg-color)',
        border: '1px solid var(--glass-border)'
      }}>
        <button
          type="button"
          onClick={() => setGender('male')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: gender === 'male' ? 'var(--primary)' : 'transparent',
            color: gender === 'male' ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          👨‍💼 حافظ (شاب)
        </button>

        <button
          type="button"
          onClick={() => setGender('female')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: gender === 'female' ? 'var(--primary)' : 'transparent',
            color: gender === 'female' ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          🧕 حافظة (محجبة)
        </button>
      </div>

      {/* Avatar Grid Options */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {activeAvatars.map((avatar) => {
          const isSelected = currentAvatar === avatar.url;

          return (
            <div
              key={avatar.id}
              onClick={() => onSelectAvatar(avatar.url)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: `3px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                padding: '4px',
                background: 'var(--bg-surface)',
                boxShadow: isSelected ? '0 4px 16px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                />
              </div>

              {isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: '22px',
                  right: '0',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                {avatar.name}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
