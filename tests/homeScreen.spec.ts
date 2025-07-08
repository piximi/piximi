import { test, expect } from '@playwright/test';


test('Start New Project', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const startNewProjectButton1 = page.getByTestId('start-new-project');
  await expect(startNewProjectButton1).toHaveText('Start New Project');
  await startNewProjectButton1.click();
  await expect(page ).toHaveURL(/\/project/);
});

test('Documenation', async ({ page }) => {
  await page.goto('http://localhost:3000/');


  const documentationButton = page.getByTestId('documentation');
  await expect(documentationButton).toHaveAttribute(
      'href',
      'https://documentation.piximi.app'
  );


  const [newTab] = await Promise.all([
    page.context().waitForEvent('page'),
    documentationButton.click(),
  ]);

  await newTab.waitForLoadState();
  await expect(newTab).toHaveURL('https://documentation.piximi.app/intro.html');

});


test('Upload Project', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const documentationButton = page.getByTestId('upload-project');
  await expect(documentationButton).toHaveText('Upload Project');
});


test('Open Example Project', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const documentationButton = page.getByTestId('open-example-project');
  await expect(documentationButton).toHaveText('Open Example Project');
});
