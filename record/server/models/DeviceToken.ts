import { mongoose } from '../utils/database';

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, enum: ['web','android','ios'], required: true },
  fcmToken: { type: String, required: true, unique: true },
  lastSeenAt: { type: Date, default: () => new Date() },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const DeviceToken = mongoose.models.DeviceToken || mongoose.model('DeviceToken', deviceTokenSchema);
