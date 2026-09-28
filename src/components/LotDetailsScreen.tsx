import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { OnionVariety } from '../types/assessment';
import { QrCode, ArrowRight, Check } from 'lucide-react';

interface LotDetailsScreenProps {
  onProceed: (lotData: {
    lotId: string;
    procurementCenter: string;
    farmerName: string;
    variety: OnionVariety;
    sampleSize: number;
  }) => void;
}

export const LotDetailsScreen: React.FC<LotDetailsScreenProps> = ({ onProceed }) => {
  const { t, speakText } = useLanguage();

  const [lotId, setLotId] = useState<string>('');
  const [procurementCenter, setProcurementCenter] = useState<string>('');
  const [farmerName, setFarmerName] = useState<string>('');
  const [variety, setVariety] = useState<OnionVariety>('red');
  const [sampleSize, setSampleSize] = useState<number>(30);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [errorField, setErrorField] = useState<'lotId' | 'center' | null>(null);
  const [showScanSimulator, setShowScanSimulator] = useState<boolean>(false);

  const mandiPresets = [
    'Lasalgaon APMC, Nashik',
    'Memari Kisan Mandi, Burdwan',
    'Chhawani Mandi, Indore',
    'Pimpalgaon Baswant, Nashik',
  ];

  const handleSimulateScan = () => {
    setShowScanSimulator(true);
    speakText(t.lot.scanPrompt);
    setTimeout(() => {
      setLotId(`LOT-QR-${Math.floor(1000 + Math.random() * 9000)}`);
      setShowScanSimulator(false);
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedLotId = lotId.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/.test(normalizedLotId)) {
      setErrorMsg(t.lot.invalidLotId);
      setErrorField('lotId');
      return;
    }
    if (!procurementCenter.trim()) {
      setErrorMsg(t.errors.centerRequired);
      setErrorField('center');
      return;
    }
    onProceed({
      lotId: normalizedLotId,
      procurementCenter: procurementCenter.trim(),
      farmerName: farmerName.trim() || t.lot.farmerUnknown,
      variety,
      sampleSize,
    });
  };

  return (
    <div className="stepper-screen-container">
      {/* Step Indicator Header */}
      <div className="stepper-header-badge">
        <span className="step-counter-pill">{t.workflow.lotStep}</span>
        <h2 className="step-main-title">🧅 {t.workflow.newAssessment}</h2>
      </div>

      <form onSubmit={handleSubmit} className="step-form-card" noValidate>
        {/* Lot ID Input */}
        <div className="form-field-group">
          <label htmlFor="lot-id-input" className="field-label">{t.lot.lotId}</label>
          <input
            id="lot-id-input"
            type="text"
            value={lotId}
            onChange={(e) => {
              setLotId(e.target.value);
              setErrorMsg('');
              setErrorField(null);
            }}
            placeholder={t.lot.lotIdPlaceholder}
            className="touch-text-input"
            required
            aria-invalid={errorField === 'lotId'}
            aria-describedby={errorField === 'lotId' ? 'lot-form-error' : undefined}
          />
        </div>

        {/* Supplier / farmer input */}
        <div className="form-field-group">
          <label htmlFor="farmer-name-input" className="field-label">
            {t.lot.farmerName}
          </label>
          <input
            id="farmer-name-input"
            type="text"
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            placeholder={t.lot.farmerNamePlaceholder}
            className="touch-text-input"
          />
        </div>

        {/* Procurement center */}
        <div className="form-field-group">
          <label htmlFor="procurement-center-input" className="field-label">{t.lot.procurementCenter}</label>
          <input
            id="procurement-center-input"
            type="text"
            value={procurementCenter}
            onChange={(e) => {
              setProcurementCenter(e.target.value);
              setErrorMsg('');
              setErrorField(null);
            }}
            placeholder={t.lot.procurementCenterPlaceholder}
            className="touch-text-input secondary-margin"
            required
            aria-invalid={errorField === 'center'}
            aria-describedby={errorField === 'center' ? 'lot-form-error' : undefined}
          />
        </div>

        {/* Sample size */}
        <div className="form-field-group">
          <label htmlFor="sample-size-input" className="field-label">{t.lot.sampleSize}</label>
          <input
            id="sample-size-input"
            type="number"
            min="1"
            max="500"
            step="1"
            value={sampleSize}
            onChange={(event) => setSampleSize(Math.max(1, Math.min(500, Number(event.target.value) || 1)))}
            className="touch-text-input"
            required
          />
        </div>

        <details className="optional-assessment-details">
          <summary>{t.workflow.moreDetails}</summary>
          <div className="scan-shortcut-box">
            <button
              type="button"
              className="giant-scan-btn"
              onClick={handleSimulateScan}
              disabled={showScanSimulator}
            >
              <QrCode size={32} strokeWidth={2.5} />
              <div className="scan-btn-text-col">
                <span className="scan-primary-text">{t.lot.scanQrBarcode}</span>
                <span className="scan-secondary-text">{t.lot.scanPrompt}</span>
              </div>
            </button>
            {showScanSimulator && <div className="scanner-active-banner"><span>{t.lot.scanPrompt}</span></div>}
          </div>
          <div className="preset-chips-row">
            {mandiPresets.map((mandi) => (
              <button
                key={mandi}
                type="button"
                className={`preset-chip-btn ${procurementCenter === mandi ? 'active' : ''}`}
                onClick={() => setProcurementCenter(mandi)}
              >
                {procurementCenter === mandi && <Check size={16} />}
                {mandi}
              </button>
            ))}
          </div>
          <div className="form-field-group">
            <label className="field-label">{t.lot.onionType}</label>
            <div className="variety-chips-grid">
              {(['red', 'white', 'yellow'] as const).map((onionVariety) => (
                <button
                  key={onionVariety}
                  type="button"
                  className={`variety-card ${variety === onionVariety ? 'selected' : ''}`}
                  onClick={() => setVariety(onionVariety)}
                >
                  <span className={`variety-color-dot ${onionVariety}`} />
                  <span className="variety-title">{onionVariety === 'red' ? t.lot.redOnion : onionVariety === 'white' ? t.lot.whiteOnion : t.lot.yellowOnion}</span>
                </button>
              ))}
            </div>
          </div>
        </details>

        {errorMsg && <p id="lot-form-error" className="validation-error-text" role="alert">{errorMsg}</p>}

        {/* Proceed Action Button */}
        <button type="submit" className="giant-action-btn primary-gradient">
          <span>{t.workflow.continue}</span>
          <ArrowRight size={24} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};
