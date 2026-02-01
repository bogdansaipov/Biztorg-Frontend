export function formatUzPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^998/, "");

  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);

  return `+998 ${parts.join(" ")}`;
}