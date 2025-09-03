import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  contentHtml: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  showInFooter: { type: Boolean, default: true },
  footerOrder: { type: Number, default: 1, min: 1, max: 10 },
  seoTitle: { type: String },
  seoDescription: { type: String },
  ogImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: null },
});

pageSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  this.updatedAt = new Date();
  if (this.isModified('status')) {
    if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
    if (this.status === 'draft') this.publishedAt = null;
  }
  next();
});

export const Page = mongoose.model('Page', pageSchema);
