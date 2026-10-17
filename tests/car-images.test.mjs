import test from 'node:test';
import assert from 'node:assert/strict';
import { CARS, CATALOGUE_SIZE } from '../src/calculator.js';
import { CAR_MEDIA } from '../src/car-media.js';
import { loadCarImage } from '../src/car-images.js';

class TestImage extends EventTarget {
 complete = false;
 naturalWidth = 0;
 requests = [];
 set src(value) { this.requests.push(value); }
 success() {
  this.complete = true; this.naturalWidth = 720;
  this.dispatchEvent(new Event('load'));
 }
 fail() { this.dispatchEvent(new Event('error')); }
}

test('all 63 models and 68 scenarios have explicit image and source coverage', () => {
 assert.equal(CATALOGUE_SIZE, 63);
 assert.equal(CARS.length, 68);
 assert.deepEqual(Object.keys(CAR_MEDIA).sort(), CARS.map(c => c.id).sort());
 for (const car of CARS) {
  assert.equal(new URL(car.image).protocol, 'https:', car.id);
  assert.equal(new URL(car.source).protocol, 'https:', car.id);
  assert.ok(car.imageLabel.includes('대표 이미지'), car.id);
  assert.ok(!car.image.includes('showroom.png'), car.id);
  if (car.image.includes('autoimg.danawa.com')) {
   const model = car.image.match(/\/photo\/(\d+)\//)[1];
   assert.equal(new URL(car.source).searchParams.get('Model'), model, car.id);
  }
 }
});

test('a failed source advances to the matching fallback, then succeeds', () => {
 const image = new TestImage(), states = [];
 const cancel = loadCarImage(image, ['primary', 'fallback'], s => states.push(s));
 image.fail();
 assert.deepEqual(image.requests, ['primary', 'fallback']);
 image.success();
 image.fail(); // A late event must not overwrite a successful photo.
 assert.equal(states.at(-1), 'loaded');
 assert.equal(image.requests.length, 2);
 cancel();
});

test('unavailable images retry once and stop without an infinite request loop', () => {
 const image = new TestImage(), states = [];
 const cancel = loadCarImage(image, ['primary', 'primary'], s => states.push(s));
 image.fail(); image.fail(); image.fail();
 assert.deepEqual(image.requests, ['primary', 'primary']);
 assert.equal(states.at(-1), 'error');
 cancel();
 // The visible retry action can start again after connectivity returns.
 const retry = loadCarImage(image, ['primary'], s => states.push(s));
 image.success();
 assert.equal(states.at(-1), 'loaded');
 retry();
});

test('cached and synchronously completed photos do not get hidden as errors', () => {
 const image = new TestImage(), states = [];
 image.complete = true; image.naturalWidth = 720;
 const cancel = loadCarImage(image, ['cached'], s => states.push(s));
 assert.deepEqual(states, ['loading', 'loaded']);
 cancel();
});

test('image requests that never settle leave loading after bounded time', async () => {
 const image = new TestImage(), states = [];
 const cancel = loadCarImage(image, ['unresponsive'], s => states.push(s), {timeout: 5});
 await new Promise(resolve => setTimeout(resolve, 35));
 assert.equal(states.at(-1), 'error');
 assert.equal(image.requests.length, 2);
 cancel();
});

test('changing recommendations cancels pending retries and late image events', async () => {
 const image = new TestImage(), states = [];
 const cancel = loadCarImage(image, ['old'], s => states.push(s), {timeout: 5});
 cancel(); image.fail(); image.success();
 await new Promise(resolve => setTimeout(resolve, 15));
 assert.deepEqual(image.requests, ['old']);
 assert.deepEqual(states, ['loading']);
});
