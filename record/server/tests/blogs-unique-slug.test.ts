import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Blog } from '../models/Blog';
import { adminCreateBlog } from '../controllers/blogs';

let mongo: MongoMemoryServer;

before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  await Blog.syncIndexes();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('DB unique index enforces unique blog slug', async () => {
  await Blog.deleteMany({});
  const a = await Blog.create({ title: 'Hello', slug: 'hello', descriptionHtml: '<p>hi</p>' });
  assert.ok(a._id);
  let dupErr: any;
  try {
    await Blog.create({ title: 'Hello 2', slug: 'hello', descriptionHtml: '<p>x</p>' });
  } catch (e) {
    dupErr = e;
  }
  assert.ok(dupErr, 'Expected duplicate key error');
  assert.equal(dupErr.code, 11000);
});

test('adminCreateBlog returns 400 on duplicate slug', async () => {
  await Blog.deleteMany({});
  await Blog.create({ title: 'Hello', slug: 'hello', descriptionHtml: '<p>hi</p>' });
  let statusCode = 200;
  let payload: any = null;
  const req: any = { body: { title: 'Again', slug: 'hello', descriptionHtml: '<p>x</p>' }, user: { _id: new mongoose.Types.ObjectId() } };
  const res: any = {
    status(code: number) { statusCode = code; return this; },
    json(obj: any) { payload = obj; return this; }
  };
  await adminCreateBlog(req, res);
  assert.equal(statusCode, 400);
  assert.equal(payload.ok, false);
  assert.match(String(payload.message), /Slug already exists/i);
});
