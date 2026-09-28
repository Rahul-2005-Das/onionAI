export type OnionVariety = 'red' | 'white' | 'yellow';

export type UserRole = 'inspector' | 'farmer' | 'admin';

export type OverallGrade = 'Grade A' | 'Grade B' | 'URS' | 'Unclassified';

export interface DefectCounts {
  healthy: number;
  sprouted: number;
  rotten: number;
  damaged: number;
  undersized: number;
}

export interface DetectedOnion {
  id: string;
  x: number; // percentage
  y: number; // percentage
  radius: number;
  type: 'healthy' | 'sprouted' | 'rotten' | 'damaged' | 'undersized';
  confidence: number;
}

export interface AssessmentRecord {
  id: string;
  lotId: string;
  farmerName: string;
  mandi: string;
  variety: OnionVariety;
  sampleSize: number;
  timestamp: string;
  dateFormatted: string;
  inspectorName: string;
  defects: DefectCounts;
  totalCount: number;
  unclassifiedCount?: number;
  gradeAPercent: number;
  gradeBPercent: number;
  ursPercent: number;
  qualityScore: number;
  overallGrade: OverallGrade;
  imageUrl?: string;
  inferenceMode?: 'demo' | 'model';
  detectedOnions?: DetectedOnion[];
  storageVerdict: 'pass' | 'fail' | 'unclassified';
  gradingRulesOfficial?: boolean;
  gradingRulesVersion?: string;
  percentages?: Record<string, number>;
}
