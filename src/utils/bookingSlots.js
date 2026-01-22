export const resolveSeatsLeft = (slot) => {
  if (!slot) return null;
  if (Number.isFinite(slot.seats_left)) return slot.seats_left;
  const capacity = Number(slot.capacity);
  const bookedCount = Number(slot.booked_count);
  if (!Number.isNaN(capacity) && !Number.isNaN(bookedCount)) {
    return Math.max(capacity - bookedCount, 0);
  }
  return null;
};

export const slotIsAvailable = (slot) => {
  if (!slot) return false;
  if (slot.type && slot.type !== "available") return false;
  if (slot.status === "unavailable") return false;
  if (slot.origin === "shift") return false;
  if (slot.mode === "group") {
    const seatsLeft = resolveSeatsLeft(slot);
    return seatsLeft === null ? !slot.booked : seatsLeft > 0;
  }
  return !slot.booked;
};

export const slotSeatsLabel = (slot) => {
  if (!slot || slot.mode !== "group") return "";
  const seatsLeft = resolveSeatsLeft(slot);
  return Number.isFinite(seatsLeft) ? `${seatsLeft} left` : "";
};
