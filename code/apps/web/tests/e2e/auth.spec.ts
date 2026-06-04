import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const email = `testuser${randomSuffix}@example.com`;
  const password = 'Password123!';

  test('should register successfully', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[id="lastName"]', 'Test');
    await page.fill('input[id="firstName"]', 'User');
    await page.fill('input[id="reg-email"]', email);
    await page.fill('input[id="phone"]', '0912345678');
    await page.fill('input[id="reg-password"]', password);
    
    await page.click('button[type="submit"]');
    
    // After registration, it should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Đăng nhập')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    
    await page.click('button[type="submit"]');
    
    // After login, it should redirect to home page
    await expect(page).toHaveURL('/');
    // Check if some logged-in element is visible, e.g., Profile or Logout
    // (Assuming there is a navigation bar with a link to profile)
    // await expect(page.locator('text=Trang chủ')).toBeVisible();
  });

  test('should show error on login failure', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[id="email"]', 'wrong@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errorAlert = page.locator('.bg-destructive\\/15');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('thất bại');
  });
});
