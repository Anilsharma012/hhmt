import { AuthRequest } from '../middleware/auth';
import { DeviceToken } from '../models/DeviceToken';
import { Notification } from '../models/Notification';
import { InAppNotification } from '../models/InAppNotification';
import { sendPushToTokens } from '../utils/fcm';

export async function registerDevice(req: AuthRequest, res: Response) {
  try {
    const { platform, fcmToken } = (req.body || {}) as any;
    if (!req.user?._id) return res.status(401).json({ message: 'Auth required' });
    if (!platform || !fcmToken) return res.status(400).json({ message: 'platform and fcmToken required' });
    const dt = await DeviceToken.findOneAndUpdate({ fcmToken }, { userId: req.user._id, platform, fcmToken, isActive: true, lastSeenAt: new Date() }, { upsert: true, new: true });
    res.json({ ok: true, data: dt });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to register device' });
  }
}

export async function unregisterDevice(req: AuthRequest, res: Response) {
  try {
    const { fcmToken } = (req.body || {}) as any;
    if (!req.user?._id) return res.status(401).json({ message: 'Auth required' });
    if (!fcmToken) return res.status(400).json({ message: 'fcmToken required' });
    await DeviceToken.findOneAndUpdate({ fcmToken, userId: req.user._id }, { isActive: false, lastSeenAt: new Date() });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to unregister device' });
  }
}

export async function sendAdminNotification(req: AuthRequest, res: Response) {
  try {
    if (!req.user?._id || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin required' });
    const { segment, userIds = [], title, message, imageUrl, adId } = (req.body || {}) as any;

    if (!title || !message) return res.status(400).json({ ok: false, message: 'Title and message are required' });
    if (String(title).length > 60) return res.status(400).json({ ok: false, message: 'Title too long' });
    if (String(message).length > 200) return res.status(400).json({ ok: false, message: 'Message too long' });

    let tokens: { userId: string; token: string }[] = [];
    if (segment === 'all') {
      const docs = await DeviceToken.find({ isActive: true }).select('userId fcmToken');
      tokens = docs.map(d => ({ userId: String(d.userId), token: d.fcmToken }));
    } else {
      const ids = (Array.isArray(userIds) ? userIds : []).map(String);
      if (ids.length === 0) return res.status(400).json({ ok: false, message: 'No recipients selected' });
      const docs = await DeviceToken.find({ isActive: true, userId: { $in: ids } }).select('userId fcmToken');
      tokens = docs.map(d => ({ userId: String(d.userId), token: d.fcmToken }));
    }

    const deepLink = adId ? `/listing/${adId}` : undefined;

    const uniqueTokens = Array.from(new Map(tokens.map(t => [t.token, t])).values());
    const tokenStrings = uniqueTokens.map(t => t.token);

    const resp = await sendPushToTokens(tokenStrings, { title, body: message, imageUrl, deepLink, adId });

    // Deactivate invalid tokens
    if (resp.failedTokens?.length) {
      await DeviceToken.updateMany({ fcmToken: { $in: resp.failedTokens } }, { isActive: false });
    }

    // Store Notification
    const notif = await Notification.create({
      title, message, imageUrl, deepLink, segment: segment === 'selected' ? 'selected' : 'all',
      targetUserIds: segment === 'selected' ? uniqueTokens.map(t => t.userId) : [],
      sentAt: new Date(), stats: { success: resp.success, failed: resp.failed }, createdBy: req.user._id,
    });

    // Create in-app notifications per user
    const byUser: Record<string, boolean> = {};
    for (const t of uniqueTokens) {
      if (byUser[t.userId]) continue; byUser[t.userId] = true;
      await InAppNotification.create({ userId: t.userId, title, message, imageUrl, deepLink });
    }

    res.json({ ok: true, success: resp.success, failed: resp.failed, total: tokenStrings.length, id: notif._id });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || 'Failed to send' });
  }
}

export async function adminListNotifications(req: AuthRequest, res: Response) {
  try {
    const { search = '' } = req.query as any;
    const page = Math.max(parseInt(String((req.query as any).page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String((req.query as any).limit || '20'), 10) || 20, 1), 100);
    const q: any = {};
    if (search) q.$or = [{ title: { $regex: String(search), $options: 'i' } }, { message: { $regex: String(search), $options: 'i' } }];
    const total = await Notification.countDocuments(q);
    const items = await Notification.find(q).sort('-createdAt').skip((page-1)*limit).limit(limit);
    res.json({ data: items, total, page, limit });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to list' });
  }
}

export async function adminDeleteNotification(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as any;
    await Notification.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to delete' });
  }
}

export async function listMyInApp(req: AuthRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Auth required' });
    const page = Math.max(parseInt(String((req.query as any).page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String((req.query as any).limit || '20'), 10) || 20, 1), 100);
    const total = await InAppNotification.countDocuments({ userId: req.user._id });
    const items = await InAppNotification.find({ userId: req.user._id }).sort('-createdAt').skip((page-1)*limit).limit(limit);
    const unread = await InAppNotification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ data: items, total, page, limit, unread });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to list' });
  }
}

export async function markInAppRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Auth required' });
    const { id } = req.params as any;
    await InAppNotification.findOneAndUpdate({ _id: id, userId: req.user._id }, { isRead: true });
    const unread = await InAppNotification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ ok: true, unread });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to mark read' });
  }
}
