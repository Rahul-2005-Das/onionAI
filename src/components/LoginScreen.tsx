import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { UserRole } from '../types/assessment';
import { LanguageSelector } from './LanguageSelector';
import { ShieldCheck, User, Building2, KeyRound, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t, speakText } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>('inspector');
  const [pin, setPin] = useState<string>('1234');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMsg(t.auth.invalidPinError);
      return;
    }
    speakText(t.voice.loginSuccess);
    onLogin(selectedRole);
  };

  const handleDemoInstant = () => {
    speakText(t.voice.loginSuccess);
    onLogin(selectedRole);
  };

  return (
    <div className="login-screen-container">
      {/* Primary Language Selector right at top of onboarding */}
      <section className="login-language-section">
        <LanguageSelector variant="full" />
      </section>

      <div className="login-card-main">
        <div className="login-header-group">
          <div className="login-logo-circle">🧅</div>
          <h1 className="login-main-title">{t.auth.loginTitle}</h1>
          <p className="login-main-subtitle">{t.auth.loginSubtitle}</p>
        </div>

        {/* 1-Tap Big Role Selection Cards */}
        <div className="role-selection-group" role="radiogroup" aria-label={t.auth.selectRole}>
          {/* Quality Inspector */}
          <button
            type="button"
            className={`role-select-card ${selectedRole === 'inspector' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('inspector')}
            aria-checked={selectedRole === 'inspector'}
            role="radio"
          >
            <div className="role-icon-box inspector">
              <ShieldCheck size={36} strokeWidth={2.5} />
            </div>
            <div className="role-text-content">
              <h2 className="role-title">{t.auth.inspector}</h2>
              <p className="role-desc">{t.auth.inspectorDesc}</p>
            </div>
          </button>

          {/* Farmer / Supplier */}
          <button
            type="button"
            className={`role-select-card ${selectedRole === 'farmer' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('farmer')}
            aria-checked={selectedRole === 'farmer'}
            role="radio"
          >
            <div className="role-icon-box farmer">
              <User size={36} strokeWidth={2.5} />
            </div>
            <div className="role-text-content">
              <h2 className="role-title">{t.auth.farmer}</h2>
              <p className="role-desc">{t.auth.farmerDesc}</p>
            </div>
          </button>

          {/* Mandi Admin */}
          <button
            type="button"
            className={`role-select-card ${selectedRole === 'admin' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('admin')}
            aria-checked={selectedRole === 'admin'}
            role="radio"
          >
            <div className="role-icon-box admin">
              <Building2 size={36} strokeWidth={2.5} />
            </div>
            <div className="role-text-content">
              <h2 className="role-title">{t.auth.admin}</h2>
              <p className="role-desc">{t.auth.adminDesc}</p>
            </div>
          </button>
        </div>

        {/* PIN Entry with big numbers */}
        <form onSubmit={handleLoginSubmit} className="login-form-group">
          <label htmlFor="login-pin-input" className="pin-label">
            <KeyRound size={20} />
            <span>{t.auth.enterPin}</span>
          </label>
          <div className="pin-input-wrapper">
            <input
              id="login-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={t.auth.pinPlaceholder}
              className="touch-pin-input"
            />
          </div>

          {errorMsg && <p className="validation-error-text" role="alert">{errorMsg}</p>}

          <div className="login-actions-stack">
            <button type="submit" className="giant-action-btn primary-gradient">
              <span>{t.auth.loginButton}</span>
              <ArrowRight size={24} strokeWidth={3} />
            </button>

            <button
              type="button"
              onClick={handleDemoInstant}
              className="giant-action-btn secondary-flat"
            >
              <span>{t.auth.guestDemoButton}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
