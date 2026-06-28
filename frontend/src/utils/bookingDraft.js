const key = id => `agronet-booking-${id}`;

export const saveBookingDraft = (id, draft) => {
  try { sessionStorage.setItem(key(id), JSON.stringify(draft)); } catch { /* storage is optional */ }
};

export const loadBookingDraft = id => {
  try { return JSON.parse(sessionStorage.getItem(key(id)) || 'null'); } catch { return null; }
};

export const clearBookingDraft = id => {
  try { sessionStorage.removeItem(key(id)); } catch { /* storage is optional */ }
};
