import React, { useEffect, useState } from 'react';
import { Check, Minus, Plus, SquarePen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { AssessmentRecord, DefectCounts } from '../types/assessment';
import type { QualityCalculation } from '../types/inference';
import { calculateOnionCounts } from '../services/onionAnalysis';

interface HumanReviewScreenProps {
  record: AssessmentRecord;
  onAccept: (record: AssessmentRecord) => void;
}

export const HumanReviewScreen: React.FC<HumanReviewScreenProps> = ({ record, onAccept }) => {
  const { t } = useLanguage();
  const [review, setReview] = useState<{ total: number; counts: DefectCounts }>(() => ({
    total: record.totalCount,
    counts: { ...record.defects },
  }));
  const [calculation, setCalculation] = useState<QualityCalculation>(() => ({
    total: record.totalCount,
    counts: { ...record.defects },
    unclassifiedCount: Math.max(0, record.totalCount - Object.values(record.defects).reduce((sum, count) => sum + count, 0)),
    percentages: record.percentages ?? {},
    gradeAPercent: record.gradeAPercent,
    gradeBPercent: record.gradeBPercent,
    ursPercent: record.ursPercent,
    qualityScore: record.qualityScore,
    finalGrade: record.overallGrade,
    storageVerdict: record.storageVerdict,
    gradingRulesOfficial: record.gradingRulesOfficial ?? false,
    gradingRulesVersion: record.gradingRulesVersion ?? 'draft-1',
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationFailed, setCalculationFailed] = useState(false);
  const [retryNumber, setRetryNumber] = useState(0);
  const defects = review.counts;
  const categories: { key: keyof DefectCounts; icon: string; label: string }[] = [
    { key: 'healthy', icon: '🧅', label: t.results.healthy },
    { key: 'damaged', icon: '✂️', label: t.results.damaged },
    { key: 'rotten', icon: '⚠️', label: t.results.rotten },
    { key: 'sprouted', icon: '🌱', label: t.results.sprouted },
    { key: 'undersized', icon: '🔘', label: t.results.undersized },
  ];

  useEffect(() => {
    if (!hasChanges) return;
    let isCurrent = true;
    setIsCalculating(true);
    setCalculationFailed(false);
    const timeout = window.setTimeout(() => {
      calculateOnionCounts(review.total, review.counts)
        .then((result) => {
          if (isCurrent) setCalculation(result);
        })
        .catch(() => {
          if (isCurrent) setCalculationFailed(true);
        })
        .finally(() => {
          if (isCurrent) setIsCalculating(false);
        });
    }, 180);
    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [review, hasChanges, retryNumber]);

  const adjust = (category: keyof DefectCounts, amount: number) => {
    setHasChanges(true);
    setReview((current) => {
      const updatedCount = Math.max(0, current.counts[category] + amount);
      const actualChange = updatedCount - current.counts[category];
      if (!actualChange) return current;
      return {
        total: current.total + actualChange,
        counts: { ...current.counts, [category]: updatedCount },
      };
    });
  };

  const handleAccept = () => {
    onAccept({
      ...record,
      defects: review.counts,
      totalCount: calculation.total,
      unclassifiedCount: calculation.unclassifiedCount,
      gradeAPercent: calculation.gradeAPercent,
      gradeBPercent: calculation.gradeBPercent,
      ursPercent: calculation.ursPercent,
      qualityScore: calculation.qualityScore,
      overallGrade: calculation.finalGrade,
      storageVerdict: calculation.storageVerdict,
      percentages: calculation.percentages,
      gradingRulesOfficial: calculation.gradingRulesOfficial,
      gradingRulesVersion: calculation.gradingRulesVersion,
    });
  };

  return (
    <section className="workflow-result-screen" aria-labelledby="review-title">
      <header className="workflow-screen-heading">
        <span className="step-counter-pill">{t.workflow.reviewStep}</span>
        <h2 id="review-title">{t.workflow.humanReview}</h2>
      </header>
      {record.inferenceMode !== 'model' && <p className="inference-mode-notice demo" role="note">{t.workflow.demoNotice}</p>}
      {!calculation.gradingRulesOfficial && <p className="inference-mode-notice demo" role="note">{t.workflow.gradingRulesNotice}</p>}
      {record.imageUrl && <img className="review-source-image" src={record.imageUrl} alt={t.workflow.previewTitle} />}
      <div className="review-count-list">
        {categories.map(({ key, icon, label }) => (
          <div className="review-count-row" key={key}>
            <span className="review-count-icon" aria-hidden="true">{icon}</span>
            <strong className="review-count-label">{label}</strong>
            {isEditing && (
              <button type="button" className="review-count-adjust" onClick={() => adjust(key, -1)} aria-label={`${t.common.decrease} ${label}`} disabled={defects[key] === 0}>
                <Minus size={24} aria-hidden="true" />
              </button>
            )}
            <span className="review-count-number" aria-live="polite">{defects[key]}</span>
            {isEditing && (
              <button type="button" className="review-count-adjust" onClick={() => adjust(key, 1)} aria-label={`${t.common.increase} ${label}`}>
                <Plus size={24} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      {isCalculating && <p className="calculation-status" role="status">{t.workflow.calculatingCounts}</p>}
      {calculationFailed && (
        <div className="calculation-error" role="alert">
          <span>{t.api.calculationFailed}</span>
          <button type="button" onClick={() => setRetryNumber((number) => number + 1)}>{t.common.retry}</button>
        </div>
      )}
      <div className="review-summary" aria-busy={isCalculating}>
        <span>{t.workflow.totalOnions}: <strong>{review.total}</strong></span>
        <span>{t.results.gradeA}: <strong>{calculation.gradeAPercent}%</strong></span>
        <span>{t.results.urs}: <strong>{calculation.ursPercent}%</strong></span>
        <span>{t.results.qualityScore}: <strong>{calculation.qualityScore}</strong></span>
      </div>
      <div className="review-action-row">
        <button type="button" className="photo-secondary-action" onClick={() => setIsEditing((editing) => !editing)}>
          <SquarePen size={26} aria-hidden="true" />
          <span>{isEditing ? t.workflow.finishEditing : t.workflow.editResult}</span>
        </button>
        <button type="button" className="photo-primary-action" onClick={handleAccept} disabled={isCalculating || calculationFailed}>
          <Check size={28} aria-hidden="true" />
          <span>{t.workflow.acceptResult}</span>
        </button>
      </div>
    </section>
  );
};