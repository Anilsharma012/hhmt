import type { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { ChatMessage, ChatThread } from './models/Chat';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

let io: Server | null = null;

export function getIO() {
  return io;
}

function parseUserIdFromHandshake(handshake: any): string | null {
  try {
    const cookies = handshake.headers?.cookie ? cookie.parse(handshake.headers.cookie) : {} as Record<string, string>;
    const token = cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId || null;
    }
  } catch {}
  try {
    const raw = handshake.headers['x-dev-user'];
    if (typeof raw === 'string' && raw) {
      const parsed = JSON.parse(raw);
      const id = parsed._id || parsed.id;
      if (typeof id === 'string') return id;
    }
  } catch {}
  return null;
}

export function initRealtime(server: HTTPServer) {
  io = new Server(server, {
    path: '/realtime',
    cors: { origin: true, credentials: true }
  });

  io.on('connection', (socket) => {
    const userId = parseUserIdFromHandshake(socket.handshake);
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);

    socket.on('thread:join', (threadId: string) => {
      if (!mongoose.Types.ObjectId.isValid(threadId)) return;
      socket.join(`thread:${threadId}`);
    });

    socket.on('typing:start', (threadId: string) => {
      socket.to(`thread:${threadId}`).emit('typing:start', { threadId, userId });
    });
    socket.on('typing:stop', (threadId: string) => {
      socket.to(`thread:${threadId}`).emit('typing:stop', { threadId, userId });
    });

    socket.on('message:send', async (payload: { threadId: string; text?: string; attachments?: string[] }) => {
      try {
        const { threadId, text, attachments } = payload || {} as any;
        if (!mongoose.Types.ObjectId.isValid(threadId)) return;
        const thread = await ChatThread.findById(threadId);
        if (!thread) return;
        if (String(thread.buyerId) !== String(userId) && String(thread.sellerId) !== String(userId)) return;

        const safeText = (text || '').trim();
        const files = Array.isArray(attachments) ? attachments.filter((u) => typeof u === 'string') : [];
        if (!safeText && files.length === 0) return;

        const msg = await ChatMessage.create({ threadId, senderId: userId, text: safeText, attachments: files, status: 'sent' });

        const otherId = String(thread.buyerId) === String(userId) ? String(thread.sellerId) : String(thread.buyerId);
        const unreadField = String(thread.buyerId) === String(otherId) ? 'buyerUnread' : 'sellerUnread';

        await ChatThread.findByIdAndUpdate(threadId, {
          $set: { lastMessageAt: msg.createdAt, lastMessage: safeText || (files.length ? 'Sent a photo' : '') },
          $inc: { [unreadField]: 1 },
        });

        io?.to(`thread:${threadId}`).emit('message:new', { message: msg });
        io?.to(`user:${otherId}`).emit('message:new', { message: msg, threadId });
      } catch {}
    });

    socket.on('message:delivered', async (threadId: string) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(threadId)) return;
        await ChatMessage.updateMany({ threadId, senderId: { $ne: userId }, status: 'sent' }, { $set: { status: 'delivered' } });
        io?.to(`thread:${threadId}`).emit('message:delivered', { threadId, by: userId });
      } catch {}
    });

    socket.on('disconnect', () => {});
  });

  return io;
}
