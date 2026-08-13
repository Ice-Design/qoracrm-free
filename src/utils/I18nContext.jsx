import { createContext, useContext, useState, useEffect } from 'react';
import en from './i18n/en.json';
import uk from './i18n/uk.json';
import de from './i18n/de.json';
import ro from './i18n/ro.json';
import es from './i18n/es.json';
import pl from './i18n/pl.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import ru from './i18n/ru.json';

import { registerLocale } from 'react-datepicker';
import { ru as ruLocale, uk as ukLocale, de as deLocale, ro as roLocale, es as esLocale, pl as plLocale, fr as frLocale, it as itLocale } from 'date-fns/locale';

const LOCALES = { en, uk, de, ro, es, pl, fr, it, ru };

// Register date-fns locales for react-datepicker
registerLocale('uk', ukLocale);
registerLocale('de', deLocale);
registerLocale('ro', roLocale);
registerLocale('es', esLocale);
registerLocale('pl', plLocale);
registerLocale('fr', frLocale);
registerLocale('it', itLocale);
registerLocale('ru', ruLocale);

const I18nContext = createContext({ t: (key) => key, language: 'en', setLanguage: () => { } });

export function I18nProvider({ children }) {
  const getDefaultLanguage = () => {
    // 1. Explicitly saved language in settings (if not 'auto')
    const savedLang = window.qoraCrmData?.general?.language;
    if (savedLang && savedLang !== 'auto' && LOCALES[savedLang]) {
      return savedLang;
    }
    // 2. WordPress site language (wpLocale)
    if (window.qoraCrmData?.wpLocale) {
      const wpLang = window.qoraCrmData.wpLocale.toLowerCase();
      if (wpLang.startsWith('en')) return 'en';
      if (wpLang.startsWith('uk')) return 'uk';
      if (wpLang.startsWith('de')) return 'de';
      if (wpLang.startsWith('ro') || wpLang.startsWith('mo')) return 'ro';
      if (wpLang.startsWith('es')) return 'es';
      if (wpLang.startsWith('pl')) return 'pl';
      if (wpLang.startsWith('fr')) return 'fr';
      if (wpLang.startsWith('it')) return 'it';
      if (wpLang.startsWith('ru')) return 'ru';
    }
    // 3. Fallback to 'en'
    return 'en';
  };

  const [language, setLanguageState] = useState(getDefaultLanguage());

  // Load language from settings on mount
  useEffect(() => {
    const fetchLang = async () => {
      try {
        const res = await window.wp?.apiFetch({ path: '/qoracrm/v1/settings' });
        const lang = res?.general?.language;
        if (lang && lang !== 'auto' && LOCALES[lang]) {
          setLanguageState(lang);
        }
      } catch {
        // keep current default
      }
    };
    fetchLang();
  }, []);

  const setLanguage = (lang) => {
    if (LOCALES[lang]) setLanguageState(lang);
  };

  const t = (key, replacements = {}) => {
    const locale = LOCALES[language] || LOCALES['en'];
    let str = locale[key] ?? LOCALES['en'][key] ?? key;
    // Simple replacement: {name} → value
    Object.entries(replacements).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return str;
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
