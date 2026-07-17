import { Page, Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  
  // Step 1
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly nextButton1: Locator;

  // Step 2
  readonly organizationNameInput: Locator;
  readonly vatNumberInput: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly backButton2: Locator;
  readonly nextButton2: Locator;

  // Step 3
  readonly storeNameInput: Locator;
  readonly backButton3: Locator;
  readonly submitButton: Locator;

  // Error
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Step 1 Account details
    this.fullNameInput = page.locator('[data-testid="signup-fullname"]');
    this.emailInput = page.locator('[data-testid="signup-email"]');
    this.passwordInput = page.locator('[data-testid="signup-password"]');
    this.confirmPasswordInput = page.locator('[data-testid="signup-confirmpassword"]');
    this.nextButton1 = page.locator('[data-testid="signup-next-1"]');

    // Step 2 Organization details
    this.organizationNameInput = page.locator('[data-testid="signup-orgname"]');
    this.vatNumberInput = page.locator('[data-testid="signup-vatnumber"]');
    this.phoneInput = page.locator('[data-testid="signup-phone"]');
    this.addressInput = page.locator('[data-testid="signup-address"]');
    this.backButton2 = page.locator('[data-testid="signup-back-2"]');
    this.nextButton2 = page.locator('[data-testid="signup-next-2"]');

    // Step 3 Store details
    this.storeNameInput = page.locator('[data-testid="signup-storename"]');
    this.backButton3 = page.locator('[data-testid="signup-back-3"]');
    this.submitButton = page.locator('[data-testid="signup-submit"]');

    // Error
    this.errorMessage = page.locator('[data-testid="signup-error"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillStep1(fullName: string, email: string, password: string, confirmPassword?: string) {
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword !== undefined ? confirmPassword : password);
  }

  async advanceFromStep1() {
    await this.nextButton1.click();
  }

  async fillStep2(orgName: string, vatNumber: string, phone: string, address: string) {
    await this.organizationNameInput.fill(orgName);
    await this.vatNumberInput.fill(vatNumber);
    await this.phoneInput.fill(phone);
    await this.addressInput.fill(address);
  }

  async advanceFromStep2() {
    await this.nextButton2.click();
  }

  async fillStep3(storeName: string) {
    await this.storeNameInput.fill(storeName);
  }

  async submitSignup() {
    await this.submitButton.click();
  }

  async goBackFromStep2() {
    await this.backButton2.click();
  }

  async goBackFromStep3() {
    await this.backButton3.click();
  }
}
