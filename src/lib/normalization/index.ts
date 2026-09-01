export function normalizeCustomerCode(value: string) {
  return value.trim().toUpperCase();
}

export function normalizePlateNumber(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
