import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '' },
  image: { type: String, default: '' },
  description: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const subcategorySchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Category = mongoose.model('Category', categorySchema);
export const Subcategory = mongoose.model('Subcategory', subcategorySchema);
