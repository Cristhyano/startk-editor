import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("smoke: editor flows", async ({ page }) => {
    await page.goto("/");

    const textboxes = page.getByRole("textbox");
    const left = textboxes.nth(0);
    const center = textboxes.nth(1);
    const bottom = textboxes.nth(2);
    const right = textboxes.nth(3);

    await left.fill("Rascunho 1");
    await center.fill("# Title\nitem one");
    await center.focus();
    await center.evaluate((el) => {
        const pos = "# Title\n".length + 1;
        el.selectionStart = pos;
        el.selectionEnd = pos;
    });
    await page.keyboard.press("Control+Shift+C");

    await center.evaluate((el) => {
        const pos = el.value.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
    });
    await page.keyboard.press("Enter");
    await expect(center).toHaveValue(/- \[ \] $/m);
    await center.evaluate((el) => {
        const pos = el.value.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
    });
    await page.keyboard.type("item two");

    await center.evaluate((el) => {
        const pos = "# Title\n- [ ] item one\n".length + 1;
        el.selectionStart = pos;
        el.selectionEnd = pos;
    });
    await page.keyboard.press("Control+Shift+C");

    await center.press("Control+A");
    await page.keyboard.press("Tab");
    await expect(center).toHaveValue(
        "  # Title\n  - [ ] item one\n  - [x] item two",
    );
    await center.press("Control+A");
    await page.keyboard.press("Shift+Tab");
    await expect(center).toHaveValue("# Title\n- [ ] item one\n- [x] item two");

    await page.keyboard.press("Control+ArrowRight");
    await expect(center).toHaveValue("");
    await expect(right).toHaveValue("# Title\n- [ ] item one\n- [x] item two");

    await page.keyboard.press("Control+Shift+ArrowLeft");
    await expect(center).toHaveValue("# Title\n- [ ] item one\n- [x] item two");
    await expect(right).toHaveValue("");

    await page.keyboard.press("Control+ArrowDown");
    await expect(bottom).toHaveValue("# Title\n- [ ] item one\n- [x] item two");
    await expect(bottom).toHaveValue("", { timeout: 7000 });

    await center.focus();
    await page.keyboard.press("Control+Shift+ArrowRight");
    await expect(center).toHaveValue("Rascunho 1");
    await expect(left).toHaveValue("");

    await page.keyboard.press("Control+ArrowRight");
    await expect(right).toHaveValue("Rascunho 1");

    await page.keyboard.press("Control+Alt+N");
    await expect(page.getByRole("button", { name: "DEF 2" })).toBeVisible();
    await right.fill("Definitivo 2");

    await page.keyboard.press("Control+Alt+ArrowLeft");
    await expect(right).toHaveValue("Rascunho 1");

    await page.keyboard.press("Control+Alt+ArrowRight");
    await expect(right).toHaveValue("Definitivo 2");

    page.once("dialog", (dialog) => dialog.accept());
    await page.keyboard.press("Control+Alt+Shift+Backspace");
    await expect(page.getByRole("button", { name: "DEF 2" })).toHaveCount(0);

    await right.fill("# Heading\n- item\n- [x] done\n**bold** *italic* `code`");
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByText("Heading")).toBeVisible();
    await expect(page.getByText("item")).toBeVisible();
    await expect(page.getByText("done")).toBeVisible();
    await expect(page.locator("strong", { hasText: "bold" })).toBeVisible();
    await expect(page.locator("em", { hasText: "italic" })).toBeVisible();
    await expect(page.locator("code", { hasText: "code" })).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).click();

    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Export" }).click(),
    ]);
    await expect(download.suggestedFilename()).toBe("stark-editor-state.json");

    const importPayload = {
        left: "Left import",
        bottom: "Bottom import",
        center: "Center import",
        definitives: [
            { title: "DEF 1", content: "Imported DEF 1" },
            { title: "DEF 2", content: "Imported DEF 2" },
        ],
        activeIndex: 1,
    };
    const importPath = test.info().outputPath("import-test.json");
    await fs.writeFile(importPath, JSON.stringify(importPayload, null, 2));

    const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByRole("button", { name: "Import" }).click(),
    ]);
    await chooser.setFiles(importPath);

    await expect(left).toHaveValue("Left import");
    await expect(center).toHaveValue("Center import");
    await expect(bottom).toHaveValue("Bottom import");
    await expect(page.getByRole("button", { name: "DEF 2" })).toBeVisible();
    await expect(right).toHaveValue("Imported DEF 2");

    await page.getByRole("button", { name: "DEF 1" }).click();
    await expect(right).toHaveValue("Imported DEF 1");

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(left).toHaveValue("");
    await expect(center).toHaveValue("");
    await expect(bottom).toHaveValue("");
    await expect(page.getByRole("button", { name: "DEF 2" })).toHaveCount(0);
});
