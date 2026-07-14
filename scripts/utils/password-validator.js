// scripts/utils/password-validator.js
// เกณฑ์รหัสผ่านมาตรฐาน: 8 ตัวขึ้นไป, มีพิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข, อักขระพิเศษ อย่างน้อยอย่างละ 1 ตัว

export const PASSWORD_RULES = [
  { id: "length",  label: "อย่างน้อย 8 ตัวอักษร",        test: (pw) => pw.length >= 8 },
  { id: "upper",   label: "มีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower",   label: "มีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว", test: (pw) => /[a-z]/.test(pw) },
  { id: "number",  label: "มีตัวเลข (0-9) อย่างน้อย 1 ตัว",       test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "มีอักขระพิเศษ (เช่น ! @ # $ %) อย่างน้อย 1 ตัว", test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(pw) },
];

// คืนค่า array ของกฎที่ "ยังไม่ผ่าน" (ถ้า array ว่าง = รหัสผ่านผ่านหมดทุกข้อ)
export function getFailedRules(password) {
  return PASSWORD_RULES.filter((rule) => !rule.test(password || ""));
}

export function isPasswordValid(password) {
  return getFailedRules(password).length === 0;
}