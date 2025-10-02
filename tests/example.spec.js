// @ts-check
import { test, expect } from '@playwright/test';

test('visit rdo89.com page', async ({ page }) => {
  await page.goto('https://rdo89.com/8Ts005d6');

  // Wait for redirect and page to fully load
  await page.waitForLoadState('networkidle');
  
  // normal order
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Continue as Guest' }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'NAGA 88 CK $' }).click();
  await page.locator('iframe[title="Server"]').contentFrame().locator('#radio-0').getByLabel('').check();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Tambah' }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: '$12.00 VIEW CART' }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Konfirmasi Pesanan' }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Konfirmasi', exact: true }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Konfirmasi Pesanan' }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Konfirmasi', exact: true }).click();
  await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Konfirmasi' }).click();
  
  // payment order
  // await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Continue as Guest' }).click();
  // await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'NAGA 88 CK $' }).click();
  // await page.locator('iframe[title="Server"]').contentFrame().locator('#radio-0').getByLabel('').check();
  // await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Tambah' }).click();
  // await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: '$12.00 VIEW CART' }).click();
  // await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Proceed to Checkout' }).click();
  // await page.locator('iframe[title="Server"]').contentFrame().getByRole('button', { name: 'Proceed to payment' }).click();
  // await page.locator('iframe[title="Iframe for card number"]').contentFrame().getByRole('textbox', { name: 'Card number' }).click();
  // await page.locator('iframe[title="Iframe for card number"]').contentFrame().getByRole('textbox', { name: 'Card number' }).fill('5555 4444 3333 1111');
  // await page.locator('iframe[title="Iframe for expiry date"]').contentFrame().getByRole('textbox', { name: 'Expiry date' }).click();
  // await page.locator('iframe[title="Iframe for expiry date"]').contentFrame().getByRole('textbox', { name: 'Expiry date' }).fill('03/30');
  // await page.locator('iframe[title="Iframe for security code"]').contentFrame().getByRole('textbox', { name: 'Security code' }).fill('737');
  // await page.getByRole('button', { name: 'Pay SGD' }).click();
  // Take a screenshot to see what loaded
  await page.screenshot({ path: 'test-results/screenshot.png' });
});
