import { mongoose } from '../utils/database';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String },
  deepLink: { type: String },
  segment: { type: String, enum: ['all','selected'], required: true },
  targetUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  sentAt: { type: Date },
  stats: {
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
