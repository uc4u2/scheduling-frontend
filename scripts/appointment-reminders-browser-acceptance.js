/* eslint-disable no-console */
const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const screenshotDir = process.env.APPOINTMENT_REMINDERS_QA_SCREENSHOT_DIR
  || path.join(root, "docs", "qa", "appointment-reminders");
const port = Number(process.env.APPOINTMENT_REMINDERS_QA_PORT || 4181);
const baseUrl = `http://127.0.0.1:${port}`;
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const mime = (filename) => ({
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
}[path.extname(filename)] || "application/octet-stream");

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, baseUrl).pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(buildDir, `.${requested}`);
  const safeFile = resolved.startsWith(`${buildDir}${path.sep}`)
    && fs.existsSync(resolved)
    && fs.statSync(resolved).isFile()
    ? resolved
    : path.join(buildDir, "index.html");
  response.writeHead(200, {
    "Content-Type": mime(safeFile),
    "Cache-Control": "no-store",
  });
  fs.createReadStream(safeFile).pipe(response);
});

const policyResponse = {
  settings: {
    email_enabled: false,
    first_enabled: true,
    first_hours_before: 24,
    second_enabled: true,
    second_hours_before: 2,
  },
  company_timezone: "America/Toronto",
  timezone_behavior: "Appointment times use the provider timezone, then the company timezone, then UTC.",
  bounds: { minimum_hours: 1, maximum_hours: 336 },
  updated_at: "2026-10-13T12:00:00Z",
  runtime_enabled: false,
  history: [{
    id: 91,
    appointment_id: 410,
    stage: "first",
    scheduled_for: "2026-10-14T18:00:00Z",
    appointment_start: "2026-10-15T18:00:00Z",
    status: "provider_accepted",
    reason_code: null,
  }],
  sms: { enabled: false, label: "Not configured / Coming soon" },
};

const bookingEmailResponse = {
  settings: {
    customer_opening_message: "",
    customer_preparation_instructions: "Please arrive five minutes early.",
    customer_closing_message: "",
    operational_opening_message: "",
    operational_closing_message: "",
    show_company_logo: false,
  },
  editable: true,
  limits: {},
  resolved_logo: { url: null, source: "none", source_label: "No company logo found" },
};

const jsonResponse = (request, status, body) => request.respond({
  status,
  contentType: "application/json",
  headers: {
    "Access-Control-Allow-Origin": baseUrl,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Company-Id",
  },
  body: JSON.stringify(body),
});

const installApiMocks = async (page, state) => {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isApiOrigin = url.origin === "http://127.0.0.1:5000"
      || url.hostname === "scheduling-application.onrender.com"
      || url.hostname === "api.schedulaa.com";
    if (!isApiOrigin) {
      request.continue();
      return;
    }
    if (request.method() === "OPTIONS") {
      request.respond({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": baseUrl,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Company-Id",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        },
      });
      return;
    }
    const route = url.pathname;
    if (route === "/auth/me") {
      jsonResponse(request, 200, {
        id: 7,
        email: "manager@example.test",
        is_manager: true,
        is_primary: true,
        role: "manager",
        company_id: 36,
      });
    } else if (route === "/billing/status") {
      jsonResponse(request, 200, { active: true, status: "active", plan: "pro" });
    } else if (route === "/api/manager/appointment-reminder-settings" && request.method() === "PUT") {
      state.saveCount += 1;
      state.savedPayload = JSON.parse(request.postData() || "{}");
      policyResponse.settings = { ...policyResponse.settings, ...state.savedPayload };
      policyResponse.updated_at = "2026-10-13T12:05:00Z";
      jsonResponse(request, 200, policyResponse);
    } else if (route === "/api/manager/appointment-reminder-settings") {
      jsonResponse(request, 200, policyResponse);
    } else if (route === "/api/manager/appointment-reminder-settings/preview") {
      state.previewCount += 1;
      jsonResponse(request, 200, {
        subject: "Appointment reminder: Signature Service with Harbor Studio",
        text: "Hi Jordan,\n\nYour appointment is Friday at 2:00 PM (America/Toronto).",
        timezone: "America/Toronto",
      });
    } else if (route === "/api/manager/booking-email-settings" && request.method() === "GET") {
      jsonResponse(request, 200, bookingEmailResponse);
    } else if (route === "/api/manager/booking-email-settings/preview") {
      jsonResponse(request, 200, {
        subject: "Booking confirmed",
        html: "<p>Booking confirmation preview</p>",
        text: "Booking confirmation preview",
      });
    } else {
      jsonResponse(request, 200, {});
    }
  });
};

const waitForText = async (page, text, timeout = 25000) => {
  try {
    await page.waitForFunction(
      (value) => document.body.innerText.toLowerCase().includes(value.toLowerCase()),
      { timeout },
      text,
    );
  } catch (error) {
    const context = await page.evaluate(() => ({
      url: window.location.href,
      text: document.body.innerText.slice(0, 1600),
    }));
    throw new Error(`Timed out waiting for "${text}". ${JSON.stringify(context)}\n${error.message}`);
  }
};

const clickByText = async (page, text) => {
  const clicked = await page.evaluate((label) => {
    const candidate = [...document.querySelectorAll("button, [role='button'], label")]
      .find((node) => node.textContent.trim().includes(label));
    if (!candidate) return false;
    candidate.click();
    return true;
  }, text);
  assert(clicked, `Could not find action containing: ${text}`);
};

const openSettings = async (browser, viewport) => {
  const state = { previewCount: 0, saveCount: 0, savedPayload: null };
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await installApiMocks(page, state);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("token", "qa-manager-token");
    localStorage.setItem("role", "manager");
    localStorage.setItem("company_id", "36");
  });
  await page.goto(`${baseUrl}/manager/settings?tab=booking-emails`, { waitUntil: "networkidle0" });
  await waitForText(page, "Appointment reminders");
  return { page, state };
};

const assertNoPageOverflow = async (page, label) => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(
    dimensions.scrollWidth <= dimensions.clientWidth + 1,
    `${label} has horizontal page overflow: ${JSON.stringify(dimensions)}`,
  );
};

const runViewport = async (browser, label, viewport) => {
  const { page, state } = await openSettings(browser, viewport);
  await waitForText(page, "Provider accepted");
  await waitForText(page, "Not configured / Coming soon");
  await waitForText(page, "Email reminder delivery is not active yet.");
  const pageText = await page.evaluate(() => document.body.innerText);
  assert(!pageText.includes("Worker/Beat"), `${label}: internal runtime wording is visible`);
  await assertNoPageOverflow(page, label);
  const accessibility = await page.evaluate(() => ({
    enableLabel: document.querySelector('input[aria-label="Enable appointment email reminders"]') !== null,
    smsLabel: document.querySelector('input[aria-label="SMS reminders coming soon"]') !== null,
    minButtonHeight: Math.min(...[...document.querySelectorAll("button")]
      .filter((button) => /Save reminder settings|Preview email/.test(button.textContent))
      .map((button) => button.getBoundingClientRect().height)),
  }));
  assert(accessibility.enableLabel, `${label}: email switch is not labelled`);
  assert(accessibility.smsLabel, `${label}: disabled SMS switch is not labelled`);
  assert(accessibility.minButtonHeight >= 36, `${label}: settings actions are too small`);

  await clickByText(page, "Preview email");
  await waitForText(page, "Preview — no email sent");
  assert(state.previewCount === 1, `${label}: preview should make exactly one preview request`);
  await page.screenshot({ path: path.join(screenshotDir, `${label}.png`), fullPage: true });
  await page.close();
};

const runSaveAcceptance = async (browser) => {
  const { page, state } = await openSettings(browser, { width: 390, height: 844 });
  await page.evaluate(() => {
    const input = document.querySelector('input[aria-label="Enable appointment email reminders"]');
    if (input) input.click();
  });
  await clickByText(page, "Save reminder settings");
  await waitForText(page, "Appointment reminder settings saved.");
  assert(state.saveCount === 1, "Save should make exactly one settings update request");
  assert(state.savedPayload?.email_enabled === true, "Save did not preserve the enabled state");
  assert(state.savedPayload?.expected_updated_at === "2026-10-13T12:00:00Z", "Save omitted optimistic settings version");
  await assertNoPageOverflow(page, "phone-save");
  await page.close();
};

const main = async () => {
  assert(fs.existsSync(path.join(buildDir, "index.html")), "Run the production build before browser acceptance.");
  assert(fs.existsSync(executablePath), `Chromium executable not found: ${executablePath}`);
  fs.mkdirSync(screenshotDir, { recursive: true });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    await runViewport(browser, "mobile-390", { width: 390, height: 844 });
    await runViewport(browser, "tablet-768", { width: 768, height: 1024 });
    await runViewport(browser, "desktop-1440", { width: 1440, height: 1000 });
    await runSaveAcceptance(browser);
    console.log("Appointment reminder browser acceptance passed at mobile, tablet, and desktop sizes.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
};

main().catch((error) => {
  console.error(error.stack || error);
  server.close(() => process.exit(1));
});
