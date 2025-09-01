import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Analytics = mongoose.model('Analytics', analyticsSchema);
