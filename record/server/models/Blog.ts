import { mongoose } from '../utils/database';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 240 },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  imageUrl: { type: String, default: '' },
  tags: { type: [String], default: [] },
  descriptionHtml: { type: String, required: true },
  excerpt: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  publishedAt: { type: Date },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

blogSchema.pre('validate', function(next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (this.descriptionHtml) {
    const text = String(this.descriptionHtml).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const len = Math.min(200, Math.max(160, text.length));
    this.excerpt = text.slice(0, len);
  }
  if (this.isModified('status')) {
    if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
    if (this.status === 'draft') this.publishedAt = undefined;
  }
  next();
});

export const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
