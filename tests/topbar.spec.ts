import {expect, test} from "@playwright/test";

test('Image Selection', async ({ page }) => {

    await page.goto('http://localhost:3000');

    await page.goto('http://localhost:3000/');
    const documentationButton = page.getByTestId('open-example-project');
    await documentationButton.click();

    await expect(page.getByText('Images with Objects')).toBeVisible({ timeout: 10000 });
    await page.getByText('Images with Objects').click();
    await page.getByText('Malaria infected human blood smears').click();

    await expect(page).toHaveURL(/\/project/);
    await page.getByText('deserializing image').waitFor({ state: 'hidden' });

    const image = page.getByTestId('grid-image-102e71cd-bd52-4adf-b2f4-315506fa19e6');
    await image.click();

});

test('Kind Switching', async ({ page }) => {

    await page.goto('http://localhost:3000/');
    const documentationButton = page.getByTestId('open-example-project');
    await documentationButton.click();

    await expect(page.getByText('Images with Objects')).toBeVisible({ timeout: 10000 });
    await page.getByText('Images with Objects').click();
    await page.getByText('Malaria infected human blood smears').click();

    await expect(page).toHaveURL(/\/project/);
    await page.getByText('deserializing image').waitFor({ state: 'hidden' });

    await page.getByText('Infected',{ exact: true }).click();

    const image = page.getByTestId('grid-image-136e9014-178b-41ef-8bf8-5fe63f070a0e');
    await image.click();

});

test('Adding New Kind', async ({ page }) => {

    await page.goto('http://localhost:3000/');
    const documentationButton = page.getByTestId('open-example-project');
    await documentationButton.click();

    await expect(page.getByText('Images with Objects')).toBeVisible({ timeout: 10000 });
    await page.getByText('Images with Objects').click();
    await page.getByText('Malaria infected human blood smears').click();

    await expect(page).toHaveURL(/\/project/);
    await page.getByText('deserializing image').waitFor({ state: 'hidden' });

    await page.getByTestId('AddIcon').last().click();
    await page.getByText('New Kind').click();

   // await page.getByTestId('create-kind-name-input').fill('test kind');
    await page.getByTestId('create-kind-name-input').locator('input').fill('test kind');

    await page.getByText('Confirm').click();
    await expect(page.getByText('test kind')).toBeVisible();

});


test('Select All', async ({ page }) => {

    await page.goto('http://localhost:3000/');
    const documentationButton = page.getByTestId('open-example-project');
    await documentationButton.click();

    await expect(page.getByText('Images with Objects')).toBeVisible({ timeout: 10000 });
    await page.getByText('Images with Objects').click();
    await page.getByText('Malaria infected human blood smears').click();

    await expect(page).toHaveURL(/\/project/);
    await page.getByText('deserializing image').waitFor({ state: 'hidden' });

    await page.getByTestId('select-all-button').hover();
    await expect(page.getByRole('tooltip')).toContainText('Select all(control+a)');

    await page.mouse.move(0, 0);

    await page.getByTestId('select-all-button').click();

    await expect(page.getByTestId('select-all-badge')).toContainText('1');

});


test('switch between count', async ({ page }) => {

    await page.goto('http://localhost:3000/');
    const documentationButton = page.getByTestId('open-example-project');
    await documentationButton.click();

    await page.getByText('Images with Objects').click();
    await page.getByText('Malaria infected human blood smears').click();

    await expect(page).toHaveURL(/\/project/);
    await page.getByText('deserializing image').waitFor({ state: 'hidden' });

    await page.getByTestId('select-all-button').hover();
    await expect(page.getByRole('tooltip')).toContainText('Select all(control+a)');

    await page.mouse.move(0, 0);

    await page.getByTestId('select-all-button').click();

    await expect(page.getByTestId('select-all-badge')).toContainText('1');

    await page.getByText('Infected',{ exact: true }).click();

    //await page.getByTestId('select-all-button').click();
    await expect(page.getByTestId('select-all-badge')).toContainText('1');
});