import axios from 'axios';
import goongService from './goong.service';

jest.mock('axios');
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

describe('Goong service facade', () => {
  beforeAll(() => { process.env.GOONG_REST_API_KEY = 'test-rest-key'; });
  beforeEach(() => { mockedGet.mockReset(); });

  it.each([
    ['v1', '/place/autocomplete'],
    ['v2', '/v2/place/autocomplete'],
  ] as const)('uses the correct autocomplete endpoint for %s', async (version, endpoint) => {
    mockedGet.mockResolvedValueOnce({ data: { predictions: [{ place_id: `${version}-id`, description: 'Địa điểm' }] } } as any);
    const result = await goongService.autocomplete(`unique-${version}`, 5, undefined, undefined, true, version);
    expect(result).toHaveLength(1);
    expect(mockedGet).toHaveBeenCalledWith(`https://rsapi.goong.io${endpoint}`, expect.objectContaining({ params: expect.objectContaining({ api_key: 'test-rest-key' }) }));
  });

  it('retries once after a 429 response', async () => {
    mockedGet.mockRejectedValueOnce({ response: { status: 429 } }).mockResolvedValueOnce({ data: { predictions: [] } } as any);
    await goongService.autocomplete('unique-retry-429', 5, undefined, undefined, true, 'v2');
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('returns an empty autocomplete list for an empty upstream response', async () => {
    mockedGet.mockResolvedValueOnce({ data: {} } as any);
    await expect(goongService.autocomplete('unique-empty-response', 5, undefined, undefined, true, 'v2')).resolves.toEqual([]);
  });

  it('uses the documented geocode endpoint for reverse geocoding in both address modes', async () => {
    mockedGet.mockResolvedValue({
      data: {
        results: [{
          formatted_address: '17 Tống Đản, Hoàn Kiếm, Hà Nội',
          geometry: { location: { lat: 21.025, lng: 105.856 } },
          place_id: 'reverse-id',
        }],
      },
    } as any);

    await goongService.reverseGeocode(21.025, 105.856, 'v2');
    await goongService.reverseGeocodeCandidates(21.026, 105.857, 'v2');

    expect(mockedGet).toHaveBeenNthCalledWith(1, 'https://rsapi.goong.io/geocode', expect.objectContaining({
      params: expect.objectContaining({ latlng: '21.025,105.856', api_key: 'test-rest-key' }),
    }));
    expect(mockedGet).toHaveBeenNthCalledWith(2, 'https://rsapi.goong.io/geocode', expect.objectContaining({
      params: expect.objectContaining({ latlng: '21.026,105.857', api_key: 'test-rest-key' }),
    }));
  });

  it('retries a timeout and then fails gracefully', async () => {
    mockedGet.mockRejectedValue({ code: 'ECONNABORTED' });
    await expect(goongService.autocomplete('unique-timeout-response', 5, undefined, undefined, true, 'v2')).rejects.toThrow('Không thể tìm kiếm địa điểm');
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});
