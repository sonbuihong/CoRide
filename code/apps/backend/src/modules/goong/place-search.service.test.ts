import goongService from './goong.service';
import { normalizeVietnameseAddressQueries, searchPlaces } from './place-search.service';

jest.mock('./goong.service', () => ({
  __esModule: true,
  default: {
    autocomplete: jest.fn(),
    geocodeV2: jest.fn(),
  },
}));

const mockedAutocomplete = goongService.autocomplete as jest.MockedFunction<typeof goongService.autocomplete>;
const mockedGeocode = goongService.geocodeV2 as jest.MockedFunction<typeof goongService.geocodeV2>;

describe('place search', () => {
  beforeEach(() => {
    mockedAutocomplete.mockReset();
    mockedGeocode.mockReset();
  });

  it('keeps the original Vietnamese query and emits bounded useful variants', () => {
    expect(normalizeVietnameseAddressQueries('LK645 DV-26 Khu C Yên Nghĩa')).toEqual([
      'LK645 DV-26 Khu C Yên Nghĩa',
      'LK 645 DV 26 Khu C Yên Nghĩa',
      'Liền kề 645 DV 26 Khu C Yên Nghĩa',
    ]);
  });

  it.each([
    'LK 645 DV 26 Khu C Yên Nghĩa',
    'Liền kề 645 DV 26 Khu C Yên Nghĩa',
    'DV 26 Khu C Yên Nghĩa',
  ])('never replaces the original query: %s', (query) => {
    const variants = normalizeVietnameseAddressQueries(query);
    expect(variants[0]).toBe(query);
    expect(variants.length).toBeLessThanOrEqual(3);
  });

  it('falls back to geocode and marks a mismatched house number approximate', async () => {
    mockedAutocomplete.mockResolvedValue([]);
    mockedGeocode.mockResolvedValue([{
      place_id: 'nearby-656',
      name: 'Lòng Chất Sơn Râu Quán',
      formatted_address: 'Lk656 dv26, khu C, Yên Nghĩa, Hà Nội',
      address: '',
      types: ['establishment'],
      geometry: { location: { lat: 20.95, lng: 105.75 }, boundary: null },
      address_components: [],
      compound: { commune: 'Yên Nghĩa', province: 'Hà Nội' },
      plus_code: { compound_code: '', global_code: '' },
    }]);
    const results = await searchPlaces('LK645 DV-26 Khu C Yên Nghĩa');
    expect(results[0]).toEqual(expect.objectContaining({ source: 'GOONG_GEOCODE', confidence: 'APPROXIMATE' }));
  });

  it('does not call geocode when autocomplete has a high-confidence result', async () => {
    mockedAutocomplete.mockResolvedValue([{
      description: 'Keangnam Landmark 72, Phạm Hùng, Hà Nội',
      place_id: 'keangnam',
      reference: 'keangnam',
      matched_substrings: [],
      structured_formatting: { main_text: 'Keangnam Landmark 72', secondary_text: 'Phạm Hùng, Hà Nội' },
      terms: [],
      has_children: false,
    }]);
    const results = await searchPlaces('Keangnam Landmark 72');
    expect(results[0].confidence).toBe('HIGH');
    expect(mockedGeocode).not.toHaveBeenCalled();
  });
});
