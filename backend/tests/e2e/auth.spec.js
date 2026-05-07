// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication Smoke Test', () => {
  test('should load the login page', async ({ page }) => {
    // We assume the frontend is running or we just test the redirection
    await page.goto('/');
    
    // Check if login form elements are present (this depends on the actual frontend UI)
    // For now, we'll just check the title or a generic element
    await expect(page).toHaveTitle(/Vision/i);
  });
});
