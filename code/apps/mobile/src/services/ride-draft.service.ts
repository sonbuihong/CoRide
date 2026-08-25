import type { CreateRideInput, RideStopInput } from "@repo/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DRAFT_KEY = "coride.driver.publishDraft.v2";
const LEGACY_DRAFT_KEY = "coride.driver.publishDraft.v1";

export interface RideRuleOptions {
  allowRoutePickup: boolean;
  allowSmoking: boolean;
  allowPets: boolean;
  allowLuggage: boolean;
}

export interface RideDraftExtras {
  selectedDates: string[];
  departureClock: string;
  stops: RideStopInput[];
  selectedRouteIndex: number;
}

export interface RideDraft {
  version: 2;
  savedAt: string;
  step: number;
  form: CreateRideInput;
  extras: RideDraftExtras;
}

const readValue = async (key: string) => {
  if (Platform.OS === "web")
    return typeof window !== "undefined"
      ? window.localStorage.getItem(key)
      : null;
  return SecureStore.getItemAsync(key);
};

const writeValue = async (value: string) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined")
      window.localStorage.setItem(DRAFT_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(DRAFT_KEY, value);
};

const removeValue = async (key: string) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

const extrasFromDeparture = (departureTime: string): RideDraftExtras => {
  const departure = new Date(departureTime);
  const valid = !Number.isNaN(departure.getTime());
  return {
    selectedDates: valid ? [departure.toISOString().slice(0, 10)] : [],
    departureClock: valid
      ? `${String(departure.getHours()).padStart(2, "0")}:${String(departure.getMinutes()).padStart(2, "0")}`
      : "08:00",
    stops: [],
    selectedRouteIndex: 0,
  };
};

export const rideDraftService = {
  async load(): Promise<RideDraft | null> {
    try {
      const raw = await readValue(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RideDraft;
        if (parsed.version === 2 && parsed.form && parsed.extras) return parsed;
      }
      const legacy = await readValue(LEGACY_DRAFT_KEY);
      if (!legacy) return null;
      const parsed = JSON.parse(legacy) as {
        step?: number;
        form?: CreateRideInput;
      };
      if (!parsed.form) return null;
      return {
        version: 2,
        savedAt: new Date().toISOString(),
        step: Math.min(parsed.step ?? 0, 6),
        form: parsed.form,
        extras: extrasFromDeparture(parsed.form.departureTime),
      };
    } catch {
      return null;
    }
  },

  async save(
    step: number,
    form: CreateRideInput,
    extras: RideDraftExtras,
  ): Promise<void> {
    const sanitizedForm: CreateRideInput = {
      ...form,
      routePolyline: undefined,
      distance: undefined,
      duration: undefined,
    };
    await writeValue(
      JSON.stringify({
        version: 2,
        savedAt: new Date().toISOString(),
        step,
        form: sanitizedForm,
        extras,
      } satisfies RideDraft),
    );
  },

  async clear(): Promise<void> {
    await Promise.all([removeValue(DRAFT_KEY), removeValue(LEGACY_DRAFT_KEY)]);
  },
};
