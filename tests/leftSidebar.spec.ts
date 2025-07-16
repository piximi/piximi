import { chromium } from 'playwright';
import { test } from 'vitest';
import {  expect } from 'playwright/test';

test('Start New Project Flow', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

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


test('should open menu when Open button is clicked', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:3000/project');
    const openButton = page.getByRole('button', { name: /open/i });

    await expect(openButton).toBeVisible();
    await expect(openButton).toBeEnabled();

    const menu = page.locator('[role="menu"]').first();
    await expect(menu).not.toBeVisible();

    await openButton.click();

    await expect(menu).toBeVisible();

    const projectMenuItem = page.getByRole('menuitem', { name: /project/i });
    const imageMenuItem = page.getByRole('menuitem', { name: /image/i });
    const annotationMenuItem = page.getByRole('menuitem', { name: /annotation/i });

    await expect(projectMenuItem).toBeVisible();
    await expect(imageMenuItem).toBeVisible();
    await expect(annotationMenuItem).toBeVisible();

});

