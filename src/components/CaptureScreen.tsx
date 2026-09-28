import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

interface CaptureScreenProps {
  onAnalyze: (image: File) => void;
  simpleMode: boolean;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({ onAnalyze }) => {
  const { t } = useLanguage();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    event.target.value = '';
    if (!photo) return;

    const extension = photo.name.toLowerCase().slice(photo.name.lastIndexOf('.'));
    if (!ALLOWED_TYPES.includes(photo.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      setError(t.api.unsupportedImage);
      return;
    }
    if (photo.size > MAX_IMAGE_BYTES) {
      setError(t.api.imageTooLarge);
      return;
    }

    setError(null);
    setSelectedPhoto(photo);
    setPreviewUrl(URL.createObjectURL(photo));
  };

  const handleRetake = () => {
    setSelectedPhoto(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="stepper-screen-container photo-workflow-screen">
      <div className="stepper-header-badge">
        <span className="step-counter-pill">{selectedPhoto ? t.workflow.previewStep : t.workflow.photoStep}</span>
        <h2 className="step-main-title">{selectedPhoto ? t.workflow.previewTitle : t.workflow.imageTitle}</h2>
        {!selectedPhoto && <p className="step-main-subtitle">{t.workflow.imageInstruction}</p>}
      </div>

      <div className="step-form-card photo-workflow-card">
        {selectedPhoto && previewUrl ? (
          <>
            <div className="photo-preview-frame">
              <img src={previewUrl} alt={t.workflow.previewTitle} className="photo-preview-image" />
            </div>
            {error && <p className="validation-error-text" role="alert">{error}</p>}
            <div className="photo-preview-actions">
              <button type="button" className="photo-secondary-action" onClick={handleRetake}>
                <RotateCcw size={28} aria-hidden="true" />
                <span>{t.workflow.retake}</span>
              </button>
              <button type="button" className="photo-primary-action" onClick={() => onAnalyze(selectedPhoto)}>
                <Check size={30} strokeWidth={3} aria-hidden="true" />
                <span>{t.workflow.usePhoto}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="photo-viewfinder-guide" aria-hidden="true">
              <span className="viewfinder-corner top-left" />
              <span className="viewfinder-corner top-right" />
              <span className="viewfinder-corner bottom-left" />
              <span className="viewfinder-corner bottom-right" />
              <span className="viewfinder-onion">🧅</span>
            </div>
            {error && <p className="validation-error-text" role="alert">{error}</p>}
            <div className="photo-capture-actions">
              <button type="button" className="photo-primary-action" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={34} strokeWidth={2.5} aria-hidden="true" />
                <span>{t.workflow.takePhoto}</span>
              </button>
              <button type="button" className="photo-secondary-action" onClick={() => uploadInputRef.current?.click()}>
                <ImagePlus size={34} strokeWidth={2.5} aria-hidden="true" />
                <span>{t.workflow.choosePhoto}</span>
              </button>
              <input
                ref={cameraInputRef}
                className="visually-hidden-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                capture="environment"
                onChange={handlePhotoSelected}
                aria-label={t.workflow.takePhoto}
              />
              <input
                ref={uploadInputRef}
                className="visually-hidden-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={handlePhotoSelected}
                aria-label={t.workflow.choosePhoto}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};