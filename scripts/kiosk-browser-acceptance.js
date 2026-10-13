/* eslint-disable no-console */
const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const screenshotDir = path.join(root, "docs", "qa", "kiosk-stage2");
const port = Number(process.env.KIOSK_QA_PORT || 4178);
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
  const safeFile = resolved.startsWith(`${buildDir}${path.sep}`) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()
    ? resolved
    : path.join(buildDir, "index.html");
  response.writeHead(200, {
    "Content-Type": mime(safeFile),
    "Cache-Control": "no-store",
  });
  fs.createReadStream(safeFile).pipe(response);
});

const readyOperation = {
  operation_id: 81,
  appointment_id: 19,
  state: "ready",
  paid: false,
  can_initiate: true,
  base_cents: 10000,
  extra_cents: 1000,
  tip_cents: 0,
  subtotal_cents: 11000,
  total_cents: 11000,
  currency: "CAD",
  automatic_tax_enabled: true,
  display: {
    business_name: "Harbor Portrait Studio",
    service_name: "Portrait session",
    appointment_date: "October 18, 2026",
    appointment_time: "2:00 PM",
  },
};

const paidOperation = {
  ...readyOperation,
  state: "paid",
  paid: true,
  can_initiate: false,
  tip_cents: 1650,
  total_cents: 12995,
  tax_cents: 345,
  receipt_reference: "pi_qa_safe_reference",
};

const booking = {
  id: 19,
  status: "booked",
  payment_status: "unpaid",
  local_date: "2026-10-18",
  local_start_time: "14:00",
  local_end_time: "15:00",
  start_iso_local: "2026-10-18T14:00:00-04:00",
  end_iso_local: "2026-10-18T15:00:00-04:00",
  appointment_timezone: "America/Toronto",
  currency: "CAD",
  base_amount_cents: 10000,
  remaining_balance_cents: 11000,
  service: { id: 4, name: "Portrait session", base_price: 100 },
  client: { id: 42, full_name: "Ada Client", email: "ada@example.test", phone: "555-0100" },
  recruiter: { id: 7, full_name: "Riley Artist" },
};

const client360 = {
  client: {
    id: 42,
    first_name: "Ada",
    last_name: "Client",
    email: "ada@example.test",
    phone: "555-0100",
    status: "active",
    booking_access: { blocked: false, reason_label: "", note: "" },
  },
  summary: {
    appointments: 1,
    upcoming_appointments: 1,
    unpaid_balance: 110,
    open_invoice_count: 0,
    open_work_order_count: 0,
    no_show_count: 0,
    cancelled_count: 0,
    has_card_on_file: false,
  },
  auth: { has_login: false },
  card_on_file: null,
  action_readiness: {
    collect_payment: { state: "recommended", appointment_id: 19, reason: "Collect remaining balance." },
    create_invoice: { state: "ready", appointment_id: 19 },
    create_estimate: { state: "ready" },
    send_payment_link: { state: "ready" },
    mark_paid_offline: { state: "ready", appointment_id: 19 },
  },
  bookings: {
    upcoming: [{
      id: 19,
      service: "Portrait session",
      client_name: "Ada Client",
      client_email: "ada@example.test",
      client_phone: "555-0100",
      provider: "Riley Artist",
      status: "booked",
      payment_status: "unpaid",
      base_amount: 100,
      remaining_balance_cents: 11000,
      currency: "CAD",
      start_iso: "2026-10-18T18:00:00Z",
    }],
    past: [],
  },
  finance: { quote_requests: [], estimates: [], invoices: [] },
  work_orders: [],
  notes: [],
  session_history: [],
  timeline: [],
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
      || url.hostname === "scheduling-application.onrender.com";
    if (!isApiOrigin) {
      request.continue();
      return;
    }
    const route = url.pathname;
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
    } else if (route === "/api/kiosk/status") {
      jsonResponse(request, 200, state.operation);
    } else if (route === "/api/kiosk/checkout-session") {
      state.operation = { ...readyOperation, state: "awaiting_payment", can_initiate: true };
      jsonResponse(request, 200, {
        operation: state.operation,
        url: `${baseUrl}/kiosk/pay/qa-token?stripe=cancelled`,
      });
    } else if (route === "/auth/me") {
      jsonResponse(request, 200, {
        id: 1,
        email: "manager@example.test",
        is_manager: true,
        is_primary: true,
        company_id: 36,
        can_manage_shifts: true,
      });
    } else if (route === "/billing/status") {
      jsonResponse(request, 200, { active: true, status: "active", plan: "pro" });
    } else if (route === "/api/manager/bookings") {
      jsonResponse(request, 200, [booking]);
    } else if (route === "/api/departments") {
      jsonResponse(request, 200, [{ id: 2, name: "Studio" }]);
    } else if (route === "/manager/recruiters") {
      jsonResponse(request, 200, { recruiters: [{ id: 7, first_name: "Riley", last_name: "Artist", department_id: 2, timezone: "America/Toronto" }] });
    } else if (route === "/api/manager/bookings/19/kiosk-token") {
      state.managerLaunches += 1;
      jsonResponse(request, 200, { token: "qa-token" });
    } else if (route === "/api/manager/client-360/42") {
      jsonResponse(request, 200, client360);
    } else if (route === "/api/manager/client-360") {
      jsonResponse(request, 200, { items: [client360.client], pagination: { total: 1, page: 1, per_page: 25 } });
    } else if (/^\/api\/manager\/client-360\/42\/(field-photos|documents|document-requests)$/.test(route)) {
      jsonResponse(request, 200, route.endsWith("field-photos") ? { items: [], summary: {} } : route.endsWith("documents") ? { documents: [] } : { requests: [] });
    } else if (route === "/api/manager/client-360/42/photo-share-link") {
      jsonResponse(request, 200, {});
    } else if (route === "/api/manager/client-360/email-templates") {
      jsonResponse(request, 200, { templates: [] });
    } else {
      jsonResponse(request, 200, {});
    }
  });
};

const setManagerSession = async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("token", "qa-manager-token");
    localStorage.setItem("role", "manager");
    localStorage.setItem("company_id", "36");
  });
};

const openPage = async (browser, state, viewport) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await installApiMocks(page, state);
  return page;
};

const waitForText = async (page, text, timeout = 15000) => {
  try {
    return await page.waitForFunction(
      (value) => document.body.innerText.includes(value),
      { timeout },
      text,
    );
  } catch (error) {
    const context = await page.evaluate(() => ({ url: window.location.href, text: document.body.innerText.slice(0, 1200) }));
    throw new Error(`Timed out waiting for "${text}". Browser context: ${JSON.stringify(context)}\n${error.message}`);
  }
};

const assertNoOverflow = async (page, label) => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(dimensions.scrollWidth <= dimensions.clientWidth + 1, `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`);
};

const clickByText = async (page, text) => {
  const clicked = await page.evaluate((label) => {
    const candidates = [...document.querySelectorAll("button, [role='button'], a, label")];
    const target = candidates.find((node) => node.textContent.trim().includes(label));
    if (!target) return false;
    target.click();
    return true;
  }, text);
  assert(clicked, `Could not find action containing: ${text}`);
};

const runCustomerAcceptance = async (browser) => {
  const viewports = [
    ["phone-390", { width: 390, height: 844 }],
    ["phone-475", { width: 475, height: 900 }],
    ["tablet", { width: 768, height: 1024 }],
    ["desktop", { width: 1440, height: 1000 }],
  ];
  for (const [label, viewport] of viewports) {
    const state = { operation: readyOperation, managerLaunches: 0 };
    const page = await openPage(browser, state, viewport);
    await page.goto(`${baseUrl}/kiosk/pay/qa-token`, { waitUntil: "networkidle0" });
    await waitForText(page, "Would you like to leave a tip?");
    await assertNoOverflow(page, label);
    const controls = await page.evaluate(() => ({
      noTipSelected: document.querySelector('button[aria-label="No tip"]')?.getAttribute("aria-pressed"),
      minTipHeight: Math.min(...[...document.querySelectorAll('[role="group"][aria-label="Tip amount"] button')].map((node) => node.getBoundingClientRect().height)),
      ctaHeight: [...document.querySelectorAll("button")].find((node) => node.textContent.includes("Continue to secure"))?.getBoundingClientRect().height,
    }));
    assert(controls.noTipSelected === "true", `${label}: No tip must be selected by default`);
    assert(controls.minTipHeight >= 48, `${label}: tip targets are smaller than 48px`);
    assert(controls.ctaHeight >= 48, `${label}: primary CTA is smaller than 48px`);
    await page.screenshot({ path: path.join(screenshotDir, `${label}.png`), fullPage: true });
    await page.close();
  }

  const state = { operation: readyOperation, managerLaunches: 0 };
  const page = await openPage(browser, state, { width: 390, height: 844 });
  await page.goto(`${baseUrl}/kiosk/pay/qa-token`, { waitUntil: "networkidle0" });
  await clickByText(page, "15%");
  await waitForText(page, "16.50 CAD");
  await clickByText(page, "Custom");
  await page.waitForSelector('input[inputmode="decimal"]');
  await page.type('input[inputmode="decimal"]', "12.34");
  await waitForText(page, "12.34 CAD");
  await clickByText(page, "Continue to secure card payment");
  await new Promise((resolve) => setTimeout(resolve, 750));
  if (!page.url().includes("stripe=cancelled")) {
    // Model the customer pressing Stripe Checkout's Back button when the test
    // browser does not follow a mocked cross-origin redirect.
    await page.goto(`${baseUrl}/kiosk/pay/qa-token?stripe=cancelled`, { waitUntil: "networkidle0" });
  }
  await waitForText(page, "A secure Checkout is already open");
  assert(state.operation.state === "awaiting_payment", "Cancel return did not recover the same awaiting operation");
  await page.screenshot({ path: path.join(screenshotDir, "cancel-recovery-phone.png"), fullPage: true });
  await page.close();

  const paidState = { operation: paidOperation, managerLaunches: 0 };
  const paidPage = await openPage(browser, paidState, { width: 475, height: 900 });
  await paidPage.goto(`${baseUrl}/kiosk/success?token=qa-token`, { waitUntil: "networkidle0" });
  await waitForText(paidPage, "Payment confirmed");
  await waitForText(paidPage, "129.95 CAD");
  await assertNoOverflow(paidPage, "success-phone");
  await paidPage.screenshot({ path: path.join(screenshotDir, "confirmed-success-phone.png"), fullPage: true });
  await paidPage.close();
};

const runBookingCheckoutLauncher = async (browser) => {
  const state = { operation: readyOperation, managerLaunches: 0 };
  const page = await openPage(browser, state, { width: 1440, height: 1000 });
  await setManagerSession(page);
  await page.goto(`${baseUrl}/manager/booking-checkout?appointmentId=19`, { waitUntil: "networkidle0" });
  await waitForText(page, "Collect Payment", 25000);
  await clickByText(page, "Pay on this device (Kiosk)");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    clickByText(page, "Start kiosk checkout"),
  ]);
  await waitForText(page, "Would you like to leave a tip?", 20000);
  const handoff = await page.evaluate(() => ({ token: localStorage.getItem("token"), pathname: window.location.pathname }));
  assert(handoff.token === null, "Booking Checkout handoff retained manager credentials");
  assert(handoff.pathname === "/kiosk/pay/qa-token", `Unexpected Booking Checkout handoff path: ${handoff.pathname}`);
  assert(state.managerLaunches === 1, "Booking Checkout did not create exactly one Kiosk token");
  await page.screenshot({ path: path.join(screenshotDir, "booking-checkout-handoff.png"), fullPage: true });
  await page.close();
};

const runClient360Launcher = async (browser) => {
  const state = { operation: readyOperation, managerLaunches: 0 };
  const page = await openPage(browser, state, { width: 768, height: 1024 });
  await setManagerSession(page);
  await page.goto(`${baseUrl}/manager/clients/42`, { waitUntil: "networkidle0" });
  await waitForText(page, "Ada Client", 25000);
  const quickActions = await page.$x("//button[contains(., 'Quick Actions')]");
  if (quickActions[0]) await quickActions[0].click();
  const collectButtons = await page.$x("//button[contains(., 'Collect payment')]");
  assert(collectButtons.length > 0, "Client 360 Collect payment action was not available");
  await collectButtons[0].click();
  await waitForText(page, "Start kiosk checkout");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    clickByText(page, "Start kiosk checkout"),
  ]);
  await waitForText(page, "Would you like to leave a tip?", 20000);
  const handoff = await page.evaluate(() => ({ token: localStorage.getItem("token"), pathname: window.location.pathname }));
  assert(handoff.token === null, "Client 360 handoff retained manager credentials");
  assert(handoff.pathname === "/kiosk/pay/qa-token", `Unexpected Client 360 handoff path: ${handoff.pathname}`);
  assert(state.managerLaunches === 1, "Client 360 did not create exactly one Kiosk token");
  await page.screenshot({ path: path.join(screenshotDir, "client-360-handoff-tablet.png"), fullPage: true });
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
    await runCustomerAcceptance(browser);
    await runBookingCheckoutLauncher(browser);
    await runClient360Launcher(browser);
    console.log("Kiosk browser acceptance passed: customer checkout, recovery, success, Booking Checkout, and Client 360.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
};

main().catch((error) => {
  console.error(error.stack || error);
  server.close(() => process.exit(1));
});
