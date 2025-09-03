import { Request, Response } from 'express';
import { LocationCity, LocationArea, LocationCountry, LocationState } from '../models/Location';
import { Types } from 'mongoose';
import { parseCSV, toCSV } from '../utils/csv';
import { bumpVersion } from '../utils/cacheVersion';

const PAGE_SIZE_DEFAULT = 20;
const MAX_LIMIT = 200;

function parsePaging(req: Request) {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function like(q?: string) {
  return q ? { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } : undefined;
}

const pubCache = new Map<string, { at: number; data: any }>();
const TEN_MIN = 10 * 60 * 1000;
function cacheGet(key: string) { const v = pubCache.get(key); return v && Date.now() - v.at < TEN_MIN ? v.data : null; }
function cacheSet(key: string, data: any) { pubCache.set(key, { at: Date.now(), data }); }
function invalidateLocations() { pubCache.clear(); bumpVersion('locations'); }

// ADMIN COUNTRIES
export async function adminListCountries(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req);
  const { search, sort } = req.query as any;
  const filter: any = {};
  if (search) {
    const rx = like(String(search));
    filter.$or = [{ name: rx }, { iso2: rx }, { iso3: rx }];
  }
  const [items, total] = await Promise.all([
    LocationCountry.find(filter).sort(sort || { name: 1 }).skip(skip).limit(limit),
    LocationCountry.countDocuments(filter),
  ]);
  res.json({ data: items, total, page, limit });
}

export async function adminCreateCountry(req: Request, res: Response) {
  const { name, iso2, iso3, phoneCode, currency, flag, isActive } = req.body || {};
  if (!name?.trim() || !iso2 || String(iso2).length !== 2) return res.status(400).json({ message: 'Invalid payload' });
  try {
    const doc = await LocationCountry.create({ name: name.trim(), iso2: String(iso2).toUpperCase(), iso3, phoneCode, currency, flag: flag || String(iso2).toUpperCase(), isActive: isActive !== false });
    invalidateLocations();
    res.status(201).json(doc);
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Duplicate country' });
    res.status(500).json({ message: 'Failed to create country' });
  }
}

export async function adminUpdateCountry(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const doc = await LocationCountry.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    invalidateLocations();
    res.json(doc);
  } catch {
    res.status(500).json({ message: 'Failed to update country' });
  }
}

export async function adminDeleteCountry(req: Request, res: Response) {
  const { id } = req.params;
  const cascade = String(req.query.cascade || 'false') === 'true';
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const statesCount = await LocationState.countDocuments({ countryId: id });
  if (statesCount > 0 && !cascade) return res.status(409).json({ message: 'Country has states' });
  if (cascade) {
    const stateIds = (await LocationState.find({ countryId: id }, { _id: 1 })).map(s => s._id);
    const cityIds = (await LocationCity.find({ stateId: { $in: stateIds } }, { _id: 1 })).map(c => c._id);
    await Promise.all([
      LocationArea.deleteMany({ cityId: { $in: cityIds } }),
      LocationCity.deleteMany({ stateId: { $in: stateIds } }),
      LocationState.deleteMany({ countryId: id }),
    ]);
  }
  await LocationCountry.findByIdAndDelete(id);
  invalidateLocations();
  res.json({ ok: true });
}

export async function adminImportCountries(req: Request, res: Response) {
  try {
    const rows: any[] = await extractRows(req);
    let inserted = 0, skipped = 0; const errors: string[] = [];
    for (const r of rows) {
      const name = (r.name || '').trim();
      const iso2 = String(r.iso2 || '').toUpperCase();
      if (!name || iso2.length !== 2) { skipped++; continue; }
      try {
        await LocationCountry.updateOne({ iso2 }, { $setOnInsert: { name, iso2 }, $set: {
          iso3: r.iso3 || undefined, phoneCode: r.phoneCode || undefined, currency: r.currency || undefined, flag: r.flag || iso2, isActive: true,
        } }, { upsert: true });
        inserted++;
      } catch (e: any) {
        if (e?.code === 11000) skipped++; else { skipped++; errors.push(`${iso2}: ${e.message || e}`); }
      }
    }
    invalidateLocations();
    res.json({ inserted, skipped, errors });
  } catch (e: any) {
    res.status(400).json({ message: e?.message || 'Invalid import' });
  }
}

export async function adminExportCountries(_req: Request, res: Response) {
  const items = await LocationCountry.find({}).sort({ name: 1 });
  const csv = toCSV(items.map(c => ({ name: c.name, iso2: c.iso2, iso3: c.iso3 || '', phoneCode: c.phoneCode || '', currency: c.currency || '' })), ['name', 'iso2', 'iso3', 'phoneCode', 'currency']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="countries.csv"');
  res.send(csv);
}

// ADMIN STATES
export async function adminListStates(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req);
  const { search, countryId } = req.query as any;
  const filter: any = {};
  if (countryId) filter.countryId = countryId;
  if (search) filter.name = like(String(search));
  const [items, total] = await Promise.all([
    LocationState.find(filter).sort({ name: 1 }).skip(skip).limit(limit).populate('countryId'),
    LocationState.countDocuments(filter),
  ]);
  res.json({ data: items, total, page, limit });
}

export async function adminCreateState(req: Request, res: Response) {
  const { countryId, name, code, lat, lng, isActive } = req.body || {};
  if (!Types.ObjectId.isValid(String(countryId)) || !name?.trim()) return res.status(400).json({ message: 'Invalid payload' });
  try {
    const doc = await LocationState.create({ countryId, name: name.trim(), code, lat, lng, isActive: isActive !== false });
    invalidateLocations();
    res.status(201).json(doc);
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Duplicate state' });
    res.status(500).json({ message: 'Failed to create state' });
  }
}

export async function adminUpdateState(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const doc = await LocationState.findByIdAndUpdate(id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  invalidateLocations();
  res.json(doc);
}

export async function adminDeleteState(req: Request, res: Response) {
  const { id } = req.params;
  const cascade = String(req.query.cascade || 'false') === 'true';
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const cityCount = await LocationCity.countDocuments({ stateId: id });
  if (cityCount > 0 && !cascade) return res.status(409).json({ message: 'State has cities' });
  if (cascade) {
    const cityIds = (await LocationCity.find({ stateId: id }, { _id: 1 })).map(c => c._id);
    await Promise.all([
      LocationArea.deleteMany({ cityId: { $in: cityIds } }),
      LocationCity.deleteMany({ stateId: id }),
    ]);
  }
  await LocationState.findByIdAndDelete(id);
  invalidateLocations();
  res.json({ ok: true });
}

export async function adminImportStates(req: Request, res: Response) {
  try {
    const rows: any[] = await extractRows(req);
    let inserted = 0, skipped = 0; const errors: string[] = [];
    for (const r of rows) {
      const name = (r.name || '').trim();
      const cIso2 = String(r.countryIso2 || r.country || '').toUpperCase();
      if (!name || cIso2.length !== 2) { skipped++; continue; }
      const country = await LocationCountry.findOne({ iso2: cIso2 });
      if (!country) { skipped++; errors.push(`No country: ${cIso2}`); continue; }
      try {
        await LocationState.updateOne({ countryId: country._id, name }, { $setOnInsert: { countryId: country._id, name }, $set: { code: r.code || undefined, lat: numOrUndef(r.lat), lng: numOrUndef(r.lng), isActive: true } }, { upsert: true });
        inserted++;
      } catch (e: any) { if (e?.code === 11000) skipped++; else { skipped++; errors.push(`${name}: ${e.message || e}`); } }
    }
    invalidateLocations();
    res.json({ inserted, skipped, errors });
  } catch (e: any) { res.status(400).json({ message: e?.message || 'Invalid import' }); }
}

export async function adminExportStates(req: Request, res: Response) {
  const { countryId } = req.query as any;
  const filter: any = {}; if (countryId) filter.countryId = countryId;
  const items = await LocationState.find(filter).sort({ name: 1 }).populate('countryId');
  const rows = items.map((s: any) => ({ countryIso2: s.countryId?.iso2 || '', name: s.name, code: s.code || '', lat: s.lat ?? '', lng: s.lng ?? '' }));
  const csv = toCSV(rows, ['countryIso2', 'name', 'code', 'lat', 'lng']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="states.csv"');
  res.send(csv);
}

// ADMIN CITIES
export async function adminListCities(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req);
  const { search, countryId, stateId } = req.query as any;
  const filter: any = {};
  if (countryId) filter.countryId = countryId;
  if (stateId) filter.stateId = stateId;
  if (search) filter.name = like(String(search));
  const [items, total] = await Promise.all([
    LocationCity.find(filter).sort({ name: 1 }).skip(skip).limit(limit).populate('countryId stateId'),
    LocationCity.countDocuments(filter),
  ]);
  res.json({ data: items, total, page, limit });
}

export async function adminCreateCity(req: Request, res: Response) {
  const { countryId, stateId, name, lat, lng, isActive } = req.body || {};
  if (!Types.ObjectId.isValid(String(countryId)) || !Types.ObjectId.isValid(String(stateId)) || !name?.trim()) return res.status(400).json({ message: 'Invalid payload' });
  try {
    const doc = await LocationCity.create({ countryId, stateId, name: name.trim(), lat: numOrUndef(lat), lng: numOrUndef(lng), isActive: isActive !== false });
    invalidateLocations();
    res.status(201).json(doc);
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Duplicate city' });
    res.status(500).json({ message: 'Failed to create city' });
  }
}

export async function adminUpdateCity(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const doc = await LocationCity.findByIdAndUpdate(id, { ...req.body, lat: numOrUndef(req.body?.lat), lng: numOrUndef(req.body?.lng) }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  invalidateLocations();
  res.json(doc);
}

export async function adminDeleteCity(req: Request, res: Response) {
  const { id } = req.params;
  const cascade = String(req.query.cascade || 'false') === 'true';
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const areaCount = await LocationArea.countDocuments({ cityId: id });
  if (areaCount > 0 && !cascade) return res.status(409).json({ message: 'City has areas' });
  if (cascade) await LocationArea.deleteMany({ cityId: id });
  await LocationCity.findByIdAndDelete(id);
  invalidateLocations();
  res.json({ ok: true });
}

export async function adminImportCities(req: Request, res: Response) {
  try {
    const rows: any[] = await extractRows(req);
    let inserted = 0, skipped = 0; const errors: string[] = [];
    for (const r of rows) {
      const name = (r.name || '').trim();
      const cIso2 = String(r.countryIso2 || r.country || '').toUpperCase();
      const sCode = (r.stateCode || '').trim();
      const sName = (r.stateName || r.state || '').trim();
      if (!name || !cIso2 || (!sCode && !sName)) { skipped++; continue; }
      const country = await LocationCountry.findOne({ iso2: cIso2 });
      if (!country) { skipped++; errors.push(`No country: ${cIso2}`); continue; }
      const state = await LocationState.findOne({ countryId: country._id, ...(sCode ? { code: sCode } : { name: sName }) });
      if (!state) { skipped++; errors.push(`No state for ${cIso2}: ${sCode || sName}`); continue; }
      try {
        await LocationCity.updateOne({ stateId: state._id, name }, { $setOnInsert: { countryId: country._id, stateId: state._id, name }, $set: { lat: numOrUndef(r.lat), lng: numOrUndef(r.lng), isActive: true } }, { upsert: true });
        inserted++;
      } catch (e: any) { if (e?.code === 11000) skipped++; else { skipped++; errors.push(`${name}: ${e.message || e}`); } }
    }
    invalidateLocations();
    res.json({ inserted, skipped, errors });
  } catch (e: any) { res.status(400).json({ message: e?.message || 'Invalid import' }); }
}

export async function adminExportCities(req: Request, res: Response) {
  const { stateId } = req.query as any;
  const filter: any = {}; if (stateId) filter.stateId = stateId;
  const items = await LocationCity.find(filter).sort({ name: 1 }).populate('stateId countryId');
  const rows = items.map((c: any) => ({ countryIso2: c.countryId?.iso2 || '', stateCode: c.stateId?.code || '', stateName: c.stateId?.name || '', name: c.name, lat: c.lat ?? '', lng: c.lng ?? '' }));
  const csv = toCSV(rows, ['countryIso2', 'stateCode', 'stateName', 'name', 'lat', 'lng']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="cities.csv"');
  res.send(csv);
}

// ADMIN AREAS
export async function adminListAreas(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req);
  const { search, countryId, stateId, cityId } = req.query as any;
  const filter: any = {};
  if (countryId) filter.countryId = countryId;
  if (stateId) filter.stateId = stateId;
  if (cityId) filter.cityId = cityId;
  if (search) filter.name = like(String(search));
  const [items, total] = await Promise.all([
    LocationArea.find(filter).sort({ name: 1 }).skip(skip).limit(limit).populate('countryId stateId cityId'),
    LocationArea.countDocuments(filter),
  ]);
  res.json({ data: items, total, page, limit });
}

export async function adminCreateArea(req: Request, res: Response) {
  const { countryId, stateId, cityId, name, pincode, lat, lng, isActive } = req.body || {};
  if (!Types.ObjectId.isValid(String(countryId)) || !Types.ObjectId.isValid(String(stateId)) || !Types.ObjectId.isValid(String(cityId)) || !name?.trim()) return res.status(400).json({ message: 'Invalid payload' });
  try {
    const doc = await LocationArea.create({ countryId, stateId, cityId, name: name.trim(), pincode, lat: numOrUndef(lat), lng: numOrUndef(lng), isActive: isActive !== false });
    invalidateLocations();
    res.status(201).json(doc);
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Duplicate area' });
    res.status(500).json({ message: 'Failed to create area' });
  }
}

export async function adminUpdateArea(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  const doc = await LocationArea.findByIdAndUpdate(id, { ...req.body, lat: numOrUndef(req.body?.lat), lng: numOrUndef(req.body?.lng) }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  invalidateLocations();
  res.json(doc);
}

export async function adminDeleteArea(req: Request, res: Response) {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
  await LocationArea.findByIdAndDelete(id);
  invalidateLocations();
  res.json({ ok: true });
}

export async function adminImportAreas(req: Request, res: Response) {
  try {
    const rows: any[] = await extractRows(req);
    let inserted = 0, skipped = 0; const errors: string[] = [];
    for (const r of rows) {
      const name = (r.name || '').trim();
      const cIso2 = String(r.countryIso2 || r.country || '').toUpperCase();
      const sCode = (r.stateCode || '').trim();
      const cityName = (r.cityName || r.city || '').trim();
      if (!name || !cIso2 || !cityName) { skipped++; continue; }
      const country = await LocationCountry.findOne({ iso2: cIso2 }); if (!country) { skipped++; errors.push(`No country: ${cIso2}`); continue; }
      const state = sCode ? await LocationState.findOne({ countryId: country._id, code: sCode }) : await LocationState.findOne({ countryId: country._id });
      if (!state) { skipped++; errors.push(`No state for ${cIso2}`); continue; }
      const city = await LocationCity.findOne({ stateId: state._id, name: cityName }); if (!city) { skipped++; errors.push(`No city: ${cityName}`); continue; }
      try {
        await LocationArea.updateOne({ cityId: city._id, name }, { $setOnInsert: { countryId: country._id, stateId: state._id, cityId: city._id, name }, $set: { pincode: r.pincode || undefined, lat: numOrUndef(r.lat), lng: numOrUndef(r.lng), isActive: true } }, { upsert: true });
        inserted++;
      } catch (e: any) { if (e?.code === 11000) skipped++; else { skipped++; errors.push(`${name}: ${e.message || e}`); } }
    }
    invalidateLocations();
    res.json({ inserted, skipped, errors });
  } catch (e: any) { res.status(400).json({ message: e?.message || 'Invalid import' }); }
}

export async function adminExportAreas(req: Request, res: Response) {
  const { cityId } = req.query as any;
  const filter: any = {}; if (cityId) filter.cityId = cityId;
  const items = await LocationArea.find(filter).sort({ name: 1 }).populate('countryId stateId cityId');
  const rows = items.map((a: any) => ({ countryIso2: a.countryId?.iso2 || '', stateCode: a.stateId?.code || '', cityName: a.cityId?.name || '', name: a.name, pincode: a.pincode || '', lat: a.lat ?? '', lng: a.lng ?? '' }));
  const csv = toCSV(rows, ['countryIso2', 'stateCode', 'cityName', 'name', 'pincode', 'lat', 'lng']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="areas.csv"');
  res.send(csv);
}

// PUBLIC: dependent dropdowns
export async function publicCountries(_req: Request, res: Response) {
  const key = 'pub:countries'; const cached = cacheGet(key); if (cached) return res.json(cached);
  const data = await LocationCountry.find({ isActive: true }).sort({ name: 1 }).select({ name: 1, iso2: 1, flag: 1 });
  const payload = data.map(c => ({ id: c._id, name: c.name, code: c.iso2, flag: c.flag }));
  cacheSet(key, payload); res.json(payload);
}

export async function publicStates(req: Request, res: Response) {
  const { countryId } = req.query as any; if (!countryId || !Types.ObjectId.isValid(String(countryId))) return res.json([]);
  const key = `pub:states:${countryId}`; const cached = cacheGet(key); if (cached) return res.json(cached);
  const data = await LocationState.find({ isActive: true, countryId }).sort({ name: 1 }).select({ name: 1, code: 1, lat: 1, lng: 1 });
  const payload = data.map(s => ({ id: s._id, name: s.name, code: s.code, lat: s.lat, lng: s.lng }));
  cacheSet(key, payload); res.json(payload);
}

export async function publicCities(req: Request, res: Response) {
  const { stateId } = req.query as any; if (!stateId || !Types.ObjectId.isValid(String(stateId))) return res.json([]);
  const key = `pub:cities:${stateId}`; const cached = cacheGet(key); if (cached) return res.json(cached);
  const data = await LocationCity.find({ isActive: true, stateId }).sort({ name: 1 }).select({ name: 1, lat: 1, lng: 1 });
  const payload = data.map(c => ({ id: c._id, name: c.name, lat: c.lat, lng: c.lng }));
  cacheSet(key, payload); res.json(payload);
}

export async function publicAreas(req: Request, res: Response) {
  const { cityId } = req.query as any; if (!cityId || !Types.ObjectId.isValid(String(cityId))) return res.json([]);
  const key = `pub:areas:${cityId}`; const cached = cacheGet(key); if (cached) return res.json(cached);
  const data = await LocationArea.find({ isActive: true, cityId }).sort({ name: 1 }).select({ name: 1, pincode: 1, lat: 1, lng: 1 });
  const payload = data.map(a => ({ id: a._id, name: a.name, pincode: a.pincode, lat: a.lat, lng: a.lng }));
  cacheSet(key, payload); res.json(payload);
}

// Backward compatibility (legacy endpoints used in current UI)
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
  const { name, stateId, countryId, lat, lng } = req.body;
  const city = new LocationCity({ name, stateId, countryId, lat: numOrUndef(lat), lng: numOrUndef(lng) });
  await city.save();
  res.status(201).json({ ok: true, data: city });
};
export const updateCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const city = await LocationCity.findByIdAndUpdate(id, { ...req.body, lat: numOrUndef(req.body?.lat), lng: numOrUndef(req.body?.lng) }, { new: true });
  res.json({ ok: true, data: city });
};
export const deleteCity = async (req: Request, res: Response) => {
  const { id } = req.params;
  await LocationCity.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
export const createArea = async (req: Request, res: Response) => {
  const { countryId, stateId, cityId, name, pincode, lat, lng } = req.body;
  const area = new LocationArea({ countryId, stateId, cityId, name, pincode, lat: numOrUndef(lat), lng: numOrUndef(lng) });
  await area.save();
  res.status(201).json({ ok: true, data: area });
};
export const updateArea = async (req: Request, res: Response) => {
  const { id } = req.params;
  const area = await LocationArea.findByIdAndUpdate(id, { ...req.body, lat: numOrUndef(req.body?.lat), lng: numOrUndef(req.body?.lng) }, { new: true });
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
  const { name, iso2 } = req.body;
  const country = new LocationCountry({ name, iso2 });
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
  const { countryId, name, code } = req.body;
  const state = new LocationState({ countryId, name, code });
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

async function extractRows(req: Request): Promise<any[]> {
  const anyReq: any = req as any;
  if (anyReq.file && anyReq.file.buffer) {
    const text = anyReq.file.buffer.toString('utf-8');
    return parseCSV(text);
  }
  if (Array.isArray(req.body)) return req.body as any[];
  if (Array.isArray((req.body as any)?.records)) return (req.body as any).records as any[];
  throw new Error('No data provided');
}

function numOrUndef(v: any): number | undefined { const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : undefined; return Number.isFinite(n as any) ? (n as number) : undefined; }
