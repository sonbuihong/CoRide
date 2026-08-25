import type { User } from '../services/auth.service';
import { getDriverEligibility } from './mode-checker';

const user = (overrides: Partial<User>): User => ({
  id: 'user-1',
  email: 'driver@coride.vn',
  firstName: 'An',
  lastName: 'Nguyễn',
  role: 'USER',
  ...overrides,
});

describe('getDriverEligibility', () => {
  it('accepts the canonical verified flag when /users/me omits the verification relation', () => {
    expect(getDriverEligibility(user({ isDriverVerified: true }))).toEqual({ eligible: true, reason: 'approved' });
  });

  it('accepts a fully approved verification record', () => {
    expect(getDriverEligibility(user({
      isDriverVerified: true,
      driverVerification: { status: 'APPROVED', vehicleType: 'CAR', vehiclePlate: '30A-12345' },
    }))).toEqual({ eligible: true, reason: 'approved' });
  });

  it('rejects users who have not registered as drivers', () => {
    expect(getDriverEligibility(user({ isDriverVerified: false }))).toEqual({ eligible: false, reason: 'not_registered' });
  });
});
