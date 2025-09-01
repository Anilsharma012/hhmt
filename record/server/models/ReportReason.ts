import mongoose from 'mongoose';

const reportReasonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const ReportReason = mongoose.model('ReportReason', reportReasonSchema);
