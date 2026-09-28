import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { UserRole } from '../types/assessment';
import { LanguageSelector } from './LanguageSelector';
import { ArrowLeft, Home, Volume2, VolumeX, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onBack: () => void;
  userRole: UserRole | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  userRole,
  onLogout,
}) => {
  const { t, speakText, stopSpeaking, isSpeaking } = useLanguage();

  const handleSpeakCurrentScreen = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    let speech = '';
    switch (currentScreen) {
      case 'dashboard':
        speech = `${t.dashboard.title}. ${t.dashboard.subtitle}. ${t.voice.welcome}`;
        break;
      case 'lot-details':
        speech = `${t.lot.title}. ${t.lot.subtitle}. ${t.lot.stepIndicator}`;
        break;
      case 'capture':
        speech = `${t.assessment.title}. ${t.assessment.subtitle}. ${t.voice.capturePrompt}`;
        break;
      case 'results':
        speech = `${t.results.title}. ${t.results.stepIndicator}. ${t.results.overallQuality}`;
        break;
      case 'report':
        speech = `${t.report.digitalQualityReport}. ${t.report.finalGradeStamp}`;
        break;
      default:
        speech = `${t.common.appName}. ${t.common.tagline}`;
    }
    speakText(speech);
  };

  const getRoleLabel = () => {
    if (!userRole) return '';
    if (userRole === 'farmer') return t.auth.farmer;
    if (userRole === 'inspector') return t.auth.inspector;
    return t.auth.admin;
  };

  const showBack = currentScreen !== 'login' && currentScreen !== 'dashboard';
  const showHome = currentScreen !== 'login' && currentScreen !== 'dashboard';

  return (
    <header className="app-header" role="banner">
      <div className="header-top-bar">
        {/* Navigation buttons: Back and Home */}
        <div className="nav-action-group">
          {showBack && (
            <button
              type="button"
              className="touch-nav-btn back-btn"
              onClick={onBack}
              aria-label={t.common.back}
              title={t.common.back}
            >
              <ArrowLeft size={24} strokeWidth={3} />
              <span className="nav-btn-text">{t.common.back}</span>
            </button>
          )}

          {showHome && (
            <button
              type="button"
              className="touch-nav-btn home-btn"
              onClick={() => onNavigate('dashboard')}
              aria-label={t.common.home}
              title={t.common.home}
            >
              <Home size={24} strokeWidth={2.5} />
              <span className="nav-btn-text">{t.common.home}</span>
            </button>
          )}

          <button type="button" className="brand-badge" onClick={() => onNavigate(userRole ? 'dashboard' : 'login')}>
            <span className="brand-logo-icon">🧅</span>
            <div>
              <h1 className="brand-title">{t.common.appName}</h1>
              <p className="brand-tagline">{t.common.tagline}</p>
            </div>
          </button>
        </div>

        {/* Audio speaker + Language Selector Header */}
        <div className="header-controls-group">
          {/* Voice guidance button for low literacy users */}
          <button
            type="button"
            className={`touch-audio-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={handleSpeakCurrentScreen}
            aria-label={isSpeaking ? t.voice.stopAudio : t.voice.listenReport}
            title={isSpeaking ? t.voice.stopAudio : t.voice.listenReport}
          >
            {isSpeaking ? <VolumeX size={22} strokeWidth={2.5} /> : <Volume2 size={22} strokeWidth={2.5} />}
            <span className="audio-btn-label">
              {isSpeaking ? t.voice.stopAudio : t.voice.listenReport}
            </span>
          </button>

          {/* Easy 1-tap Language Switcher */}
          <LanguageSelector variant="header" />

          {/* User role and logout */}
          {userRole && (
            <div className="user-profile-badge">
              <span className="user-role-chip" title={t.auth.loggedInAs}>
                {userRole === 'inspector' ? <ShieldCheck size={16} /> : <User size={16} />}
                <span className="user-role-text">{getRoleLabel()}</span>
              </span>
              <button
                type="button"
                className="logout-small-btn"
                onClick={onLogout}
                title={t.auth.logout}
              >
                {t.auth.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
