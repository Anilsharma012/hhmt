import { Request, Response } from 'express';
import { Package, PriceRule } from '../models/Package';

export const listPackages = async (_req: Request, res: Response) => {
  const packs = await Package.find({ isActive: true }).sort({ basePrice: 1 });
  res.json(packs);
};

export const adminListPackages = async (_req: Request, res: Response) => {
  const packs = await Package.find().sort({ basePrice: 1 });
  res.json({ ok: true, data: packs });
};

export const listPricingRules = async (req: Request, res: Response) => {
  const { scope, refId, packageId } = req.query as any;
  const filter: any = {};
  if (scope) filter.scope = scope;
  if (refId) filter.refId = refId;
  if (packageId) filter.packageId = packageId;
  const rules = await PriceRule.find(filter);
  res.json(rules);
};

export const adminListPricingRules = async (req: Request, res: Response) => {
  const { scope, refId, packageId } = req.query as any;
  const filter: any = {};
  if (scope) filter.scope = scope;
  if (refId) filter.refId = refId;
  if (packageId) filter.packageId = packageId;
  const rules = await PriceRule.find(filter);
  res.json({ ok: true, data: rules });
};

export const createPackage = async (req: Request, res: Response) => {
  const pack = new Package(req.body);
  await pack.save();
  res.status(201).json({ ok: true, data: pack });
};

export const updatePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pack = await Package.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: pack });
};

export const deletePackage = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Package.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};

export const createPriceRule = async (req: Request, res: Response) => {
  const rule = new PriceRule(req.body);
  await rule.save();
  res.status(201).json({ ok: true, data: rule });
};

export const updatePriceRule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const rule = await PriceRule.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: rule });
};

export const deletePriceRule = async (req: Request, res: Response) => {
  const { id } = req.params;
  await PriceRule.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
