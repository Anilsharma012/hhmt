import { Request, Response } from 'express';
import { Category, Subcategory } from '../models/Category';

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const adminGetCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    res.json({ ok: true, data: categories });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const subcategories = await Subcategory.find({
      categoryId,
      isActive: true
    });
    res.json(subcategories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const adminListSubcategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query as any;
    const filter: any = {};
    if (categoryId) filter.categoryId = categoryId;
    const subcategories = await Subcategory.find(filter);
    res.json({ ok: true, data: subcategories });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

// Admin CRUD
export const createCategory = async (req: Request, res: Response) => {
  const { name, slug, icon } = req.body || {};
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(400).json({ ok: false, message: 'Slug exists' });
  const cat = new Category({ name, slug, icon, isActive: true });
  await cat.save();
  res.status(201).json({ ok: true, data: cat });
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cat = await Category.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: cat });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Category.findByIdAndDelete(id);
  await Subcategory.deleteMany({ categoryId: id });
  res.json({ ok: true, data: { deleted: true } });
};

export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const { categoryId, name, slug } = req.body || {};
    if (!name || !slug) {
      return res.status(400).json({ ok: false, message: 'name and slug are required' });
    }
    const sub = new Subcategory({ categoryId, name, slug, isActive: true });
    await sub.save();
    res.status(201).json({ ok: true, data: sub });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const updateSubcategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const sub = await Subcategory.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: sub });
};

export const deleteSubcategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Subcategory.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
