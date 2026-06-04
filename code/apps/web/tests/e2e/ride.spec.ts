import { test, expect } from '@playwright/test';

test.describe('Ride Management', () => {
  const email = 'testuser@example.com';
  const password = 'Password123!';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should post a new ride', async ({ page }) => {
    await page.goto('/rides/post');
    
    // Fill in ride details
    // AddressAutocomplete inputs don't have IDs, so we use placeholders
    await page.fill('input[placeholder="Vị trí bắt đầu"]', 'Hà Nội');
    // Wait for suggestions and click the first one if it appears (optional depending on mock)
    // await page.click('li:has-text("Hà Nội")'); 
    
    await page.fill('input[placeholder="Vị trí kết thúc"]', 'Hải Phòng');
    // await page.click('li:has-text("Hải Phòng")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const departureTime = tomorrow.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm
    
    await page.fill('input[id="departureTime"]', departureTime);
    await page.fill('input[id="availableSeats"]', '4');
    await page.fill('input[id="pricePerSeat"]', '100000');
    await page.fill('textarea[id="description"]', 'Chuyến đi Hà Nội - Hải Phòng, xe 4 chỗ sạch sẽ.');
    
    await page.click('button[type="submit"]');
    
    // After posting, it should redirect to my-rides
    await expect(page).toHaveURL(/\/my-rides/);
    await expect(page.locator('text=Hà Nội')).toBeVisible();
    await expect(page.locator('text=Hải Phòng')).toBeVisible();
  });

  test('should search for rides', async ({ page }) => {
    await page.goto('/rides/search');
    
    await page.fill('input[placeholder="Điểm đi"]', 'Hà Nội');
    await page.fill('input[placeholder="Điểm đến"]', 'Hải Phòng');
    
    await page.click('button:has-text("Tìm chuyến ngay")');
    
    // Check if results are shown or "No rides found" is shown correctly
    const resultsHeader = page.locator('h2:has-text("Kết quả")');
    await expect(resultsHeader).toBeVisible();
  });
});
