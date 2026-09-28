import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { UserRole, AssessmentRecord } from '../types/assessment';
import { Camera, FileText, CheckCircle2, XCircle, ArrowRight, Globe, HelpCircle, Sparkles } from 'lucide-react';
import { formatAssessmentDate } from '../utils/formatDate';

interface DashboardScreenProps {
  userRole: UserRole;
  assessments: AssessmentRecord[];
  onStartNewAssessment: () => void;
  onViewHistory: () => void;
  onViewReport: (record: AssessmentRecord) => void;
  onViewLanguage: () => void;
  onViewHelp: () => void;
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userRole,
  assessments,
  onStartNewAssessment,
  onViewHistory,
  onViewReport,
  onViewLanguage,
  onViewHelp,
  simpleMode,
  onToggleSimpleMode,
}) => {
  const { t, language } = useLanguage();

  // Calculate quick stats
  const totalCount = assessments.length;
  const gradeACount = assessments.filter((a) => a.overallGrade === 'Grade A').length;
  const ursCount = assessments.filter((a) => a.overallGrade === 'URS').length;
  const gradeAPct = totalCount > 0 ? Math.round((gradeACount / totalCount) * 100) : 0;
  const ursPct = totalCount > 0 ? Math.round((ursCount / totalCount) * 100) : 0;

  const recentList = assessments.slice(0, 3);

  return (
    <div className="dashboard-container">
      <section className="simple-home" aria-label={t.common.appName}>
        <div className="simple-home-heading">
          <span aria-hidden="true" className="simple-home-onion">🧅</span>
          <h2>{t.dashboard.title}</h2>
        </div>
        <button
          type="button"
          className="simple-home-action primary"
          onClick={onStartNewAssessment}
        >
          <Camera size={42} strokeWidth={2.5} aria-hidden="true" />
          <span>{t.common.checkOnionQuality}</span>
          <ArrowRight size={26} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="simple-home-action"
          onClick={onViewHistory}
        >
          <FileText size={40} strokeWidth={2.5} aria-hidden="true" />
          <span>{t.common.myReports}</span>
          <ArrowRight size={26} aria-hidden="true" />
        </button>
        <button type="button" className="simple-home-action" onClick={onViewLanguage}>
          <Globe size={40} strokeWidth={2.5} aria-hidden="true" />
          <span>{t.common.languageAction}</span>
          <ArrowRight size={26} aria-hidden="true" />
        </button>
        <button type="button" className="simple-home-action" onClick={onViewHelp}>
          <HelpCircle size={40} strokeWidth={2.5} aria-hidden="true" />
          <span>{t.common.helpAction}</span>
          <ArrowRight size={26} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`simple-mode-toggle ${simpleMode ? 'active' : ''}`}
          onClick={onToggleSimpleMode}
          aria-pressed={simpleMode}
        >
          {simpleMode ? <CheckCircle2 size={22} aria-hidden="true" /> : <Sparkles size={22} aria-hidden="true" />}
          <span>{t.common.simpleMode}</span>
        </button>
      </section>

      {!simpleMode && (
        <section className="detailed-dashboard" aria-label={t.dashboard.quickStatsTitle}>
          <div className="detailed-dashboard-heading">
            <h3>{t.dashboard.quickStatsTitle}</h3>
            <span>{userRole === 'inspector' ? t.auth.inspector : userRole === 'farmer' ? t.auth.farmer : t.auth.admin}</span>
          </div>
          <div className="stats-summary-grid">
            <div className="stat-card neutral">
              <span className="stat-label">{t.dashboard.totalInspected}</span>
              <span className="stat-number">{totalCount}</span>
              <span className="stat-sub">{t.dashboard.activeLots}</span>
            </div>
            <div className="stat-card success">
              <div className="stat-icon-row"><CheckCircle2 size={24} /><span className="stat-label">{t.dashboard.gradeAPercentage}</span></div>
              <span className="stat-number">{gradeAPct}%</span>
              <span className="stat-sub">{gradeACount} {t.dashboard.lotsApproved}</span>
            </div>
            <div className="stat-card danger">
              <div className="stat-icon-row"><XCircle size={24} /><span className="stat-label">{t.dashboard.ursPercentage}</span></div>
              <span className="stat-number">{ursPct}%</span>
              <span className="stat-sub">{ursCount} {t.dashboard.lotsRejected}</span>
            </div>
          </div>
          <div className="section-header-row">
            <h3 className="section-heading-sm">{t.dashboard.recentAssessments}</h3>
            <button type="button" className="text-link-btn" onClick={onViewHistory}>
              {t.common.viewAll} ({totalCount}) →
            </button>
          </div>
          {recentList.length === 0 ? (
            <div className="empty-state-box"><p className="empty-title">{t.dashboard.noRecentAssessments}</p></div>
          ) : (
            <div className="recent-cards-list">
              {recentList.map((rec) => {
                const isGradeA = rec.overallGrade === 'Grade A';
                const isURS = rec.overallGrade === 'URS';
                const gradeClass = isGradeA ? 'grade-a-chip' : isURS ? 'grade-urs-chip' : rec.overallGrade === 'Unclassified' ? 'grade-unclassified-chip' : 'grade-b-chip';
                return (
                  <div key={rec.id} className="recent-inspection-card">
                    <div className="card-left-info">
                      <span className="lot-tag">{rec.lotId}</span>
                      <h4 className="farmer-name">{rec.farmerName}</h4>
                      <p className="mandi-name-text">{rec.mandi}</p>
                      <span className="timestamp-text">{formatAssessmentDate(rec.timestamp, language)}</span>
                    </div>
                    <div className="card-right-action">
                      <span className={`grade-pill ${gradeClass}`}>
                        {rec.overallGrade === 'Grade A' ? t.results.gradeA : rec.overallGrade === 'Grade B' ? t.results.gradeB : rec.overallGrade === 'URS' ? t.results.urs : t.results.unclassified}
                      </span>
                      <button type="button" className="view-cert-btn" onClick={() => onViewReport(rec)}>
                        {t.dashboard.viewDetails}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
