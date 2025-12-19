import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ValidationResultDoc extends Document {
  owner: string;
  repo: string;
  branch: string;
  exists: boolean;
  accessible: boolean;
  hasCode: boolean;
  codeMetrics: {
    fileCount: number;
    languages: string[];
    primaryLanguage: string;
    languagePercentages?: Record<string, number>;
    hasTests: boolean;
    hasReadme: boolean;
    hasLicense: boolean;
    hasCI: boolean;
    hasDockerfile: boolean;
    configFiles: string[];
    qualityScore: number;
    projectType: string;
  };
  reason?: string;
  createdAt: Date;
}

const ValidationResultSchema = new Schema<ValidationResultDoc>({
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  branch: { type: String, required: true },
  exists: { type: Boolean, required: true },
  accessible: { type: Boolean, required: true },
  hasCode: { type: Boolean, required: true },
  codeMetrics: {
    fileCount: { type: Number, required: true },
    languages: [{ type: String, required: true }],
    primaryLanguage: { type: String, required: true },
    languagePercentages: { type: Object },
    hasTests: { type: Boolean, required: true },
    hasReadme: { type: Boolean, required: true },
    hasLicense: { type: Boolean, required: true },
    hasCI: { type: Boolean, required: true },
    hasDockerfile: { type: Boolean, required: true },
    configFiles: [{ type: String, required: true }],
    qualityScore: { type: Number, required: true },
    projectType: { type: String, required: true },
  },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const ValidationResult: Model<ValidationResultDoc> =
  mongoose.models.ValidationResult ||
  mongoose.model<ValidationResultDoc>('ValidationResult', ValidationResultSchema);
