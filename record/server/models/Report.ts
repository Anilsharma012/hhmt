import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'reviewing', 'resolved', 'rejected'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

export const Report = mongoose.model('Report', reportSchema);
