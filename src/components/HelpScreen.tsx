import React from 'react';
import { Camera, Search, FileText, Volume2, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HelpScreenProps {
  onHome: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onHome }) => {
  const { t, speakText } = useLanguage();
  const steps = [
    { icon: Camera, label: t.help.step1Title, description: t.help.step1Desc },
    { icon: Search, label: t.help.step2Title, description: t.help.step2Desc },
    { icon: FileText, label: t.help.step3Title, description: t.help.step3Desc },
  ];

  return (
    <section className="help-screen" aria-labelledby="help-screen-title">
      <h2 id="help-screen-title">{t.help.title}</h2>
      <p className="help-subtitle">{t.help.subtitle}</p>
      <div className="help-steps">
        {steps.map(({ icon: Icon, label }, index) => (
          <div className="help-step" key={label}>
            <span className="help-step-number">{index + 1}</span>
            <Icon size={38} strokeWidth={2.25} aria-hidden="true" />
            <strong>{label}</strong>
            <span className="help-step-description">{steps[index].description}</span>
          </div>
        ))}
      </div>
      <div className="help-actions">
        <button type="button" onClick={() => speakText(`${t.help.step1Title}. ${t.help.step1Desc}. ${t.help.step2Title}. ${t.help.step2Desc}. ${t.help.step3Title}. ${t.help.step3Desc}.`)}>
          <Volume2 size={24} aria-hidden="true" />{t.help.voiceGuideBtn}
        </button>
        <button type="button" onClick={onHome}>
          <Home size={24} aria-hidden="true" />{t.help.gotItBtn}
        </button>
      </div>
    </section>
  );
};