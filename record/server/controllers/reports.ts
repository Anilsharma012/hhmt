import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { ReportReason } from '../models/ReportReason';
import { AuthRequest } from '../middleware/auth';

export const createReport = async (req: AuthRequest, res: Response) => {
  const { listingId, reason } = req.body || {};
  const report = new Report({ listingId, reason, reporterId: req.user?._id });
  await report.save();
  res.status(201).json({ ok: true, data: report });
};

export const listReports = async (_req: Request, res: Response) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.json({ ok: true, data: reports });
};

export const updateReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const report = await Report.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: report });
};

export const deleteReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Report.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};

// Report reasons CRUD
export const adminListReportReasons = async (_req: Request, res: Response) => {
  const reasons = await ReportReason.find().sort({ name: 1 });
  res.json({ ok: true, data: reasons });
};

export const createReportReason = async (req: Request, res: Response) => {
  const { name, slug, isActive } = req.body || {};
  const reason = new ReportReason({ name, slug, isActive });
  await reason.save();
  res.status(201).json({ ok: true, data: reason });
};

export const updateReportReason = async (req: Request, res: Response) => {
  const { id } = req.params;
  const reason = await ReportReason.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: reason });
};

export const deleteReportReason = async (req: Request, res: Response) => {
  const { id } = req.params;
  await ReportReason.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
