import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testEmail = `test-${timestamp}@playwright.local`;
const testName = `Playwright Nutzer ${timestamp}`;
const testPassword = 'Sicher123';

test.describe('Authentifizierung', () => {
  test('Registrierung und Login', async ({ page }) => {
    // Zur Registrierungsseite navigieren
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Registrieren' })).toBeVisible();

    // Formular ausfüllen
    await page.getByLabel('Name').fill(testName);
    await page.getByLabel('E-Mail').fill(testEmail);
    await page.getByLabel('Passwort').fill(testPassword);
    await page.getByRole('button', { name: 'Konto erstellen' }).click();

    // Nach Registrierung auf Dashboard landen
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Abmelden
    await page.getByRole('button', { name: 'Abmelden' }).click();
    await expect(page).toHaveURL('/login');

    // Wieder einloggen
    await page.getByLabel('E-Mail').fill(testEmail);
    await page.getByLabel('Passwort').fill(testPassword);
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('Login mit falschen Daten zeigt Fehlermeldung', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('falsch@example.com');
    await page.getByLabel('Passwort').fill('FalschesPasswort');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page.getByText(/ungültig|nicht korrekt|Anmeldung fehlgeschlagen/i)).toBeVisible();
  });

  test('Nicht eingeloggter Nutzer wird zur Login-Seite weitergeleitet', async ({ page }) => {
    await page.goto('/goals');
    await expect(page).toHaveURL('/login');
  });
});
