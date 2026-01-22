const {
  resolveSeatsLeft,
  slotIsAvailable,
  slotSeatsLabel,
  slotIsFullGroup,
} = require('../bookingSlots');

describe('bookingSlots helpers', () => {
  it('returns no seats for a full group slot', () => {
    const slot = { mode: 'group', capacity: 10, booked_count: 10 };
    expect(resolveSeatsLeft(slot)).toBe(0);
    expect(slotIsAvailable(slot)).toBe(false);
    expect(slotIsFullGroup(slot)).toBe(true);
  });

  it('returns seats left for partially filled group slot', () => {
    const slot = { mode: 'group', capacity: 10, booked_count: 9 };
    expect(resolveSeatsLeft(slot)).toBe(1);
    expect(slotIsAvailable(slot)).toBe(true);
    expect(slotSeatsLabel(slot)).toBe(' • 1 left');
  });

  it('treats booked one-to-one slots as unavailable', () => {
    const slot = { mode: 'one_to_one', booked: true };
    expect(slotIsAvailable(slot)).toBe(false);
    expect(slotSeatsLabel(slot)).toBe('');
  });

  it('treats shift-origin slots as unavailable', () => {
    const slot = { mode: 'group', origin: 'shift', capacity: 5, booked_count: 0 };
    expect(slotIsAvailable(slot)).toBe(false);
  });

  it('prefers seats_left field when provided', () => {
    const slot = { mode: 'group', seats_left: 3, capacity: 10, booked_count: 2 };
    expect(resolveSeatsLeft(slot)).toBe(3);
    expect(slotSeatsLabel(slot)).toBe(' • 3 left');
  });
});
