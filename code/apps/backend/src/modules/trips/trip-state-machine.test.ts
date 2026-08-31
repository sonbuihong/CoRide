import {
  getAllowedTripTransitions,
  isTripTransitionAllowed,
} from './trip-state-machine';

describe('Ride-Hailing Trip state machine', () => {
  it('allows the canonical driver lifecycle', () => {
    expect(isTripTransitionAllowed('ACCEPTED', 'ARRIVING', 'DRIVER')).toBe(true);
    expect(isTripTransitionAllowed('ARRIVING', 'ARRIVED', 'DRIVER')).toBe(true);
    expect(isTripTransitionAllowed('ARRIVED', 'IN_PROGRESS', 'DRIVER')).toBe(true);
    expect(isTripTransitionAllowed('IN_PROGRESS', 'WAITING_PAYMENT', 'DRIVER')).toBe(true);
    expect(isTripTransitionAllowed('WAITING_PAYMENT', 'COMPLETED', 'PAYMENT')).toBe(true);
  });

  it('rejects skipped, reversed, and unauthorized transitions', () => {
    expect(isTripTransitionAllowed('ARRIVING', 'IN_PROGRESS', 'DRIVER')).toBe(false);
    expect(isTripTransitionAllowed('IN_PROGRESS', 'ARRIVED', 'DRIVER')).toBe(false);
    expect(isTripTransitionAllowed('WAITING_PAYMENT', 'COMPLETED', 'DRIVER')).toBe(false);
    expect(isTripTransitionAllowed('MATCHING', 'ACCEPTED', 'DRIVER')).toBe(false);
  });

  it('distinguishes passenger and driver cancellation permissions', () => {
    expect(getAllowedTripTransitions('MATCHING', 'PASSENGER')).toContain('CANCELLED');
    expect(getAllowedTripTransitions('MATCHING', 'DRIVER')).not.toContain('CANCELLED');
    expect(getAllowedTripTransitions('ARRIVED', 'DRIVER')).toContain('CANCELLED');
    expect(getAllowedTripTransitions('IN_PROGRESS', 'PASSENGER')).not.toContain('CANCELLED');
  });
});
