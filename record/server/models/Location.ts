import mongoose from 'mongoose';

const commonOpts = { timestamps: true } as const;

const locationCountrySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  iso2: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2, unique: true, index: true },
  iso3: { type: String, uppercase: true },
  phoneCode: { type: String },
  currency: { type: String },
  flag: { type: String },
  isActive: { type: Boolean, default: true },
}, commonOpts);

const locationStateSchema = new mongoose.Schema({
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCountry', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  isActive: { type: Boolean, default: true },
}, commonOpts);
locationStateSchema.index({ countryId: 1, name: 1 }, { unique: true });

const locationCitySchema = new mongoose.Schema({
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCountry', required: true, index: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationState', required: true, index: true },
  name: { type: String, required: true, trim: true },
  lat: { type: Number },
  lng: { type: Number },
  isActive: { type: Boolean, default: true },
}, commonOpts);
locationCitySchema.index({ stateId: 1, name: 1 }, { unique: true });
locationCitySchema.index({ lat: 1, lng: 1 });

const locationAreaSchema = new mongoose.Schema({
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCountry', required: true, index: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationState', required: true, index: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'LocationCity', required: true, index: true },
  name: { type: String, required: true, trim: true },
  pincode: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  isActive: { type: Boolean, default: true },
}, commonOpts);
locationAreaSchema.index({ cityId: 1, name: 1 }, { unique: true });

export const LocationCountry = mongoose.models.LocationCountry || mongoose.model('LocationCountry', locationCountrySchema);
export const LocationState = mongoose.models.LocationState || mongoose.model('LocationState', locationStateSchema);
export const LocationCity = mongoose.models.LocationCity || mongoose.model('LocationCity', locationCitySchema);
export const LocationArea = mongoose.models.LocationArea || mongoose.model('LocationArea', locationAreaSchema);
