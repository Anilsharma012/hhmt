import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, maxlength: 180 },
  answer: { type: String, required: true, maxlength: 4000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  sortOrder: { type: Number, default: 0 },
  category: { type: String },
  showInFooter: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

faqSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  if (this.isNew && (!this.sortOrder || this.sortOrder === 0)) {
    const latest = await Faq.findOne({}).sort({ sortOrder: -1 }).select('sortOrder').lean();
    (this as any).sortOrder = (latest?.sortOrder || 0) + 1;
  }
  next();
});

export const Faq = mongoose.model('Faq', faqSchema);
