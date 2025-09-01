import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  iosProductId: { type: String, default: '' },
  price: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  days: { type: Number, default: null },
  adLimit: { type: Number, default: null },
  features: {
    featured: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    boostDays: { type: Number, default: 0 },
    maxListings: { type: Number, default: 1 }
  },
  basePrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const priceRuleSchema = new mongoose.Schema({
  scope: { type: String, enum: ['category', 'city', 'area'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  price: { type: Number, required: true }
});

export const Package = mongoose.model('Package', packageSchema);
export const PriceRule = mongoose.model('PriceRule', priceRuleSchema);
