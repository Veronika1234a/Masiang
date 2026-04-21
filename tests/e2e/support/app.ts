import { expect, type Page } from "@playwright/test";

export const SCHOOL_NPSN = "12345678";
export const SCHOOL_PASSWORD = "password123";
export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "password123";

type LoginRole = "school" | "admin";

export async function gotoPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: "commit" });
}

export async function submitLoginForm(
  page: Page,
  identity: string,
  password: string,
) {
  await gotoPath(page, "/login");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(350);
  await page.locator("#identity").click();
  await page.locator("#identity").pressSequentially(identity, { delay: 20 });
  await page.locator("#password").click();
  await page.locator("#password").pressSequentially(password, { delay: 20 });
  await expect(page.getByRole("button", { name: "Masuk" })).toBeEnabled();
  await page.getByRole("button", { name: "Masuk" }).click();
}

export async function login(
  page: Page,
  identity: string,
  password = SCHOOL_PASSWORD,
  role: LoginRole = identity === ADMIN_EMAIL ? "admin" : "school",
) {
  await submitLoginForm(page, identity, password);
  await expect(page).toHaveURL(
    role === "admin"
      ? /\/dashboard-admin(?:\?.*)?$/
      : /\/dashboard\/ringkasan(?:\?.*)?$/,
  );
}

export async function loginSchool(
  page: Page,
  npsn = SCHOOL_NPSN,
  password = SCHOOL_PASSWORD,
) {
  await login(page, npsn, password, "school");
}

export async function loginAdmin(
  page: Page,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
) {
  await login(page, email, password, "admin");
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await expect(page.getByLabel("NPSN / Email")).toBeVisible();
}

export async function openSchoolBookingPage(page: Page) {
  await page.goto("/dashboard/booking", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/dashboard\/booking$/);
}

export async function registerSchool(
  page: Page,
  data: {
    schoolName: string;
    npsn: string;
    contactName: string;
    phone: string;
    address: string;
    password: string;
  },
) {
  await gotoPath(page, "/daftar-sekolah");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(350);
  await page.locator("#schoolName").click();
  await page.locator("#schoolName").pressSequentially(data.schoolName, { delay: 20 });
  await page.locator("#npsn").click();
  await page.locator("#npsn").pressSequentially(data.npsn, { delay: 20 });
  await page.locator("#contactName").click();
  await page.locator("#contactName").pressSequentially(data.contactName, { delay: 20 });
  await page.locator("#phone").click();
  await page.locator("#phone").pressSequentially(data.phone, { delay: 20 });
  await page.locator("#address").click();
  await page.locator("#address").pressSequentially(data.address, { delay: 10 });
  await page.locator("#password").click();
  await page.locator("#password").pressSequentially(data.password, { delay: 20 });
  await page.locator("#confirmPassword").click();
  await page.locator("#confirmPassword").pressSequentially(data.password, { delay: 20 });
  await expect(page.getByRole("button", { name: "Daftar Sekolah" })).toBeEnabled();
  await page.getByRole("button", { name: "Daftar Sekolah" }).click();
}
