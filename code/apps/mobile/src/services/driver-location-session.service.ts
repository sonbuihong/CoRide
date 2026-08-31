import * as Location from 'expo-location';
import { watchLocation } from './location-watch.service';

type Listener = (location: Location.LocationObject) => void;

const listeners = new Map<Listener, number>();
let watchSubscription: Location.LocationSubscription | null = null;
let startPromise: Promise<void> | null = null;

async function ensureWatch(): Promise<void> {
  if (watchSubscription || startPromise) return startPromise ?? Promise.resolve();
  startPromise = watchLocation(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5_000,
      distanceInterval: 10,
    },
    (location) => {
      const highestPriority = Math.max(...listeners.values());
      listeners.forEach((priority, listener) => {
        if (priority === highestPriority) listener(location);
      });
    },
  ).then((subscription) => {
    if (listeners.size === 0) {
      subscription.remove();
      return;
    }
    watchSubscription = subscription;
  }).finally(() => {
    startPromise = null;
  });
  return startPromise;
}

/** Multiplexes availability and active-trip consumers onto one native GPS watch. */
export async function subscribeDriverLocation(
  listener: Listener,
  priority = 0,
): Promise<{ remove: () => void }> {
  listeners.set(listener, priority);
  try {
    await ensureWatch();
  } catch (error) {
    listeners.delete(listener);
    throw error;
  }

  let removed = false;
  return {
    remove: () => {
      if (removed) return;
      removed = true;
      listeners.delete(listener);
      if (listeners.size === 0) {
        watchSubscription?.remove();
        watchSubscription = null;
      }
    },
  };
}
