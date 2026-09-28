import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { AssessmentRecord } from '../types/assessment';

interface FinalResultScreenProps {
  record: AssessmentRecord;
  onGenerateReport: () => void;
}

export const FinalResultScreen: React.FC<FinalResultScreenProps> = ({ record, onGenerateReport }) => {
  const { t } = useLanguage();
  const isGradeA = record.overallGrade === 'Grade A';
  const isGradeB = record.overallGrade === 'Grade B';
  const isUnclassified = record.overallGrade === 'Unclassified';
  const StatusIcon = isGradeA ? CheckCircle2 : isGradeB || isUnclassified ? AlertTriangle : XCircle;
  const gradeLabel = isGradeA ? t.results.gradeA : isGradeB ? t.results.gradeB : isUnclassified ? t.results.unclassified : t.results.urs;

  return (
    <section className="final-result-screen" aria-labelledby="final-result-title">
      <span className="step-counter-pill">{t.workflow.finalStep}</span>
      <div className={`final-result-status ${isGradeA ? 'good' : isGradeB || isUnclassified ? 'check' : 'defective'}`}>
        <StatusIcon size={54} strokeWidth={2.5} aria-hidden="true" />
        <h2 id="final-result-title">{t.workflow.assessmentComplete}</h2>
      </div>
      {record.inferenceMode !== 'model' && <p className="inference-mode-notice demo" role="note">{t.workflow.demoNotice}</p>}
      {record.gradingRulesOfficial !== true && <p className="inference-mode-notice demo" role="note">{t.workflow.gradingRulesNotice}</p>}
      <div className="final-result-grade">
        <span>{t.workflow.finalResult}</span>
        <strong>{gradeLabel}</strong>
      </div>
      <div className="final-result-metrics">
        <div><span>{t.results.gradeA}</span><strong>{record.gradeAPercent}%</strong></div>
        <div><span>{t.results.urs}</span><strong>{record.ursPercent}%</strong></div>
        <div><span>{t.results.qualityScore}</span><strong>{record.qualityScore}<small> / 100</small></strong></div>
      </div>
      <button type="button" className="workflow-primary-button" onClick={onGenerateReport}>
        <FileText size={28} aria-hidden="true" />
        <span>{t.workflow.generateReport}</span>
      </button>
    </section>
  );
};