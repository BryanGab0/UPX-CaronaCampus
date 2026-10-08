// Junta classes ignorando valores falsy (false/null/undefined).
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
