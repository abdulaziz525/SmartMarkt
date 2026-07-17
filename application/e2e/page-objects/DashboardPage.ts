import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  // Tabs
  readonly dashboardTab: Locator;
  readonly posTab: Locator;
  readonly inventoryTab: Locator;
  readonly suppliersTab: Locator;
  readonly reportsTab: Locator;
  readonly settingsTab: Locator;

  // Header Elements
  readonly activeStoreName: Locator;
  readonly activeStoreVat: Locator;

  // Dashboard Metrics
  readonly totalSalesMetric: Locator;
  readonly salesInvoiceCountMetric: Locator;
  readonly netProfitMetric: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tabs
    this.dashboardTab = page.locator('[data-testid="tab-dashboard"]');
    this.posTab = page.locator('[data-testid="tab-pos"]');
    this.inventoryTab = page.locator('[data-testid="tab-inventory"]');
    this.suppliersTab = page.locator('[data-testid="tab-suppliers"]');
    this.reportsTab = page.locator('[data-testid="tab-reports"]');
    this.settingsTab = page.locator('[data-testid="tab-settings"]');

    // Header Info
    this.activeStoreName = page.locator('[data-testid="header-store-name"]');
    this.activeStoreVat = page.locator('[data-testid="header-store-vat"]');

    // Metrics
    this.totalSalesMetric = page.locator('[data-testid="total-sales"]');
    this.salesInvoiceCountMetric = page.locator('[data-testid="sales-invoice-count"]');
    this.netProfitMetric = page.locator('[data-testid="net-profit"]');
  }

  async switchTab(tab: 'dashboard' | 'pos' | 'inventory' | 'suppliers' | 'reports' | 'settings') {
    switch (tab) {
      case 'dashboard':
        await this.dashboardTab.click();
        break;
      case 'pos':
        await this.posTab.click();
        break;
      case 'inventory':
        await this.inventoryTab.click();
        break;
      case 'suppliers':
        await this.suppliersTab.click();
        break;
      case 'reports':
        await this.reportsTab.click();
        break;
      case 'settings':
        await this.settingsTab.click();
        break;
    }
  }

  async getActiveStoreName(): Promise<string> {
    return (await this.activeStoreName.textContent()) || '';
  }

  async getActiveStoreVat(): Promise<string> {
    return (await this.activeStoreVat.textContent()) || '';
  }

  async getMetricValue(metric: 'total-sales' | 'sales-invoice-count' | 'net-profit'): Promise<string> {
    switch (metric) {
      case 'total-sales':
        return (await this.totalSalesMetric.textContent()) || '';
      case 'sales-invoice-count':
        return (await this.salesInvoiceCountMetric.textContent()) || '';
      case 'net-profit':
        return (await this.netProfitMetric.textContent()) || '';
    }
  }
}
