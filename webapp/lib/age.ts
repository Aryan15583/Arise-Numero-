// Age checks for India's DPDP Act 2023: personal data of anyone under 18 may
// only be processed with verifiable consent from a parent or lawful guardian.
export const ADULT_AGE = 18;

/** Whole years between a YYYY-MM-DD date of birth and `today`, or null if the date isn't valid or is in the future. */
export function ageFromDob(dob: string, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const birth = new Date(Date.UTC(y, mo - 1, d));
  if (birth.getUTCFullYear() !== y || birth.getUTCMonth() !== mo - 1 || birth.getUTCDate() !== d) return null;
  let age = today.getUTCFullYear() - y;
  const beforeBirthday = today.getUTCMonth() < mo - 1 || (today.getUTCMonth() === mo - 1 && today.getUTCDate() < d);
  if (beforeBirthday) age--;
  return age < 0 || age > 130 ? null : age;
}

export function isMinor(dob: string, today = new Date()): boolean {
  const age = ageFromDob(dob, today);
  return age !== null && age < ADULT_AGE;
}
