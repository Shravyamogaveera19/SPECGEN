import mongoose, { Schema, Document, Model } from 'mongoose';

export interface GeneratedDocumentDoc extends Document {
  owner: string;
  repo: string;
  branch: string;
  requirements: string;
  design: string;
  testPlan: string;
  deployment: string;
  analysis?: any;
  createdAt: Date;
}

const GeneratedDocumentSchema = new Schema<GeneratedDocumentDoc>({
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  branch: { type: String, required: true },
  requirements: { type: String, required: true },
  design: { type: String, required: true },
  testPlan: { type: String, required: true },
  deployment: { type: String, required: true },
  analysis: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const GeneratedDocument: Model<GeneratedDocumentDoc> =
  mongoose.models.GeneratedDocument ||
  mongoose.model<GeneratedDocumentDoc>('GeneratedDocument', GeneratedDocumentSchema);
