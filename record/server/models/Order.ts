import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  price: { type: Number, required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCity' },
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationArea' },
  status: { type: String, enum: ['paid', 'pending'], default: 'paid' },
  createdAt: { type: Date, default: Date.now }
});

export const Order = mongoose.model('Order', orderSchema);
