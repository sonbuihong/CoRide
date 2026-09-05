import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DriverRouteLifecycle,
  DriverRouteRequestCoordinator,
  shouldAcceptLiveLocation,
  type DirectionsLoader,
  type RoutePoint,
} from './driver-route-lifecycle';

const responseFor = (origin: string, destination: string) => {
  const parse = (value: string): [number, number] => {
    const [lat, lng] = value.split(',').map(Number);
    return [lng, lat];
  };
  return {
    routes: [{
      legs: [{ distance: { value: 1_000 }, duration: { value: 120 } }],
      overview_polyline: { points: [parse(origin), parse(destination)] as Array<[number, number]> },
    }],
  };
};

test('GPS updates only move liveLocation and never request Directions', async () => {
  const calls: Array<[string, string]> = [];
  const loader: DirectionsLoader = async (origin, destination) => {
    calls.push([origin, destination]);
    return responseFor(origin, destination);
  };
  const lifecycle = new DriverRouteLifecycle(loader);
  const origin = { lat: 20.68, lng: 105.52 };
  const destination = { lat: 20.76, lng: 105.45 };

  await lifecycle.confirmRoute(origin, destination, 'car');
  assert.equal(calls.length, 1);
  for (let index = 0; index < 100; index += 1) {
    lifecycle.updateLiveLocation({ lat: 20.7 + index / 100_000, lng: 105.5, accuracy: 20, timestamp: index });
  }
  assert.equal(calls.length, 1);
});

test('confirming a changed destination makes exactly one new request', async () => {
  const calls: Array<[string, string]> = [];
  const loader: DirectionsLoader = async (origin, destination) => {
    calls.push([origin, destination]);
    return responseFor(origin, destination);
  };
  const lifecycle = new DriverRouteLifecycle(loader);
  const origin = { lat: 20.68, lng: 105.52 };

  await lifecycle.confirmRoute(origin, { lat: 20.76, lng: 105.45 }, 'car');
  await lifecycle.confirmRoute(origin, { lat: 20.8, lng: 105.4 }, 'car');

  assert.deepEqual(calls, [
    ['20.68,105.52', '20.76,105.45'],
    ['20.68,105.52', '20.8,105.4'],
  ]);
});

test('accepted pickup snapshots live GPS and makes exactly two segment requests', async () => {
  const calls: Array<[string, string]> = [];
  const loader: DirectionsLoader = async (origin, destination) => {
    calls.push([origin, destination]);
    return responseFor(origin, destination);
  };
  const lifecycle = new DriverRouteLifecycle(loader);
  const destination = { lat: 20.76, lng: 105.45 };
  const live = { lat: 20.71, lng: 105.5 };
  const pickup = { lat: 20.72, lng: 105.49 };
  await lifecycle.confirmRoute({ lat: 20.68, lng: 105.52 }, destination, 'car');
  calls.length = 0;
  lifecycle.updateLiveLocation(live);

  const result = await lifecycle.acceptPickups([pickup], 'car');
  assert.deepEqual(calls, [
    ['20.71,105.5', '20.72,105.49'],
    ['20.72,105.49', '20.76,105.45'],
  ]);
  assert.equal(result.route.segments.length, 2);
  assert.equal(result.route.totalDistanceMeters, 2_000);

  for (let index = 0; index < 100; index += 1) {
    lifecycle.updateLiveLocation({ lat: live.lat + index / 100_000, lng: live.lng });
  }
  assert.equal(calls.length, 2);
});

test('passenger cancellation snapshots current GPS and makes one direct request', async () => {
  const calls: Array<[string, string]> = [];
  const loader: DirectionsLoader = async (origin, destination) => {
    calls.push([origin, destination]);
    return responseFor(origin, destination);
  };
  const lifecycle = new DriverRouteLifecycle(loader);
  const destination = { lat: 20.76, lng: 105.45 };
  await lifecycle.confirmRoute({ lat: 20.68, lng: 105.52 }, destination, 'car');
  lifecycle.updateLiveLocation({ lat: 20.73, lng: 105.48 });
  calls.length = 0;

  await lifecycle.removePickups('car');
  assert.deepEqual(calls, [['20.73,105.48', '20.76,105.45']]);
});

test('same route key reuses in-flight and cache', async () => {
  const resolvers: Array<() => void> = [];
  let calls = 0;
  const loader: DirectionsLoader = (origin, destination) => {
    calls += 1;
    return new Promise((resolve) => resolvers.push(() => resolve(responseFor(origin, destination))));
  };
  const coordinator = new DriverRouteRequestCoordinator(loader);
  const origin: RoutePoint = { lat: 20.68, lng: 105.52 };
  const first = { mode: 'BASE' as const, origin, destination: { lat: 20.76, lng: 105.45 }, vehicle: 'car' as const };
  const duplicateA = coordinator.request(first);
  const duplicateB = coordinator.request(first);
  assert.equal(calls, 1);
  resolvers.shift()?.();
  const [resultA, resultB] = await Promise.all([duplicateA, duplicateB]);
  assert.equal(resultA.isLatest, false);
  assert.equal(resultB.isLatest, true);
  await coordinator.request(first);
  assert.equal(calls, 1);
});

test('a stale Directions response cannot overwrite the latest route', async () => {
  const resolvers = new Map<string, () => void>();
  let calls = 0;
  const loader: DirectionsLoader = (origin, destination) => {
    calls += 1;
    return new Promise((resolve) => resolvers.set(destination, () => resolve(responseFor(origin, destination))));
  };
  const coordinator = new DriverRouteRequestCoordinator(loader);
  const origin: RoutePoint = { lat: 20.68, lng: 105.52 };
  const first = { mode: 'BASE' as const, origin, destination: { lat: 20.76, lng: 105.45 }, vehicle: 'car' as const };
  const second = { ...first, destination: { lat: 20.8, lng: 105.4 } };

  const oldRequest = coordinator.request(first);
  const latestRequest = coordinator.request(second);
  assert.equal(calls, 2);
  resolvers.get('20.8,105.4')?.();
  const latestResult = await latestRequest;
  resolvers.get('20.76,105.45')?.();
  const oldResult = await oldRequest;
  assert.equal(latestResult.isLatest, true);
  assert.equal(oldResult.isLatest, false);
});

test('location quality filtering rejects stale and extremely inaccurate fixes', () => {
  const good = { lat: 20.7, lng: 105.5, accuracy: 20, timestamp: 10_000 };
  assert.equal(shouldAcceptLiveLocation(null, good), true);
  assert.equal(shouldAcceptLiveLocation(good, { ...good, timestamp: 9_000 }), false);
  assert.equal(shouldAcceptLiveLocation(good, { ...good, timestamp: Number.NaN }), false);
  assert.equal(shouldAcceptLiveLocation(good, { ...good, accuracy: 800, timestamp: 11_000 }), false);
  assert.equal(shouldAcceptLiveLocation(good, { ...good, lat: 20.7001, accuracy: 30, timestamp: 11_000 }), true);
});
