import mongoose from 'mongoose';

const locationCountrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  code: { type: String }
});

const locationStateSchema = new mongoose.Schema({
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCountry', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true }
});

const locationCitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  state: { type: String, required: true }
});

const locationAreaSchema = new mongoose.Schema({
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCity', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  pincode: { type: String }
});

export const LocationCountry = mongoose.model('LocationCountry', locationCountrySchema);
export const LocationState = mongoose.model('LocationState', locationStateSchema);
export const LocationCity = mongoose.model('LocationCity', locationCitySchema);
export const LocationArea = mongoose.model('LocationArea', locationAreaSchema);
