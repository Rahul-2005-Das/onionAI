import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Check, Loader2, RotateCcw, ImagePlus } from 'lucide-react';
import { analyzeOnionImage, OnionAnalysisError } from '../services/onionAnalysis';
import type { OnionAnalysisResult } from '../types/inference';

interface AnalysisScreenProps {
  image: File;
  onComplete: (result: OnionAnalysisResult) => void;
  onChangePhoto: () => void;
}

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ image, onComplete, onChangePhoto }) => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(5);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const steps = [
    t.workflow.findOnions,
    t.workflow.checkDefects,
    t.workflow.checkSize,
    t.workflow.calculateQuality,
  ];

  useEffect(() => {
    let elapsed = 0;
    let isCurrent = true;
    setErrorKey(null);
    setProgress(5);
    setCurrentStepIndex(0);

    const progressTimer = window.setInterval(() => {
      elapsed += 1;
      setProgress(Math.min(92, 5 + elapsed * 2));
      setCurrentStepIndex(Math.min(3, Math.floor(elapsed / 5)));
    }, 1000);

    analyzeOnionImage(image)
      .then((result) => {
        if (!isCurrent) return;
        window.clearInterval(progressTimer);
        setProgress(100);
        setCurrentStepIndex(4);
        onComplete(result);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        window.clearInterval(progressTimer);
        if (error instanceof OnionAnalysisError) setErrorKey(error.reason);
        else setErrorKey('analysisFailed');
      });

    return () => {
      isCurrent = false;
      window.clearInterval(progressTimer);
    };
  }, [image, attempt, onComplete]);

  return (
    <div className="analysis-screen-container">
      <div className="analysis-card">
        {/* Animated Scanner Radar Graphic */}
        <div className="radar-circle-wrapper">
          <div className="radar-sweep-beam" />
          <div className="radar-center-bulb">🧅</div>
          <div className="radar-ring ring-1" />
          <div className="radar-ring ring-2" />
        </div>

        <span className="step-counter-pill">{t.workflow.analysisStep}</span>
        <h2 className="analysis-title">{t.workflow.checkingQuality}</h2>
        {errorKey ? <p className="analysis-error" role="alert">{t.api[errorKey as keyof typeof t.api]}</p> : null}

        {/* Big High-Contrast Progress Bar */}
        <div className="analysis-progress-wrapper" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-numbers-row">
            <span>{t.analysis.pleaseWait}</span>
            <span className="pct-text">{progress}% {t.analysis.progressPercentage}</span>
          </div>
        </div>

        {/* Step-by-Step AI Checklist */}
        <div className="analysis-steps-list">
          {steps.map((stepText, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`step-item-row ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}
              >
                <div className="step-status-icon">
                  {isCompleted ? (
                    <Check size={18} strokeWidth={3} className="color-green" />
                  ) : isCurrent ? (
                    <Loader2 size={18} className="spinner-icon color-blue" />
                  ) : (
                    <div className="dot-pending" />
                  )}
                </div>
                <span className="step-label-text">{stepText}</span>
              </div>
            );
          })}
        </div>

        {errorKey ? (
          <div className="analysis-retry-actions">
            <button type="button" className="photo-secondary-action" onClick={() => setAttempt((previous) => previous + 1)}>
              <RotateCcw size={24} /><span>{t.common.retry}</span>
            </button>
            <button type="button" className="photo-primary-action" onClick={onChangePhoto}>
              <ImagePlus size={24} /><span>{t.workflow.changePhoto}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
