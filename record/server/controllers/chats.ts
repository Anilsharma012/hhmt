import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ChatThread, ChatMessage } from '../models/Chat';
import { Listing } from '../models/Listing';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../realtime';

function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

function isParticipant(thread: any, userId: string) {
  return String(thread.buyerId) === String(userId) || String(thread.sellerId) === String(userId);
}

function otherUserId(thread: any, userId: string) {
  return String(thread.buyerId) === String(userId) ? String(thread.sellerId) : String(thread.buyerId);
}

function unreadFieldFor(thread: any, userId: string) {
  return String(thread.buyerId) === String(userId) ? 'buyerUnread' : 'sellerUnread';
}

export const openThread = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId } = req.body || {};
    if (!isValidObjectId(listingId)) return res.status(400).json({ message: 'Invalid listingId' });

    const listing = await Listing.findById(listingId).select('_id userId title');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const userId = String(req.user?._id);
    const sellerId = String((listing as any).userId);

    if (userId === sellerId) return res.status(400).json({ message: 'Cannot chat on own listing' });

    let thread = await ChatThread.findOne({ listingId, buyerId: userId, sellerId });
    if (!thread) {
      thread = await ChatThread.create({ listingId, buyerId: userId, sellerId, lastMessageAt: new Date(), lastMessage: '' });
    }

    res.json(thread);
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to open chat' });
  }
};

export const listThreads = async (req: AuthRequest, res: Response) => {
  try {
    const role = String((req.query.role || '').toString() || '');
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const userId = String(req.user?._id);

    const filter: any = {};
    if (role === 'buyer') filter.buyerId = userId;
    else if (role === 'seller') filter.sellerId = userId;
    else filter.$or = [{ buyerId: userId }, { sellerId: userId }];

    const [threads, total] = await Promise.all([
      ChatThread.find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('listingId', 'title images')
        .lean(),
      ChatThread.countDocuments(filter)
    ]);

    res.json({ data: threads, page, limit, total });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to list threads' });
  }
};

export const listMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid threadId' });

    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;

    const thread = await ChatThread.findById(id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (!isParticipant(thread, String(req.user?._id))) return res.status(403).json({ message: 'Forbidden' });

    const filter: any = { threadId: id };
    if (cursor && !isNaN(cursor.getTime())) filter.createdAt = { $lt: cursor };

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const nextCursor = messages.length === limit ? messages[messages.length - 1].createdAt : null;

    res.json({ data: messages, nextCursor });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to list messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid threadId' });

    const { text, attachments } = (req.body || {}) as { text?: string; attachments?: string[] };
    const safeText = (text || '').trim();
    const files = Array.isArray(attachments) ? attachments.filter((u) => typeof u === 'string') : [];

    if (!safeText && files.length === 0) return res.status(400).json({ message: 'Message cannot be empty' });
    if (safeText.length > 2000) return res.status(400).json({ message: 'Message too long' });
    if (files.length > 4) return res.status(400).json({ message: 'Too many attachments' });

    const thread = await ChatThread.findById(id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    const userId = String(req.user?._id);
    if (!isParticipant(thread, userId)) return res.status(403).json({ message: 'Forbidden' });

    const msg = await ChatMessage.create({
      threadId: id,
      senderId: userId,
      text: safeText,
      attachments: files,
      status: 'sent',
    });

    const otherId = otherUserId(thread, userId);
    const unreadField = unreadFieldFor(thread, otherId);

    await ChatThread.findByIdAndUpdate(id, {
      $set: { lastMessageAt: msg.createdAt, lastMessage: safeText || (files.length ? 'Sent a photo' : '') },
      $inc: { [unreadField]: 1 },
    });

    const io = getIO();
    if (io) {
      io.to(`thread:${id}`).emit('message:new', { message: msg });
      io.to(`user:${otherId}`).emit('message:new', { message: msg, threadId: id });
    }

    res.status(201).json(msg);
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to send message' });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid threadId' });

    const thread = await ChatThread.findById(id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const userId = String(req.user?._id);
    if (!isParticipant(thread, userId)) return res.status(403).json({ message: 'Forbidden' });

    const otherId = otherUserId(thread, userId);
    const myField = unreadFieldFor(thread, userId);

    await Promise.all([
      ChatMessage.updateMany({ threadId: id, senderId: otherId, status: { $ne: 'read' } }, { $set: { status: 'read' } }),
      ChatThread.findByIdAndUpdate(id, { $set: { [myField]: 0 } })
    ]);

    const io = getIO();
    if (io) io.to(`thread:${id}`).emit('message:read', { threadId: id, by: userId });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to mark as read' });
  }
};

export const unreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user?._id);
    const [a, b] = await Promise.all([
      ChatThread.aggregate([
        { $match: { buyerId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$buyerUnread' } } }
      ]),
      ChatThread.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$sellerUnread' } } }
      ])
    ]);
    const total = (a[0]?.total || 0) + (b[0]?.total || 0);
    res.json({ total });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to fetch unread count' });
  }
};
