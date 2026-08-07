import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test('basic spreadsheet edit', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=MiniTab');
  await page.getByText('工作表1').click();
  await expect(page.locator('[data-row]').first()).toBeVisible();
});

test('virtualizes a 1000-row by 50-column table', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=MiniTab');
  await createLargeTable(page);

  const renderedRows = page.locator('[data-row]');
  expect(await renderedRows.count()).toBeLessThan(50);

  const body = page.locator('.flex-1.overflow-auto').last();
  await body.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event('scroll'));
  });

  await expect(page.locator('text=1000').last()).toBeVisible();
});

test('opens lazy analysis panels without blanking the page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByText('工作表1').click();
  await page.locator('div.flex.items-center button').first().click();

  await expect(page.getByText('过程能力分析 - 配置')).toBeVisible();
  expect(errors).toEqual([]);
});

test('capability chart title follows column subheader and stays editable', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForSelector('text=MiniTab');

  await page.evaluate(() => {
    const tables = (
      window as unknown as Record<string, {
        getState: () => {
          activeTableId: string | null;
          setCellValues: (
            id: string,
            updates: { row: number; col: number; value: number }[]
          ) => void;
          setSubHeader: (id: string, col: number, label: string) => void;
        };
      }>
    ).__MINITAB_TABLES__;
    const tableId = tables.getState().activeTableId!;
    tables.getState().setCellValues(tableId, [
      { row: 2, col: 0, value: 1 },
      { row: 3, col: 0, value: 2 },
      { row: 4, col: 0, value: 3 },
      { row: 5, col: 0, value: 4 },
      { row: 2, col: 1, value: 100 },
      { row: 3, col: 1, value: 200 },
      { row: 4, col: 1, value: 300 },
      { row: 5, col: 1, value: 400 },
    ]);
    tables.getState().setSubHeader(tableId, 0, 'RC');
  });

  await page.locator('div.flex.items-center button').first().click();
  const titleInput = page.getByRole('textbox');
  await expect(titleInput).toHaveValue('RC 过程能力分析');
  await titleInput.fill('自定义标题');
  await expect(titleInput).toHaveValue('自定义标题');
  await expect(page.locator('text=自定义标题').last()).toBeVisible();

  const numberInputs = page.locator('input[type="number"]');
  await expect(numberInputs).toHaveCount(3);
  const lslBefore = await numberInputs.nth(0).inputValue();
  expect(lslBefore).not.toBe('');

  await page.locator('select').first().selectOption('1');
  const lslAfter = await numberInputs.nth(0).inputValue();
  expect(lslAfter).not.toBe(lslBefore);

  const lslBox = await numberInputs.nth(0).boundingBox();
  const uslBox = await numberInputs.nth(2).boundingBox();
  expect(Math.abs((lslBox?.y ?? 0) - (uslBox?.y ?? 0))).toBeLessThan(2);
  await expect(page.getByText('CA', { exact: true })).toBeVisible();
});

test('opens the new first-tier statistics panels without blanking', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.waitForSelector('text=MiniTab');
  await page.evaluate(() => {
    const tables = (
      window as unknown as Record<string, {
        getState: () => {
          activeTableId: string | null;
          setCellValues: (
            id: string,
            updates: { row: number; col: number; value: number }[]
          ) => void;
        };
      }>
    ).__MINITAB_TABLES__;
    const tableId = tables.getState().activeTableId!;
    tables.getState().setCellValues(
      tableId,
      Array.from({ length: 10 }, (_, i) => ({
        row: 2 + i,
        col: 0,
        value: i + 1,
      }))
    );
  });

  const cases = [
    { label: '描述性统计', heading: '描述性统计 - 选择列' },
    { label: 'SPC控制图', heading: 'SPC 控制图 - 配置' },
    { label: '假设检验', heading: '假设检验 - 配置' },
    { label: 'Gage R&R', heading: 'Gage R&R - 配置' },
  ];
  for (const item of cases) {
    await page.getByRole('button', { name: item.label }).click();
    await expect(page.getByText(item.heading)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

async function createLargeTable(page: Page) {
  await page.evaluate(() => {
    const tables = (
      window as unknown as Record<string, {
        getState: () => {
          createTable: () => string;
          ensureSize: (id: string, rows: number, cols: number) => void;
          setActiveTable: (id: string) => void;
        };
      }>
    ).__MINITAB_TABLES__;
    const analysis = (
      window as unknown as Record<string, {
        getState: () => { openTab: (id: string) => void };
      }>
    ).__MINITAB_ANALYSIS__;
    const tableId = tables.getState().createTable();
    tables.getState().ensureSize(tableId, 1002, 50);
    tables.getState().setActiveTable(tableId);
    analysis.getState().openTab(tableId);
  });
}
