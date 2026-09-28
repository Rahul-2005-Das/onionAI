import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import type { UserRole, AssessmentRecord, OnionVariety } from './types/assessment';
import { INITIAL_ASSESSMENTS } from './utils/demoData';
import { formatAssessmentDate } from './utils/formatDate';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { LotDetailsScreen } from './components/LotDetailsScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { HumanReviewScreen } from './components/HumanReviewScreen';
import { FinalResultScreen } from './components/FinalResultScreen';
import { ReportScreen } from './components/ReportScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HelpScreen } from './components/HelpScreen';
import type { OnionAnalysisResult } from './types/inference';
import { LayoutDashboard, PlusCircle, History, Settings } from 'lucide-react';

const OnionApp: React.FC = () => {
  const { t, language } = useLanguage();

  // App navigation state
  const [currentScreen, setCurrentScreen] = useState<string>('login');
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('onion_user_role') as UserRole) || null;
  });

  // High contrast & large font settings
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('onion_high_contrast') === 'true';
  });
  const [isLargeFont, setIsLargeFont] = useState<boolean>(() => {
    return localStorage.getItem('onion_large_font') === 'true';
  });
  const [simpleMode, setSimpleMode] = useState<boolean>(() => {
    return localStorage.getItem('onion_simple_mode') !== 'false';
  });

  // Assessments records
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() => {
    const saved = localStorage.getItem('onion_assessments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ASSESSMENTS;
      }
    }
    return INITIAL_ASSESSMENTS;
  });

  // Active assessment flow data
  const [activeLotData, setActiveLotData] = useState<{
    lotId: string;
    procurementCenter: string;
    farmerName: string;
    variety: OnionVariety;
    sampleSize: number;
  }>({
    lotId: 'LOT-2026-904',
    procurementCenter: 'Lasalgaon APMC, Nashik',
    farmerName: 'Ramesh Patel',
    variety: 'red',
    sampleSize: 30,
  });

  const [activeImage, setActiveImage] = useState<File | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [activeAnalysisRecord, setActiveAnalysisRecord] = useState<AssessmentRecord | null>(null);
  const [activeReportRecord, setActiveReportRecord] = useState<AssessmentRecord | null>(null);
  const [reportReturnScreen, setReportReturnScreen] = useState('dashboard');

  // Sync assessments with localStorage
  useEffect(() => {
    localStorage.setItem('onion_assessments', JSON.stringify(assessments));
  }, [assessments]);

  // Sync role
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('onion_user_role', userRole);
    } else {
      localStorage.removeItem('onion_user_role');
    }
  }, [userRole]);

  // High contrast & large font class toggles
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast-mode');
      localStorage.setItem('onion_high_contrast', 'true');
    } else {
      document.body.classList.remove('high-contrast-mode');
      localStorage.setItem('onion_high_contrast', 'false');
    }
  }, [isHighContrast]);

  useEffect(() => {
    if (isLargeFont) {
      document.body.classList.add('large-font-mode');
      localStorage.setItem('onion_large_font', 'true');
    } else {
      document.body.classList.remove('large-font-mode');
      localStorage.setItem('onion_large_font', 'false');
    }
  }, [isLargeFont]);

  useEffect(() => {
    localStorage.setItem('onion_simple_mode', String(simpleMode));
  }, [simpleMode]);

  // Auth Handlers
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentScreen('login');
  };

  const handleBack = () => {
    const previousScreens: Record<string, string> = {
      'lot-details': 'dashboard',
      capture: 'lot-details',
      analysis: 'capture',
      results: 'capture',
      'human-review': 'results',
      'final-result': 'human-review',
      history: 'dashboard',
      settings: 'dashboard',
      help: 'dashboard',
    };
    setCurrentScreen(currentScreen === 'report' ? reportReturnScreen : previousScreens[currentScreen] || 'dashboard');
  };

  // Assessment flow handlers
  const handleStartNewAssessment = () => {
    if (activeImageUrl) URL.revokeObjectURL(activeImageUrl);
    setActiveImage(null);
    setActiveImageUrl(null);
    setCurrentScreen('lot-details');
  };

  const handleLotProceed = (lotData: {
    lotId: string;
    procurementCenter: string;
    farmerName: string;
    variety: OnionVariety;
    sampleSize: number;
  }) => {
    setActiveLotData(lotData);
    setCurrentScreen('capture');
  };

  const handleAnalyzeStart = (image: File) => {
    if (activeImageUrl) URL.revokeObjectURL(activeImageUrl);
    setActiveImage(image);
    setActiveImageUrl(URL.createObjectURL(image));
    setCurrentScreen('analysis');
  };

  const handleAnalysisComplete = (result: OnionAnalysisResult) => {
    const record: AssessmentRecord = {
      id: `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lotId: activeLotData.lotId,
      farmerName: activeLotData.farmerName,
      mandi: activeLotData.procurementCenter,
      variety: activeLotData.variety,
      sampleSize: activeLotData.sampleSize,
      timestamp: new Date().toISOString(),
      dateFormatted: formatAssessmentDate(new Date().toISOString(), language),
      inspectorName: userRole === 'inspector' ? 'Er. Sandeep Jadhav' : 'Verified Inspector',
      totalCount: result.total,
      unclassifiedCount: result.unclassifiedCount,
      defects: { ...result.counts },
      gradeAPercent: result.gradeAPercent,
      gradeBPercent: result.gradeBPercent,
      ursPercent: result.ursPercent,
      qualityScore: result.qualityScore,
      overallGrade: result.finalGrade,
      storageVerdict: result.storageVerdict,
      gradingRulesOfficial: result.gradingRulesOfficial,
      gradingRulesVersion: result.gradingRulesVersion,
      percentages: result.percentages,
      imageUrl: activeImageUrl || undefined,
      inferenceMode: result.mode,
      detectedOnions: result.detections,
    };

    setActiveAnalysisRecord(record);
    setCurrentScreen('results');
  };

  const handleAcceptReviewedResult = (finalRecord: AssessmentRecord) => {
    setAssessments((prev) => [finalRecord, ...prev]);
    setActiveAnalysisRecord(finalRecord);
    setCurrentScreen('final-result');
  };

  const handleGenerateFinalReport = () => {
    if (!activeAnalysisRecord) return;
    setReportReturnScreen('final-result');
    setActiveReportRecord(activeAnalysisRecord);
    setCurrentScreen('report');
  };

  const handleViewReport = (record: AssessmentRecord) => {
    setReportReturnScreen('dashboard');
    setActiveReportRecord(record);
    setCurrentScreen('report');
  };

  const handleResetData = () => {
    setAssessments(INITIAL_ASSESSMENTS);
    localStorage.setItem('onion_assessments', JSON.stringify(INITIAL_ASSESSMENTS));
  };

  return (
    <div className="onion-app-root">
      {/* Universal Header with Back, Home, Voice guide and Language switcher */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onBack={handleBack}
        userRole={userRole}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content-scrollable">
        {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}

        {currentScreen === 'dashboard' && userRole && (
          <DashboardScreen
            userRole={userRole}
            assessments={assessments}
            onStartNewAssessment={handleStartNewAssessment}
            onViewHistory={() => setCurrentScreen('history')}
            onViewReport={handleViewReport}
            onViewLanguage={() => setCurrentScreen('settings')}
            onViewHelp={() => setCurrentScreen('help')}
            simpleMode={simpleMode}
            onToggleSimpleMode={() => setSimpleMode((current) => !current)}
          />
        )}

        {currentScreen === 'lot-details' && (
          <LotDetailsScreen onProceed={handleLotProceed} />
        )}

        {currentScreen === 'capture' && (
          <CaptureScreen onAnalyze={handleAnalyzeStart} simpleMode={simpleMode} />
        )}

        {currentScreen === 'analysis' && activeImage && (
          <AnalysisScreen
            image={activeImage}
            onComplete={handleAnalysisComplete}
            onChangePhoto={() => setCurrentScreen('capture')}
          />
        )}

        {currentScreen === 'results' && activeAnalysisRecord && (
          <ResultsScreen
            record={activeAnalysisRecord}
            onReview={() => setCurrentScreen('human-review')}
          />
        )}

        {currentScreen === 'human-review' && activeAnalysisRecord && (
          <HumanReviewScreen record={activeAnalysisRecord} onAccept={handleAcceptReviewedResult} />
        )}

        {currentScreen === 'final-result' && activeAnalysisRecord && (
          <FinalResultScreen record={activeAnalysisRecord} onGenerateReport={handleGenerateFinalReport} />
        )}

        {currentScreen === 'report' && activeReportRecord && (
          <ReportScreen
            record={activeReportRecord}
            onBack={handleBack}
            onBackToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            assessments={assessments}
            onSelectRecord={(rec) => {
              setReportReturnScreen('history');
              setActiveReportRecord(rec);
              setCurrentScreen('report');
            }}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onResetData={handleResetData}
            isHighContrast={isHighContrast}
            onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
            isLargeFont={isLargeFont}
            onToggleLargeFont={() => setIsLargeFont(!isLargeFont)}
          />
        )}

        {currentScreen === 'help' && <HelpScreen onHome={() => setCurrentScreen('dashboard')} />}
      </main>

      {/* Bottom Touch Navigation Bar (visible when logged in) */}
      {userRole && currentScreen !== 'login' && currentScreen !== 'analysis' && currentScreen !== 'dashboard' && (
        <nav className="bottom-touch-nav no-print" role="navigation" aria-label={t.common.mainNavigation}>
          <button
            type="button"
            className={`bottom-nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('dashboard')}
          >
            <LayoutDashboard size={24} />
            <span className="bottom-nav-label">{t.nav.dashboard}</span>
          </button>

          <button
            type="button"
            className={`bottom-nav-item primary-action ${currentScreen === 'lot-details' || currentScreen === 'capture' || currentScreen === 'results' ? 'active' : ''}`}
            onClick={handleStartNewAssessment}
          >
            <PlusCircle size={30} strokeWidth={2.5} />
            <span className="bottom-nav-label">{t.nav.newAssessment}</span>
          </button>

          <button
            type="button"
            className={`bottom-nav-item ${currentScreen === 'history' || currentScreen === 'report' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('history')}
          >
            <History size={24} />
            <span className="bottom-nav-label">{t.nav.history}</span>
          </button>

          <button
            type="button"
            className={`bottom-nav-item ${currentScreen === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('settings')}
          >
            <Settings size={24} />
            <span className="bottom-nav-label">{t.nav.settings}</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <OnionApp />
    </LanguageProvider>
  );
}
