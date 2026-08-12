/**
 * Zugriff auf den im Browser gespeicherten Anmelde-Ausweis (Token).
 *
 * Diese Datei haengt bewusst von nichts ab - insbesondere nicht vom AuthService.
 * Grund: Der HTTP-Interceptor braucht den Token vor jeder Anfrage. Wuerde er ihn
 * beim AuthService erfragen, entstuende beim Start der Anwendung ein Ringschluss
 * (Angular-Fehler NG0200), weil der AuthService seinerseits beim Bauen bereits
 * eine HTTP-Anfrage ausloest.
 *
 * Der Zugriff ist zusaetzlich abgesichert, weil die Unit-Tests in Node.js ohne
 * Browser laufen und dort kein localStorage existiert.
 */
const TOKEN_KEY = 'lm_token';

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined' || localStorage === null) {
      return null;
    }
    return localStorage;
  } catch {
    // Manche Browser werfen bei blockierten Cookies/Speicher eine Ausnahme.
    return null;
  }
}

export function readToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function writeToken(token: string): void {
  storage()?.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  storage()?.removeItem(TOKEN_KEY);
}
