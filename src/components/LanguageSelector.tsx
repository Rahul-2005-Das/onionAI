import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../translations/types';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'full' | 'compact' | 'header';
  onSelect?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'full', onSelect }) => {
  const { language, setLanguage, t } = useLanguage();

  const options: { code: Language; label: string; subLabel: string }[] = [
    { code: 'en', label: 'English', subLabel: 'English' },
    { code: 'bn', label: 'বাংলা', subLabel: 'Bengali' },
    { code: 'hi', label: 'हिन्दी', subLabel: 'Hindi' },
  ];

  const handleSelect = (code: Language) => {
    setLanguage(code);
    if (onSelect) onSelect();
  };

  if (variant === 'header') {
    return (
      <div className="language-selector-header" role="region" aria-label={t.common.selectLanguage}>
        <div className="lang-header-icon" title={t.common.language}>
          <Globe size={20} strokeWidth={2.5} />
          <span className="lang-header-text">{t.common.language}</span>
        </div>
        <div className="lang-header-buttons" role="group" aria-label={t.common.selectLanguage}>
          {options.map((opt) => {
            const isActive = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => handleSelect(opt.code)}
                className={`lang-btn-header ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`language-selector-card ${variant}`} role="region" aria-label={t.common.selectLanguage}>
      <div className="lang-title-row">
        <Globe className="lang-globe-icon" size={28} strokeWidth={2.5} />
        <h2 className="lang-title">{t.common.selectLanguage}</h2>
      </div>

      <div className="lang-buttons-grid" role="group" aria-label={t.common.selectLanguage}>
        {options.map((opt) => {
          const isActive = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => handleSelect(opt.code)}
              className={`lang-choice-btn ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
            >
              <span className="lang-main-text">{opt.label}</span>
              <span className="lang-sub-text">{opt.subLabel}</span>
              {isActive && (
                <span className="lang-check-badge" aria-hidden="true">
                  <Check size={20} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
