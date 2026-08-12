import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from './auth.service';

// Die Tests laufen in Node.js ohne Browser. Dort gibt es kein localStorage,
// deshalb wird hier ein einfacher Ersatz mit derselben Schnittstelle eingesetzt.
function installLocalStorageStub(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

// Gibt der Ereignisschleife die Gelegenheit, angestossene Promises abzuarbeiten.
// Ohne diese Pause waeren die Zusicherungen manchmal schneller als der Code,
// der auf die Antwort des Servers reagiert.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function configure(): { auth: AuthService; httpMock: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return {
    auth: TestBed.inject(AuthService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('AuthService', () => {
  beforeEach(() => {
    installLocalStorageStub();
    TestBed.resetTestingModule();
  });

  it('behaelt den Token beim Start und fragt genau einmal /api/auth/me ab', async () => {
    localStorage.setItem('lm_token', 'dummy-token');

    const { auth, httpMock } = configure();
    await tick();

    const requests = httpMock.match('/api/auth/me');
    expect(requests.length).toBe(1);
    expect(requests[0].request.headers.get('Authorization')).toBe('Bearer dummy-token');
    expect(localStorage.getItem('lm_token')).toBe('dummy-token');
    expect(auth.isLoggedIn()).toBe(true);

    requests[0].flush({ id: 1, email: 'a@b.de', name: 'A' });
    await tick();
    expect(auth.currentUser()?.name).toBe('A');
  });

  it('meldet ab, wenn der Server den Token mit 401 ablehnt', async () => {
    localStorage.setItem('lm_token', 'abgelaufener-token');

    const { auth, httpMock } = configure();
    await tick();

    const requests = httpMock.match('/api/auth/me');
    expect(requests.length).toBe(1);
    requests[0].flush({ error: 'nope' }, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(localStorage.getItem('lm_token')).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('setzt den Anmeldezustand beim Abmelden zurueck', async () => {
    localStorage.setItem('lm_token', 'dummy-token');

    const { auth, httpMock } = configure();
    await tick();
    httpMock.match('/api/auth/me').forEach((r) => r.flush({ id: 1, email: 'a@b.de', name: 'A' }));
    await tick();

    auth.logout();

    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('lm_token')).toBeNull();
  });
});
