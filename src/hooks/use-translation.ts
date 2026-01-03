'use client';

import { useContext } from 'react';
import { SessionContext } from '@/contexts/SessionContext';
import viTranslations from '@/lib/translations/vi.json';
import enTranslations from '@/lib/translations/en.json';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

const translations: Record<string, any> = {
  vi: viTranslations,
  en: enTranslations,
};

/**
 * Hook to get translations based on current language
 * Usage: const t = useTranslation(); t('dashboard.title')
 * With params: t('approval.detailTitle', { name: 'KPI Name' })
 */
export function useTranslation() {
  const { language } = useContext(SessionContext);
  const currentLang = language || 'vi';
  const t = (key: TranslationKey, params?: TranslationParams): string => {
    const keys = key.split('.');
    let value: any = translations[currentLang];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Vietnamese if key not found
        value = translations['vi'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters in translation string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };
  
  return { t, language: currentLang };
}










