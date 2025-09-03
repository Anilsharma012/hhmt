import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Page } from '../models/Page';
import { createPage } from '../controllers/pages';

let mongo: MongoMemoryServer;

before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  await Page.syncIndexes();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('DB unique index enforces unique slug', async () => {
  const a = await Page.create({ title: 'About', slug: 'about', contentHtml: '<p>a</p>' });
  assert.ok(a._id);
  let dupErr: any;
  try {
    await Page.create({ title: 'About 2', slug: 'about', contentHtml: '<p>b</p>' });
  } catch (e) {
    dupErr = e;
  }
  assert.ok(dupErr, 'Expected duplicate key error');
  assert.equal(dupErr.code, 11000);
});

test('createPage controller returns 400 on duplicate slug', async () => {
  await Page.deleteMany({});
  await Page.create({ title: 'About', slug: 'about', contentHtml: '<p>a</p>' });
  let statusCode = 200;
  let payload: any = null;
  const req: any = { body: { title: 'About Again', slug: 'about', contentHtml: '<p>x</p>' } };
  const res: any = {
    status(code: number) { statusCode = code; return this; },
    json(obj: any) { payload = obj; return this; }
  };
  await createPage(req, res);
  assert.equal(statusCode, 400);
  assert.equal(payload.ok, false);
  assert.match(String(payload.message), /Slug already exists/i);
});
