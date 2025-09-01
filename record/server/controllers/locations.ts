import { Request, Response } from 'express';
import { LocationCity, LocationArea, LocationCountry, LocationState } from '../models/Location';
import { Types } from 'mongoose';

export const getCities = async (_req: Request, res: Response) => {
  const cities = await LocationCity.find().sort({ name: 1 });
  res.json(cities);
};

export const adminGetCities = async (_req: Request, res: Response) => {
  const cities = await LocationCity.find().sort({ name: 1 });
  res.json({ ok: true, data: cities });
};

export const getAreas = async (req: Request, res: Response) => {
  const { cityId } = req.query as { cityId?: string };
  const filter: any = {};
  if (cityId) {
    if (!Types.ObjectId.isValid(String(cityId))) {
      return res.status(400).json({ message: 'Invalid cityId' });
    }
    filter.cityId = cityId;
  }
  const areas = await LocationArea.find(filter).sort({ name: 1 });
  res.json(areas);
};

export const adminGetAreas = async (req: Request, res: Response) => {
  const { cityId } = req.query as { cityId?: string };
  const filter: any = {};
  if (cityId) {
    if (!Types.ObjectId.isValid(String(cityId))) {
      return res.status(400).json({ ok: false, message: 'Invalid cityId' });
    }
    filter.cityId = cityId;
  }
  const areas = await LocationArea.find(filter).sort({ name: 1 });
  res.json({ ok: true, data: areas });
};

export const createCity = async (req: Request, res: Response) => {
  const { name, slug, state } = req.body;
  const city = new LocationCity({ name, slug, state });
  await city.save();
  res.status(201).json({ ok: true, data: city });
};

export const updateCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const city = await LocationCity.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: city });
};

export const deleteCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  await LocationCity.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};

export const createArea = async (req: Request, res: Response) => {
  const { cityId, name, slug, pincode } = req.body;
  const area = new LocationArea({ cityId, name, slug, pincode });
  await area.save();
  res.status(201).json({ ok: true, data: area });
};

export const updateArea = async (req: Request, res: Response) => {
  const { id } = req.params;
  const area = await LocationArea.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: area });
};

export const deleteArea = async (req: Request, res: Response) => {
  const { id } = req.params;
  await LocationArea.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};

export const adminGetCountries = async (_req: Request, res: Response) => {
  const countries = await LocationCountry.find().sort({ name: 1 });
  res.json({ ok: true, data: countries });
};

export const createCountry = async (req: Request, res: Response) => {
  const { name, slug, code } = req.body;
  const country = new LocationCountry({ name, slug, code });
  await country.save();
  res.status(201).json({ ok: true, data: country });
};

export const updateCountry = async (req: Request, res: Response) => {
  const { id } = req.params;
  const country = await LocationCountry.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: country });
};

export const deleteCountry = async (req: Request, res: Response) => {
  const { id } = req.params;
  await LocationCountry.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};

export const adminGetStates = async (req: Request, res: Response) => {
  const { countryId } = req.query as any;
  const filter: any = {};
  if (countryId) filter.countryId = countryId;
  const states = await LocationState.find(filter).sort({ name: 1 });
  res.json({ ok: true, data: states });
};

export const createState = async (req: Request, res: Response) => {
  const { countryId, name, slug } = req.body;
  const state = new LocationState({ countryId, name, slug });
  await state.save();
  res.status(201).json({ ok: true, data: state });
};

export const updateState = async (req: Request, res: Response) => {
  const { id } = req.params;
  const state = await LocationState.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ ok: true, data: state });
};

export const deleteState = async (req: Request, res: Response) => {
  const { id } = req.params;
  await LocationState.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
