import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { SignupPage } from '../page-objects/SignupPage.js';
import { DashboardPage } from '../page-objects/DashboardPage.js';

test.describe('Signup & Onboarding Flow', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-F1-01: Full successful signup', async ({ page }) => {
    const signupPage = new SignupPage(page);
    const dashboardPage = new DashboardPage(page);

    await signupPage.goto();

    // Step 1: Account
    await signupPage.fillStep1('Abdullah Ahmadi', 'owner@smartmarkt.com', 'SecurePass123');
    await signupPage.advanceFromStep1();

    // Step 2: Organization
    await signupPage.fillStep2('Ahmadi Org', '300012345600003', '0501234567', 'Riyadh, KSA');
    await signupPage.advanceFromStep2();

    // Step 3: First Store
    await signupPage.fillStep3('Ahmadi Supermarket');
    await signupPage.submitSignup();

    // Redirection / reload to dashboard
    await expect(dashboardPage.dashboardTab).toBeVisible();
    await expect(dashboardPage.activeStoreName).toContainText('Ahmadi Supermarket');
  });

  test('TC-F1-02: Input state persistence when navigating back', async ({ page }) => {
    const signupPage = new SignupPage(page);

    await signupPage.goto();

    // Fill Step 1
    await signupPage.fillStep1('Persist Test', 'persist@test.com', 'SecurePass123');
    await signupPage.advanceFromStep1();

    // Go back to Step 1
    await signupPage.goBackFromStep2();

    // Verify fields are retained
    await expect(signupPage.fullNameInput).toHaveValue('Persist Test');
    await expect(signupPage.emailInput).toHaveValue('persist@test.com');
  });

  test('TC-F1-03: Validation errors on step transitions', async ({ page }) => {
    const signupPage = new SignupPage(page);

    await signupPage.goto();

    // Attempt advance from Step 1 with empty fields
    await signupPage.advanceFromStep1();
    await expect(signupPage.errorMessage).toBeVisible();
    await expect(signupPage.errorMessage).toContainText('All fields are required');

    // Fill Step 1 and advance
    await signupPage.fillStep1('Valid User', 'valid@test.com', 'SecurePass123');
    await signupPage.advanceFromStep1();

    // Attempt advance from Step 2 with empty fields
    await signupPage.advanceFromStep2();
    await expect(signupPage.errorMessage).toBeVisible();
    await expect(signupPage.errorMessage).toContainText('All fields are required');

    // Fill Step 2 with invalid VAT
    await signupPage.fillStep2('Valid Org', '12345', '0501234567', 'Riyadh');
    await signupPage.advanceFromStep2();
    await expect(signupPage.errorMessage).toBeVisible();
    await expect(signupPage.errorMessage).toContainText('VAT number must be 15 digits');
  });

  test('TC-F1-04: Password mismatch validation', async ({ page }) => {
    const signupPage = new SignupPage(page);

    await signupPage.goto();

    // Fill Step 1 with mismatching passwords
    await signupPage.fillStep1('Mismatch Test', 'mismatch@test.com', 'SecurePass123', 'DifferentPass123');
    await signupPage.advanceFromStep1();

    // Verify next step is blocked and validation error shown
    await expect(signupPage.errorMessage).toBeVisible();
    await expect(signupPage.errorMessage).toContainText('Passwords do not match');
    await expect(signupPage.confirmPasswordInput).toBeVisible(); // Still on step 1
  });
});
