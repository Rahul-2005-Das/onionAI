import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { AssessmentRecord } from '../types/assessment';
import { Download, Share2, ArrowLeft, Volume2, ShieldCheck, Check, AlertTriangle } from 'lucide-react';
import { formatAssessmentDate } from '../utils/formatDate';

interface ReportScreenProps {
  record: AssessmentRecord;
  onBack: () => void;
  onBackToDashboard: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ record, onBack, onBackToDashboard }) => {
  const { t, speakText, language } = useLanguage();
  const [notification, setNotification] = useState<string | null>(null);

  const isApproved = record.storageVerdict === 'pass';
  const gradeLabel = record.overallGrade === 'Grade A'
    ? t.results.gradeA
    : record.overallGrade === 'Grade B'
      ? t.results.gradeB
      : record.overallGrade === 'URS' ? t.results.urs : t.results.unclassified;
  const storageMessage = record.storageVerdict === 'unclassified'
    ? t.results.storageVerdictUnavailable
    : isApproved ? t.results.storageVerdictPass : t.results.storageVerdictFail;
  const breakdownItems = [
    { key: 'healthy', icon: '🧅', label: t.results.healthy, count: record.defects.healthy, percentage: record.percentages?.healthy, criteria: t.report.criteriaSoundBulb },
    { key: 'damaged', icon: '✂️', label: t.results.damaged, count: record.defects.damaged, percentage: record.percentages?.damaged, criteria: t.report.criteriaCutDefect },
    { key: 'rotten', icon: '⚠️', label: t.results.rotten, count: record.defects.rotten, percentage: record.percentages?.rotten, criteria: t.report.criteriaZeroTolerance },
    { key: 'sprouted', icon: '🌱', label: t.results.sprouted, count: record.defects.sprouted, percentage: record.percentages?.sprouted, criteria: t.report.criteriaSproutLimit },
    { key: 'undersized', icon: '🔘', label: t.results.undersized, count: record.defects.undersized, percentage: record.percentages?.undersized, criteria: t.report.criteriaUnderSize },
    ...(record.unclassifiedCount ? [{ key: 'unclassified', icon: '❔', label: t.results.unclassified, count: record.unclassifiedCount, percentage: record.percentages?.unclassified, criteria: t.results.unclassified }] : []),
  ];

  const handleDownload = () => {
    window.print();
    setNotification(t.report.printSuccess);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShare = async () => {
    const text = `${t.report.digitalQualityReport}: ${record.lotId}. ${record.overallGrade}. ${record.gradeAPercent}% ${t.results.gradeA}. ${t.results.urs}: ${record.ursPercent}%.`;
    try {
      if (navigator.share) await navigator.share({ title: t.report.digitalQualityReport, text });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      else {
        setNotification(t.report.shareUnavailable);
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      setNotification(t.report.shareSuccess);
    } catch {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setNotification(t.report.shareSuccess);
      } catch {
        setNotification(t.report.shareUnavailable);
      }
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleListenReport = () => {
    const gradeName =
      record.overallGrade === 'Grade A'
        ? t.results.gradeA
        : record.overallGrade === 'Grade B'
        ? t.results.gradeB
        : t.results.urs;

    const speech = `${t.report.digitalQualityReport}. ${t.lot.lotId}: ${record.lotId}. ${t.results.overallQuality}: ${gradeName}. ${t.dashboard.gradeAPercentage}: ${record.gradeAPercent}%. ${t.dashboard.ursPercentage}: ${record.ursPercent}%. ${
      storageMessage
    }.`;

    speakText(speech);
  };

  return (
    <div className="report-screen-container">
      {/* Top Banner with Audio Button */}
      <div className="report-top-bar no-print">
        <button
          type="button"
          className="report-back-btn"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
          <span>{t.common.back}</span>
        </button>

        <div className="report-top-actions">
          <button
            type="button"
            className="report-action-pill voice"
            onClick={handleListenReport}
          >
            <Volume2 size={20} />
            <span>{t.voice.listenReport}</span>
          </button>

          <button
            type="button"
            className="report-action-pill share"
            onClick={handleShare}
          >
            <Share2 size={20} />
            <span>{t.report.shareReport}</span>
          </button>

          <button type="button" className="report-action-pill print" onClick={handleDownload}>
            <Download size={20} />
            <span>{t.report.downloadReport}</span>
          </button>
        </div>
      </div>
      <div className="report-stage-heading no-print">
        <span className="step-counter-pill">{t.workflow.reportStep}</span>
        <h2>{t.common.viewReportAction}</h2>
      </div>

      {notification && (
        <div className="toast-notification-banner no-print" role="status">
          <Check size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* PRINTABLE OFFICIAL DIGITAL CERTIFICATE */}
      <div className="printable-certificate-sheet" id="printable-certificate">
        {record.inferenceMode !== 'model' && (
          <div className="inference-mode-notice demo certificate-demo-notice" role="note">{t.workflow.demoNotice}</div>
        )}
        {record.gradingRulesOfficial !== true && (
          <div className="inference-mode-notice demo certificate-demo-notice" role="note">{t.workflow.gradingRulesNotice}</div>
        )}
        {/* Certificate Header with Emblems */}
        <div className="cert-header-band">
          <div className="cert-emblem-col">
            <span className="cert-emblem">🏛️</span>
          </div>

          <div className="cert-title-col">
            <span className="cert-gov-kicker">{t.report.portalKicker}</span>
            <h2 className="cert-headline">{t.report.digitalQualityReport}</h2>
            <p className="cert-mandi-tag">{record.mandi}</p>
          </div>

          <div className="cert-verified-col">
            <div className="verified-stamp-badge">
              {record.inferenceMode === 'model' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
              <span>{record.inferenceMode === 'model' ? t.report.verifiedBadge : t.workflow.demoBadge}</span>
            </div>
          </div>
        </div>

        {/* Certificate Metadata Table / Grid */}
        <div className="cert-meta-grid">
          <div className="cert-meta-item">
            <span className="meta-lbl">{t.report.certId}</span>
            <strong className="meta-val highlight">{record.id}</strong>
          </div>
          <div className="cert-meta-item">
            <span className="meta-lbl">{t.lot.lotId}</span>
            <strong className="meta-val">{record.lotId}</strong>
          </div>
          <div className="cert-meta-item">
            <span className="meta-lbl">{t.lot.farmerName}</span>
            <strong className="meta-val">{record.farmerName}</strong>
          </div>
          <div className="cert-meta-item">
            <span className="meta-lbl">{t.report.issueDate}</span>
            <strong className="meta-val">{formatAssessmentDate(record.timestamp, language)}</strong>
          </div>
          <div className="cert-meta-item">
            <span className="meta-lbl">{t.lot.onionType}</span>
            <strong className="meta-val">
              {record.variety === 'red' ? t.lot.redOnion : record.variety === 'white' ? t.lot.whiteOnion : t.lot.yellowOnion}
            </strong>
          </div>
          <div className="cert-meta-item">
            <span className="meta-lbl">{t.report.inspectorName}</span>
            <strong className="meta-val">{record.inferenceMode === 'model' ? record.inspectorName : t.workflow.demoBadge}</strong>
          </div>
        </div>

        {/* Big Official Grade Stamp Box */}
        <div className={`cert-grade-box ${record.overallGrade.toLowerCase().replace(' ', '-')}`}>
          <div className="cert-grade-title-group">
            <span className="stamp-sub-label">{t.report.finalGradeStamp}</span>
            <h3 className="stamp-display-grade">
              {gradeLabel}
            </h3>
          </div>

          <div className="cert-score-box">
            <span className="cert-score-num">{record.qualityScore}</span>
            <span className="cert-score-tag">{t.results.qualityScore}</span>
          </div>
        </div>

        {/* Storage Recommendation Banner */}
        <div className={`cert-storage-verdict ${isApproved ? 'approved' : 'rejected'}`}>
          <span className="verdict-icon">{isApproved ? '✅' : '🛑'}</span>
          <div className="verdict-text-block">
            <strong>{t.report.storageRecommendation}:</strong>{' '}
            <span>{storageMessage}</span>
          </div>
        </div>

        {/* Quality counts */}
        <div className="cert-table-section">
          <h4 className="cert-sub-heading">{t.report.breakdownTitle}</h4>
          <div className="report-count-list">
            {breakdownItems.map((item) => (
              <div className="report-count-row" key={item.key}>
                <span className="report-count-icon" aria-hidden="true">{item.icon}</span>
                <strong className="report-count-label">{item.label}</strong>
                <strong className="report-count-number">{item.count}</strong>
                <span className="report-count-percent">{item.percentage === undefined ? '—' : `${item.percentage}%`}</span>
              </div>
            ))}
            <div className="report-total-row">
              <strong>{t.workflow.totalOnions}</strong>
              <strong>{record.totalCount}</strong>
              <span>100%</span>
            </div>
          </div>
          <details className="report-criteria-details">
            <summary>{t.report.mandiCriteria}</summary>
            <ul>
              {breakdownItems.map((item) => <li key={item.key}><strong>{item.label}:</strong> {item.criteria}</li>)}
            </ul>
          </details>
        </div>

        {/* Certificate Footer with QR Code and Signatures */}
        <div className="cert-footer-row">
          <div className="cert-signatures-block">
            <div className="sig-line-item">
              <div className="sig-stroke-sim">{record.inferenceMode === 'model' ? record.inspectorName : t.workflow.demoBadge}</div>
              <span className="sig-title">{record.inferenceMode === 'model' ? `${t.report.inspectorName}: ${record.inspectorName}` : t.workflow.demoBadge}</span>
            </div>
            <div className="sig-line-item">
              <div className="sig-stamp-sim">{record.inferenceMode === 'model' ? t.report.aiValidatedStamp : t.workflow.demoBadge}</div>
              <span className="sig-title">{t.report.issueDate}: {formatAssessmentDate(record.timestamp, language)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Return to Dashboard bottom action */}
      <div className="report-bottom-nav no-print">
        <button
          type="button"
          className="giant-action-btn secondary-flat"
          onClick={onBackToDashboard}
        >
          <span>{t.report.backToDashboard}</span>
        </button>
      </div>
    </div>
  );
};
