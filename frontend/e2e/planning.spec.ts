import { test, expect, Page } from '@playwright/test';

const timestamp = Date.now();
const email = `planning-${timestamp}@playwright.local`;
const password = 'Sicher123';

async function setup(page: Page): Promise<void> {
  // Registrieren
  await page.goto('/register');
  await page.getByLabel('Name').fill(`Planning Tester ${timestamp}`);
  await page.getByLabel('E-Mail').fill(email);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Konto erstellen' }).click();
  await expect(page).toHaveURL('/');

  // Lernziel anlegen (Voraussetzung für Planung)
  await page.goto('/goals');
  await page.getByLabel('Titel').fill('Planungs-Ziel');
  await page.getByLabel('Modul / Kurs').fill('PLAN01');
  await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  await expect(page.getByText('Planungs-Ziel')).toBeVisible();
}

test.describe('Lernzeit planen (FR-2, FR-3)', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.goto('/planning');
  });

  test('Lernzeit einplanen und in Liste sehen', async ({ page }) => {
    // Lernziel im Formular wählen
    await page.locator('select[name="slot_goal"]').selectOption({ label: 'Planungs-Ziel' });

    // Dauer auf 90 Minuten setzen
    const durationInput = page.getByLabel('Wie lange? (Minuten)');
    await durationInput.fill('90');

    await page.getByRole('button', { name: 'Lernzeit speichern' }).click();

    // In der Liste erscheinen
    await expect(page.getByText('90 min')).toBeVisible();
    await expect(page.getByText('Planungs-Ziel')).toBeVisible();
  });

  test('Geplante Lernzeit löschen', async ({ page }) => {
    // Slot anlegen
    await page.locator('select[name="slot_goal"]').selectOption({ label: 'Planungs-Ziel' });
    await page.getByRole('button', { name: 'Lernzeit speichern' }).click();
    await expect(page.locator('.slot-card')).toBeVisible();

    // Löschen
    await page.getByRole('button', { name: 'Löschen' }).first().click();
    await expect(page.getByText('Für diesen Monat noch nichts geplant.')).toBeVisible();
  });
});
