import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessageAt: { type: Date, default: Date.now },
  lastMessage: { type: String, default: '' },
  buyerUnread: { type: Number, default: 0 },
  sellerUnread: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Unique thread per listing + buyer + seller
chatThreadSchema.index({ listingId: 1, buyerId: 1, sellerId: 1 }, { unique: true });
chatThreadSchema.index({ buyerId: 1, lastMessageAt: -1 });
chatThreadSchema.index({ sellerId: 1, lastMessageAt: -1 });

const chatMessageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' , maxlength: 2000 },
  attachments: { type: [String], default: [] },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  deletedFor: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  createdAt: { type: Date, default: Date.now }
});

chatMessageSchema.index({ threadId: 1, createdAt: -1 });

export const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
