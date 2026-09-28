import React from 'react';
import { AlertTriangle, CheckCircle2, Search, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { AssessmentRecord } from '../types/assessment';

interface ResultsScreenProps {
  record: AssessmentRecord;
  onReview: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ record, onReview }) => {
  const { t } = useLanguage();
  const status = record.overallGrade === 'Grade A'
    ? { icon: CheckCircle2, label: t.common.statusGood, className: 'good' }
    : record.overallGrade === 'Grade B'
      ? { icon: AlertTriangle, label: t.common.statusCheck, className: 'check' }
      : record.overallGrade === 'Unclassified'
        ? { icon: AlertTriangle, label: t.results.unclassified, className: 'check' }
        : { icon: XCircle, label: t.common.statusDefective, className: 'defective' };
  const StatusIcon = status.icon;
  const gradeName = record.overallGrade === 'Grade A'
    ? t.results.gradeA
    : record.overallGrade === 'Grade B' ? t.results.gradeB : record.overallGrade === 'URS' ? t.results.urs : t.results.unclassified;

  const counts = [
    { key: 'healthy', icon: '🧅', label: t.results.healthy, value: record.defects.healthy },
    { key: 'damaged', icon: '✂️', label: t.results.damaged, value: record.defects.damaged },
    { key: 'rotten', icon: '⚠️', label: t.results.rotten, value: record.defects.rotten },
    { key: 'sprouted', icon: '🌱', label: t.results.sprouted, value: record.defects.sprouted },
    { key: 'undersized', icon: '🔘', label: t.results.undersized, value: record.defects.undersized },
    ...(record.unclassifiedCount ? [{ key: 'unclassified', icon: '❔', label: t.results.unclassified, value: record.unclassifiedCount }] : []),
  ];

  return (
    <section className="workflow-result-screen" aria-labelledby="result-title">
      <header className="workflow-screen-heading">
        <span className="step-counter-pill">{t.workflow.resultsStep}</span>
        <span className={`simple-status-indicator ${status.className}`}>
          <StatusIcon size={32} aria-hidden="true" />
          <strong>{gradeName}</strong>
        </span>
        <h2 id="result-title">{t.workflow.resultsTitle}</h2>
      </header>

      {record.inferenceMode !== 'model' && (
        <p className="inference-mode-notice demo" role="note">{t.workflow.demoNotice}</p>
      )}
      {record.gradingRulesOfficial !== true && <p className="inference-mode-notice demo" role="note">{t.workflow.gradingRulesNotice}</p>}
      {record.inferenceMode === 'model' && (
        <p className="inference-mode-notice model" role="note">{t.workflow.modelNotice}</p>
      )}

      {record.imageUrl && (
        <img className="result-source-image" src={record.imageUrl} alt={t.workflow.previewTitle} />
      )}

      <div className="result-count-grid" aria-label={t.workflow.resultsTitle}>
        <div className="result-count-tile total">
          <span className="result-count-icon" aria-hidden="true">🧅</span>
          <span className="result-count-value">{record.totalCount}</span>
          <span className="result-count-label">{t.workflow.totalOnions}</span>
        </div>
        {counts.map((count) => (
          <div className="result-count-tile" key={count.key}>
            <span className="result-count-icon" aria-hidden="true">{count.icon}</span>
            <span className="result-count-value">{count.value}</span>
            <span className="result-count-label">{count.label}</span>
          </div>
        ))}
      </div>

      <div className="result-metric-grid">
        <div className="result-metric">
          <span>{t.results.gradeA}</span>
          <strong>{record.gradeAPercent}%</strong>
        </div>
        <div className="result-metric">
          <span>{t.results.urs}</span>
          <strong>{record.ursPercent}%</strong>
        </div>
        <div className="result-metric score">
          <span>{t.results.qualityScore}</span>
          <strong>{record.qualityScore}<small> / 100</small></strong>
        </div>
      </div>

      <button type="button" className="workflow-primary-button" onClick={onReview}>
        <Search size={26} aria-hidden="true" />
        <span>{t.workflow.humanReview}</span>
      </button>
    </section>
  );
};