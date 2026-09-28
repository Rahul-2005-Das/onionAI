import type { DefectCounts, DetectedOnion, OverallGrade } from './assessment';

export type InferenceMode = 'demo' | 'model';

export interface QualityCalculation {
  total: number;
  counts: DefectCounts;
  unclassifiedCount: number;
  percentages: Record<string, number>;
  gradeAPercent: number;
  gradeBPercent: number;
  ursPercent: number;
  qualityScore: number;
  finalGrade: OverallGrade;
  storageVerdict: 'pass' | 'fail' | 'unclassified';
  gradingRulesOfficial: boolean;
  gradingRulesVersion: string;
}

export interface OnionAnalysisResult extends QualityCalculation {
  detections: DetectedOnion[];
  mode: InferenceMode;
}