import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Order } from '../models/Order';

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId, price, cityId, areaId } = req.body || {};

    if (!Types.ObjectId.isValid(String(packageId))) {
      return res.status(400).json({ message: 'Invalid packageId' });
    }
    if (cityId && !Types.ObjectId.isValid(String(cityId))) {
      return res.status(400).json({ message: 'Invalid cityId' });
    }
    if (areaId && !Types.ObjectId.isValid(String(areaId))) {
      return res.status(400).json({ message: 'Invalid areaId' });
    }

    const order = new Order({ userId: req.user?._id, packageId, price, cityId, areaId, status: 'paid' });
    await order.save();
    res.json({ status: 'paid', orderId: order._id });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Checkout failed' });
  }
};

export const webhook = async (_req: AuthRequest, res: Response) => {
  res.json({ received: true });
};
