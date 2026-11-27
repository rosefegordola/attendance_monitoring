export function isOfficialSorsuEmail(email: string | null | undefined) {
  return typeof email === "string" && /^[^@\s]+@sorsu\.edu\.ph$/i.test(email.trim());
}
