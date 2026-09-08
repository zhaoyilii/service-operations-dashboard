import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test'; 

test(
  'shows health summary and creates a service',
  async ({ page }) => {
    const serviceName =
      `Analytics Pipeline ${randomUUID()}`;

    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'System pulse' })
    ).toBeVisible();

    await expect(
      page.getByText('Customer Portal')
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Add service',
        exact: true
      })
      .click();

    await page
      .getByLabel('Service name')
      .fill(serviceName);

    await page
      .getByLabel('Description')
      .fill('Processes product usage events');

    await page
      .getByLabel('Owner')
      .fill('Data Platform');

    await page
      .getByRole('button', { name: 'Create service' })
      .click();

    await expect(
      page.getByRole('status')
    ).toContainText('Service created');

    await page
      .getByRole('button', {
        name: 'Services',
        exact: true
      })
      .first()
      .click();

    await page
      .getByLabel('Search services')
      .fill(serviceName);

    await page
      .getByRole('button', { name: 'Search' })
      .click();

    await expect(
      page.getByText(serviceName, { exact: true })
    ).toBeVisible();
  }
);

test(
  'declares an incident',
  async ({ page }) => {
    const incidentTitle =
      `Portal response errors ${randomUUID()}`;

    await page.goto('/');

    await page
      .getByRole('button', { name: 'New incident' })
      .click();

    await page
      .getByLabel('Incident title')
      .fill(incidentTitle);

    await page
      .getByLabel('What is happening?')
      .fill('Synthetic smoke test incident');

    await page
      .getByLabel('Affected service')
      .selectOption({ label: 'Customer Portal' });

    await page
      .getByLabel('Severity')
      .selectOption('high');

    await page
      .getByRole('button', { name: 'Declare incident' })
      .click();

    await expect(
      page.getByRole('status')
    ).toContainText('Incident created');

    await page
      .getByRole('button', {
        name: 'Incidents',
        exact: true
      })
      .first()
      .click();

    await expect(
      page.getByText(incidentTitle, { exact: true })
    ).toBeVisible();
  }
);

test(
  'creates and deletes an incident',
  async ({ page }, testInfo) => {
    const title =
  `Deletion test ${testInfo.project.name}-${randomUUID()}`;

    await page.goto('/');

    await page
      .getByRole('button', { name: 'New incident' })
      .click();

    await page
      .getByLabel('Incident title')
      .fill(title);

    await page
      .getByLabel('What is happening?')
      .fill('Temporary Playwright incident');

    await page
      .getByLabel('Affected service')
      .selectOption({ label: 'Customer Portal' });

    await page
      .getByLabel('Severity')
      .selectOption('low');

    await page
      .getByRole('button', { name: 'Declare incident' })
      .click();

    await expect(
      page.getByRole('status')
    ).toContainText('Incident created');

    await page
      .getByRole('button', {
        name: 'Incidents',
        exact: true
      })
      .first()
      .click();

    const incidentRow = page
      .getByRole('row')
      .filter({ hasText: title }); // 先找到包含目标标题的行

    await expect(incidentRow).toBeVisible();

    page.once('dialog', dialog => dialog.accept()); // 下一次出现浏览器对话框时，自动点击确认。

    await incidentRow
      .getByRole('button', { name: 'Delete' }) // 只点击该行内部的 Delete
      .click();

    await expect(
      page.getByRole('status')
    ).toContainText('Incident deleted');

    await expect(incidentRow).not.toBeVisible();
  }
);
