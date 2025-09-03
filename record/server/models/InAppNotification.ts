import { mongoose } from '../utils/database';

const inAppNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String },
  deepLink: { type: String },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const InAppNotification = mongoose.models.InAppNotification || mongoose.model('InAppNotification', inAppNotificationSchema);
