import { test, expect } from '@playwright/test';


test('Start New Project Flow', async ({ page }) => {

    await page.goto('http://localhost:3000/project');
    const newButton = page.getByRole('button', { name: 'New' });
    await expect(newButton).toBeVisible();
    await newButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('textbox');
    await input.fill('Test Project');

    const cancelButton = dialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await expect(dialog).not.toBeVisible();

    await newButton.click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox').fill('Test Project Piximi');
    const createButton = dialog.getByRole('button', { name: /create/i });
    await createButton.click();

    const confirmReplaceDialogBox = page.getByTestId('confirm-replace-dialog');
    const confirmDialogConfirmButton = confirmReplaceDialogBox.getByRole('button', { name: /confirm/i });
    await confirmDialogConfirmButton.click();

    await expect(confirmReplaceDialogBox).not.toBeVisible();

    // const nameInput = page.locator('#name');
    // const value = await nameInput.inputValue();
    // console.log("the value is: " + value);

});
