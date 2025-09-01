import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String },
  position: { type: String, default: 'homepage' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bannerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Banner = mongoose.model('Banner', bannerSchema);
