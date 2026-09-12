// Junta classes ignorando valores falsy (false/null/undefined).
// Ex.: cn("base", ativo && "text-brand") -> "base text-brand" quando ativo=true.
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
