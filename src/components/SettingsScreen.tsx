import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { Volume2, SunMedium, Type, Info, RefreshCw, Check } from 'lucide-react';

interface SettingsScreenProps {
  onResetData: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  isLargeFont: boolean;
  onToggleLargeFont: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onResetData,
  isHighContrast,
  onToggleHighContrast,
  isLargeFont,
  onToggleLargeFont,
}) => {
  const { t, speakText, language } = useLanguage();
  const [resetNotice, setResetNotice] = useState<boolean>(false);

  const handleTestAudio = () => {
    let testVoiceMsg = '';
    if (language === 'bn') {
      testVoiceMsg = 'ভয়েস গাইড সফলভাবে চালু আছে। পেঁয়াজ পরীক্ষার জন্য প্রস্তুত।';
    } else if (language === 'hi') {
      testVoiceMsg = 'वॉइस गाइड सफलतापूर्वक सक्रिय है। प्याज जांच के लिए तैयार।';
    } else {
      testVoiceMsg = 'Voice guide is active and ready for onion quality assessment.';
    }
    speakText(testVoiceMsg);
  };

  const handleReset = () => {
    onResetData();
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 3000);
  };

  return (
    <div className="stepper-screen-container">
      {/* Header */}
      <div className="stepper-header-badge">
        <h2 className="step-main-title">{t.settings.title}</h2>
      </div>

      <div className="step-form-card">
        {/* Preferred Language Selector as specified */}
        <div className="settings-section-card">
          <LanguageSelector variant="full" />
        </div>

        {/* Voice Audio Guide */}
        <div className="settings-section-card">
          <div className="settings-row">
            <div className="settings-info-col">
              <div className="settings-title-row">
                <Volume2 size={24} className="color-sky" />
                <h3 className="settings-row-title">{t.settings.audioGuide}</h3>
              </div>
              <p className="settings-row-desc">{t.settings.audioGuideDesc}</p>
            </div>
            <button
              type="button"
              className="test-voice-btn"
              onClick={handleTestAudio}
            >
              <span>{t.settings.testAudio}</span>
            </button>
          </div>
        </div>

        {/* High Contrast Mode for Outdoor Mandi Sunlight */}
        <div className="settings-section-card">
          <div className="settings-row">
            <div className="settings-info-col">
              <div className="settings-title-row">
                <SunMedium size={24} className="color-amber" />
                <h3 className="settings-row-title">{t.settings.highContrast}</h3>
              </div>
              <p className="settings-row-desc">{t.settings.highContrastDesc}</p>
            </div>
            <button
              type="button"
              className={`toggle-switch-btn ${isHighContrast ? 'active' : ''}`}
              onClick={onToggleHighContrast}
              aria-pressed={isHighContrast}
              aria-label={t.settings.highContrast}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Font Size Selector */}
        <div className="settings-section-card">
          <div className="settings-row">
            <div className="settings-info-col">
              <div className="settings-title-row">
                <Type size={24} />
                <h3 className="settings-row-title">{t.settings.fontSize}</h3>
              </div>
              <p className="settings-row-desc">
                {isLargeFont ? t.settings.fontSizeLarge : t.settings.fontSizeNormal}
              </p>
            </div>
            <button
              type="button"
              className={`toggle-switch-btn ${isLargeFont ? 'active' : ''}`}
              onClick={onToggleLargeFont}
              aria-pressed={isLargeFont}
              aria-label={t.settings.fontSize}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* About App & SIH Info */}
        <div className="settings-section-card about-box">
          <div className="settings-title-row">
            <Info size={24} className="color-green" />
            <h3 className="settings-row-title">{t.settings.aboutApp}</h3>
          </div>
          <p className="app-version-text">{t.settings.appVersion}</p>
          <p className="sih-tagline-text">{t.settings.sihTagline}</p>
        </div>

        {/* Reset Data */}
        <div className="settings-section-card reset-card">
          <button
            type="button"
            className="reset-demo-btn"
            onClick={handleReset}
          >
            <RefreshCw size={20} />
            <span>{t.settings.resetData}</span>
          </button>
          {resetNotice && (
            <p className="reset-notice-text">
              <Check size={16} />
              <span>{t.settings.dataResetSuccess}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
