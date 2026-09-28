import type { DetectedOnion, DefectCounts } from '../types/assessment';
import type { InferenceMode, OnionAnalysisResult, QualityCalculation } from '../types/inference';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 40_000;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export const CATEGORIES = ['healthy', 'damaged', 'rotten', 'sprouted', 'undersized'] as const;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export class OnionAnalysisError extends Error {
  readonly reason: 'invalidImage' | 'imageTooLarge' | 'unsupportedImage' | 'serviceUnavailable' | 'timedOut' | 'analysisFailed' | 'calculationFailed' | 'invalidResponse';

  constructor(reason: OnionAnalysisError['reason']) {
    super(reason);
    this.name = 'OnionAnalysisError';
    this.reason = reason;
  }
}

function isNumberInRange(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum;
}

function parseCalculation(value: unknown): QualityCalculation {
  if (!value || typeof value !== 'object') throw new OnionAnalysisError('invalidResponse');
  const response = value as Record<string, unknown>;
  const counts = {} as DefectCounts;
  for (const category of CATEGORIES) {
    const count = response[category];
    if (!Number.isSafeInteger(count) || (count as number) < 0) throw new OnionAnalysisError('invalidResponse');
    counts[category] = count as number;
  }

  if (
    !Number.isSafeInteger(response.total)
    || (response.total as number) < 0
    || CATEGORIES.reduce((sum, category) => sum + counts[category], 0) > (response.total as number)
    || !Number.isSafeInteger(response.unclassified_count)
    || (response.unclassified_count as number) < 0
    || CATEGORIES.reduce((sum, category) => sum + counts[category], 0) + (response.unclassified_count as number) !== response.total
    || !isNumberInRange(response.grade_a_percentage, 100)
    || !isNumberInRange(response.grade_b_percentage, 100)
    || !isNumberInRange(response.urs_percentage, 100)
    || !isNumberInRange(response.quality_score, 100)
    || !response.percentages || typeof response.percentages !== 'object'
    || !['Grade A', 'Grade B', 'URS', 'Unclassified'].includes(response.final_grade as string)
    || !['pass', 'fail', 'unclassified'].includes(response.storage_verdict as string)
    || typeof response.grading_rules_official !== 'boolean'
    || typeof response.grading_rules_version !== 'string'
  ) {
    throw new OnionAnalysisError('invalidResponse');
  }

  const percentages = response.percentages as Record<string, unknown>;
  const parsedPercentages: Record<string, number> = {};
  for (const key of [...CATEGORIES, 'unclassified']) {
    if (!isNumberInRange(percentages[key], 100)) throw new OnionAnalysisError('invalidResponse');
    parsedPercentages[key] = percentages[key] as number;
  }
  if (Object.values(parsedPercentages).reduce((sum, percentage) => sum + percentage, 0) !== 100 && response.total !== 0) {
    throw new OnionAnalysisError('invalidResponse');
  }

  return {
    total: response.total as number,
    counts,
    unclassifiedCount: response.unclassified_count as number,
    percentages: parsedPercentages,
    gradeAPercent: response.grade_a_percentage as number,
    gradeBPercent: response.grade_b_percentage as number,
    ursPercent: response.urs_percentage as number,
    qualityScore: response.quality_score as number,
    finalGrade: response.final_grade as QualityCalculation['finalGrade'],
    storageVerdict: response.storage_verdict as QualityCalculation['storageVerdict'],
    gradingRulesOfficial: response.grading_rules_official,
    gradingRulesVersion: response.grading_rules_version,
  };
}

function parseResponse(value: unknown): OnionAnalysisResult {
  if (!value || typeof value !== 'object') throw new OnionAnalysisError('invalidResponse');
  const response = value as Record<string, unknown>;
  const calculation = parseCalculation(value);
  if ((response.mode !== 'demo' && response.mode !== 'model') || !Array.isArray(response.detections)) {
    throw new OnionAnalysisError('invalidResponse');
  }

  const detections: DetectedOnion[] = response.detections.map((item, index) => {
    if (!item || typeof item !== 'object') throw new OnionAnalysisError('invalidResponse');
    const detection = item as Record<string, unknown>;
    const bbox = detection.bbox;
    if (
      !CATEGORIES.includes(detection.category as typeof CATEGORIES[number])
      || !isNumberInRange(detection.confidence, 1)
      || !Array.isArray(bbox)
      || bbox.length !== 4
      || !bbox.every((coordinate) => isNumberInRange(coordinate, 1))
    ) {
      throw new OnionAnalysisError('invalidResponse');
    }
    const [x, y, width, height] = bbox as number[];
    if (x + width > 1 || y + height > 1) throw new OnionAnalysisError('invalidResponse');
    return {
      id: `${index}`,
      type: detection.category as DetectedOnion['type'],
      confidence: Math.round((detection.confidence as number) * 100),
      x: (x + width / 2) * 100,
      y: (y + height / 2) * 100,
      radius: Math.max(8, Math.min(22, Math.round(Math.max(width, height) * 100))),
    };
  });

  return {
    ...calculation,
    detections,
    mode: response.mode as InferenceMode,
  };
}

export async function calculateOnionCounts(
  total: number,
  counts: DefectCounts,
): Promise<QualityCalculation> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/assessments/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total, ...counts }),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) throw new OnionAnalysisError('timedOut');
      throw new OnionAnalysisError('serviceUnavailable');
    }
    if (!response.ok) {
      if (response.status >= 500) throw new OnionAnalysisError('analysisFailed');
      throw new OnionAnalysisError('calculationFailed');
    }
    try {
      return parseCalculation(await response.json());
    } catch (error) {
      if (error instanceof OnionAnalysisError) throw error;
      throw new OnionAnalysisError('invalidResponse');
    }
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function analyzeOnionImage(image: File): Promise<OnionAnalysisResult> {
  const extension = image.name.toLowerCase().slice(image.name.lastIndexOf('.'));
  if (!ALLOWED_TYPES.includes(image.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new OnionAnalysisError('unsupportedImage');
  }
  if (image.size > MAX_IMAGE_BYTES) throw new OnionAnalysisError('imageTooLarge');

  const formData = new FormData();
  formData.append('image', image, image.name || 'onion-sample');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/assessments/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) throw new OnionAnalysisError('timedOut');
      throw new OnionAnalysisError('serviceUnavailable');
    }

    if (!response.ok) {
      if (response.status === 413) throw new OnionAnalysisError('imageTooLarge');
      if (response.status === 415) throw new OnionAnalysisError('unsupportedImage');
      if (response.status === 400) throw new OnionAnalysisError('invalidImage');
      if (response.status === 504) throw new OnionAnalysisError('timedOut');
      if (response.status >= 500) throw new OnionAnalysisError('analysisFailed');
      throw new OnionAnalysisError('invalidResponse');
    }

    try {
      return parseResponse(await response.json());
    } catch (error) {
      if (error instanceof OnionAnalysisError) throw error;
      throw new OnionAnalysisError('invalidResponse');
    }
  } finally {
    window.clearTimeout(timeout);
  }
}