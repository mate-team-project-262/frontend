/**
 * The first word of the account name, for greetings and the header: "Sofiia Shcherba" -> "Sofiia".
 * The full name is still the sign-in name and is shown in full on "My account".
 */
export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}
