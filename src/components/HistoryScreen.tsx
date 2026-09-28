import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { AssessmentRecord } from '../types/assessment';
import { Search, Download, FileText } from 'lucide-react';
import { formatAssessmentDate } from '../utils/formatDate';

interface HistoryScreenProps {
  assessments: AssessmentRecord[];
  onSelectRecord: (record: AssessmentRecord) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ assessments, onSelectRecord }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const filteredAssessments = assessments.filter((rec) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      rec.lotId.toLowerCase().includes(query) ||
      rec.farmerName.toLowerCase().includes(query) ||
      rec.mandi.toLowerCase().includes(query);

    const matchesGrade =
      gradeFilter === 'all' ||
      (gradeFilter === 'Grade A' && rec.overallGrade === 'Grade A') ||
      (gradeFilter === 'Grade B' && rec.overallGrade === 'Grade B') ||
      (gradeFilter === 'URS' && rec.overallGrade === 'URS');

    return matchesSearch && matchesGrade;
  });

  const handleExportCsv = () => {
    const headers = [t.report.certId, t.history.lotLabel, t.lot.farmerName, t.report.mandiLocation, t.history.dateLabel, t.history.gradeLabel, `${t.dashboard.gradeAPercentage} %`, `${t.dashboard.ursPercentage} %`, t.history.scoreLabel];
    const rows = filteredAssessments.map((a) => [
      a.id,
      a.lotId,
      a.farmerName,
      `"${a.mandi}"`,
      `"${formatAssessmentDate(a.timestamp, language)}"`,
      a.overallGrade,
      `${a.gradeAPercent}%`,
      `${a.ursPercent}%`,
      a.qualityScore,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OnionIQ_Grading_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="stepper-screen-container">
      {/* Header */}
      <div className="stepper-header-badge">
        <h2 className="step-main-title">{t.history.title}</h2>
        <p className="step-main-subtitle">{t.history.subtitle}</p>
      </div>

      <div className="step-form-card">
        {/* Search Bar */}
        <div className="history-search-row">
          <div className="search-input-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.history.searchPlaceholder}
              className="touch-search-input"
            />
          </div>

          <button
            type="button"
            className="csv-export-btn"
            onClick={handleExportCsv}
            title={t.history.exportCsv}
          >
            <Download size={20} />
            <span>CSV</span>
          </button>
        </div>

        {/* Grade Filter Chips */}
        <div className="history-filter-chips">
          <button
            type="button"
            className={`filter-pill-btn ${gradeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setGradeFilter('all')}
          >
            {t.history.allGrades} ({assessments.length})
          </button>

          <button
            type="button"
            className={`filter-pill-btn grade-a ${gradeFilter === 'Grade A' ? 'active' : ''}`}
            onClick={() => setGradeFilter('Grade A')}
          >
            ⭐ {t.results.gradeA}
          </button>

          <button
            type="button"
            className={`filter-pill-btn grade-b ${gradeFilter === 'Grade B' ? 'active' : ''}`}
            onClick={() => setGradeFilter('Grade B')}
          >
            ⚖️ {t.results.gradeB}
          </button>

          <button
            type="button"
            className={`filter-pill-btn grade-urs ${gradeFilter === 'URS' ? 'active' : ''}`}
            onClick={() => setGradeFilter('URS')}
          >
            ⚠️ {t.results.urs}
          </button>
        </div>

        {/* Records Count */}
        <div className="records-count-meta">
          <span>{t.history.totalRecords}: {filteredAssessments.length}</span>
        </div>

        {/* History Cards List */}
        {filteredAssessments.length === 0 ? (
          <div className="empty-state-box">
            <FileText size={48} className="empty-icon" />
            <p className="empty-title">{t.history.noHistoryFound}</p>
          </div>
        ) : (
          <div className="history-cards-stack">
            {filteredAssessments.map((rec) => {
              const isGradeA = rec.overallGrade === 'Grade A';
              const isURS = rec.overallGrade === 'URS';
              const isUnclassified = rec.overallGrade === 'Unclassified';
              const gradeClass = isGradeA ? 'grade-a-chip' : isURS ? 'grade-urs-chip' : isUnclassified ? 'grade-unclassified-chip' : 'grade-b-chip';

              return (
                <div key={rec.id} className="history-item-card">
                  <div className="item-top-row">
                    <span className="item-lot-id">{rec.lotId}</span>
                    <span className={`grade-pill ${gradeClass}`}>
                      {rec.overallGrade === 'Grade A'
                        ? t.results.gradeA
                        : rec.overallGrade === 'Grade B'
                        ? t.results.gradeB
                        : rec.overallGrade === 'URS' ? t.results.urs : t.results.unclassified}
                    </span>
                  </div>

                  <div className="item-body-row">
                    <div>
                      <h4 className="item-farmer-name">{rec.farmerName}</h4>
                      <p className="item-mandi-name">{rec.mandi}</p>
                      <span className="item-date-text">{formatAssessmentDate(rec.timestamp, language)}</span>
                    </div>

                    <div className="item-stats-badge">
                      <div className="badge-stat">
                        <span className="stat-name">{t.dashboard.gradeAPercentage}</span>
                        <strong className="stat-number-sm color-green">{rec.gradeAPercent}%</strong>
                      </div>
                      <div className="badge-stat">
                        <span className="stat-name">{t.dashboard.ursPercentage}</span>
                        <strong className="stat-number-sm color-red">{rec.ursPercent}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="item-actions-row">
                    <button
                      type="button"
                      className="view-report-pill-btn"
                      onClick={() => onSelectRecord(rec)}
                    >
                      <FileText size={18} />
                      <span>{t.history.viewReport}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
