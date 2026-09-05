import { expect, test, type Page, type Route } from '@playwright/test';

const rideId = 'ride-1';
const testOrigin = `http://localhost:${process.env.PLAYWRIGHT_PORT ?? '3000'}`;
const corsHeaders = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,PATCH,POST,OPTIONS',
  'access-control-allow-origin': testOrigin,
  'content-type': 'application/json',
};

const ongoingRide = {
  id: rideId,
  driverId: 'driver-1',
  status: 'ONGOING',
  origin: 'Hà Nội',
  destination: 'Hải Phòng',
  departureTime: '2026-09-02T08:00:00.000Z',
  availableSeats: 4,
  offeredSeats: 4,
  pricePerSeat: 100_000,
  duration: 90,
  allowRoutePickup: false,
  routePickupSharingEnabled: false,
  bookings: [],
};

async function mockDriverRideApi(
  page: Page,
  options: {
    completeError?: string;
    noActiveRide?: boolean;
    bookings?: Array<Record<string, unknown>>;
    reviewedUserIds?: string[];
  } = {},
) {
  let completeRequests = 0;
  let completed = false;

  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (pathname === '/api/users/me') {
      await route.fulfill({ headers: corsHeaders, json: { id: 'driver-1', email: 'driver@example.com', firstName: 'An', lastName: 'Nguyễn', role: 'USER', isDriverVerified: true } });
      return;
    }
    if (pathname === '/api/bookings/active') {
      await route.fulfill({ headers: corsHeaders, json: { activeBooking: completed || options.noActiveRide ? null : { userRole: 'DRIVER', ride: ongoingRide } } });
      return;
    }
    if (pathname === `/api/rides/${rideId}/status` && request.method() === 'PATCH') {
      completeRequests += 1;
      if (options.completeError) {
        await route.fulfill({ status: 400, headers: corsHeaders, json: { message: options.completeError } });
      } else {
        completed = true;
        await route.fulfill({ headers: corsHeaders, json: { ride: { ...ongoingRide, status: 'COMPLETED' } } });
      }
      return;
    }
    if (pathname === `/api/rides/${rideId}`) {
      await route.fulfill({ headers: corsHeaders, json: { ride: { ...ongoingRide, status: 'COMPLETED' } } });
      return;
    }
    if (pathname === '/api/bookings/driver') {
      await route.fulfill({ headers: corsHeaders, json: { bookings: options.bookings ?? [] } });
      return;
    }
    if (pathname === `/api/reviews/ride/${rideId}/mine`) {
      await route.fulfill({ headers: corsHeaders, json: { reviewedUserIds: options.reviewedUserIds ?? [] } });
      return;
    }
    if (pathname === '/api/reviews' && request.method() === 'POST') {
      await route.fulfill({ status: 201, headers: corsHeaders, json: { message: 'Đã gửi đánh giá thành công', review: { id: 'review-new' } } });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders, json: { message: `Unmocked ${pathname}` } });
  });

  return () => completeRequests;
}

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([{ name: 'refreshToken', value: 'driver-flow', domain: 'localhost', path: '/' }]);
  await page.addInitScript(() => {
    localStorage.setItem('coride-role-mode', 'driver');
    sessionStorage.setItem('accessToken', 'driver-flow-token');
    window.confirm = () => true;
  });
});

test('completes once, replaces ongoing history and renders a zero-value receipt', async ({ page }) => {
  const getCompleteRequests = await mockDriverRideApi(page);

  await page.goto('/ongoing');
  const completeButton = page.getByRole('button', { name: 'Hoàn thành chuyến' });
  await expect(completeButton).toBeVisible();
  await page.evaluate(() => { window.confirm = () => true; });
  await completeButton.click();

  await expect.poll(getCompleteRequests).toBe(1);
  await expect(page).toHaveURL(`/my-rides/${rideId}`);
  await expect(page.getByRole('heading', { name: 'Chuyến đi đã hoàn thành' })).toBeVisible();
  await expect(page.getByText('0đ', { exact: true })).toBeVisible();
  expect(getCompleteRequests()).toBe(1);

  await page.goBack();
  await expect(page).not.toHaveURL(/\/ongoing/);
});

test('keeps the operating screen and backend error when completion is rejected', async ({ page }) => {
  const message = 'Không thể hoàn thành chuyến. Vẫn còn 1 hành khách chưa được trả tại điểm đến.';
  const getCompleteRequests = await mockDriverRideApi(page, { completeError: message });

  await page.goto('/ongoing');
  await page.evaluate(() => { window.confirm = () => true; });
  await page.getByRole('button', { name: 'Hoàn thành chuyến' }).click();

  await expect.poll(getCompleteRequests).toBe(1);
  await expect(page).toHaveURL('/ongoing');
  await expect(page.getByText(message)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hoàn thành chuyến' })).toBeEnabled();
  expect(getCompleteRequests()).toBe(1);
});

test('shows driver actions instead of the passenger empty state when no ride is active', async ({ page }) => {
  await mockDriverRideApi(page, { noActiveRide: true });

  await page.goto('/ongoing');

  await expect(page.getByRole('heading', { name: 'Không có chuyến đang chạy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chuyến của tôi' }).last()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Đăng chuyến mới' })).toBeVisible();
  await expect(page.getByText('Đặt một chuyến mới')).toHaveCount(0);
});

test('totals completed bookings and updates each passenger review without reload', async ({ page }) => {
  const bookings = [
    {
      id: 'booking-1', rideId, seats: 1, totalPrice: 100_000, status: 'COMPLETED',
      isPickedUp: true, isDroppedOff: true, passenger: { id: 'passenger-1', firstName: 'Bình', lastName: 'An', passengerRating: 4.8 }, ride: { id: rideId },
    },
    {
      id: 'booking-2', rideId, seats: 2, totalPrice: 200_000, status: 'COMPLETED',
      isPickedUp: true, isDroppedOff: true, passenger: { id: 'passenger-2', firstName: 'Chi', lastName: 'Lê', passengerRating: 4.9 }, ride: { id: rideId },
    },
  ];
  await mockDriverRideApi(page, { bookings, reviewedUserIds: ['passenger-1'] });

  await page.goto(`/my-rides/${rideId}`);

  await expect(page.getByText('300.000đ', { exact: true })).toBeVisible();
  await expect(page.getByText('Hành khách', { exact: true }).first().locator('..').getByText('2', { exact: true })).toBeVisible();
  await expect(page.getByText('Số ghế', { exact: true }).locator('..').getByText('3', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã đánh giá', { exact: true })).toHaveCount(1);

  await page.getByRole('button', { name: 'Đánh giá' }).click();
  await page.getByRole('radio', { name: '5 sao' }).click();
  await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
  await expect(page.getByText('Đã đánh giá', { exact: true })).toHaveCount(2);
});
