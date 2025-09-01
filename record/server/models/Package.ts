import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
