const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NPSN_PATTERN = /^\d{8}$/;
const INTERNAL_EMAIL_DOMAIN = "school.masiang.local";

export function normalizeLoginIdentity(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmailIdentity(value: string): boolean {
  return EMAIL_PATTERN.test(normalizeLoginIdentity(value));
}

export function isNpsnIdentity(value: string): boolean {
  return NPSN_PATTERN.test(normalizeLoginIdentity(value));
}

export function isValidSchoolRegistrationNpsn(value: string): boolean {
  return isNpsnIdentity(value);
}

export function buildSchoolInternalEmail(npsn: string): string {
  const normalizedNpsn = normalizeLoginIdentity(npsn);
  if (!isValidSchoolRegistrationNpsn(normalizedNpsn)) {
    throw new Error("NPSN sekolah tidak valid.");
  }

  return `npsn-${normalizedNpsn}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function isManagedSchoolEmail(email: string): boolean {
  return normalizeLoginIdentity(email).endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}
