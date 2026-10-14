/* eslint-disable no-console */
const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const screenshotDir = process.env.MANUAL_SHIPPING_QA_SCREENSHOT_DIR
  || path.join(root, "docs", "qa", "manual-shipping");
const port = Number(process.env.MANUAL_SHIPPING_QA_PORT || 4182);
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

const shippingSettings = {
  enabled: true,
  allow_pickup: true,
  allow_shipping: true,
  allow_local_delivery: false,
  easypost_enabled: false,
  manual_shipping_pricing_enabled: true,
  manual_shipping_flat_rate_cents: 1500,
  manual_shipping_free_threshold_cents: 10000,
  manual_shipping_currency: "CAD",
  business_currency: "CAD",
  origin_country: "CA",
  destination_policy_mode: "domestic_only",
  allowed_destination_countries: ["CA"],
  country_catalog: [{ code: "CA", label: "Canada" }],
  package_profiles: [],
  updated_at: "2026-10-13T12:00:00Z",
};

const deliveryMethods = {
  delivery_enabled: true,
  automation_mode: "manual",
  methods: [
    { code: "pickup", label: "Pickup", enabled: true },
    { code: "shipping", label: "Shipping", enabled: true },
  ],
  effective_method_codes: ["pickup", "shipping"],
  allowed_destination_countries: ["CA"],
  allowed_destination_country_options: [{ code: "CA", label: "Canada" }],
  country_catalog: [{ code: "CA", label: "Canada" }],
  origin_country: "CA",
  address_verification_enabled: false,
  manual_shipping_pricing: {
    enabled: true,
    flat_rate_cents: 1500,
    free_threshold_cents: 10000,
    currency: "CAD",
  },
};

const installApiMocks = async (page) => {
  const refundAcceptance = {
    requests: [],
    providerEffects: 0,
    responseLost: false,
  };
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
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
    if (route === "/auth/me" || route === "/me") {
      jsonResponse(request, 200, {
        id: 7,
        email: "manager@example.test",
        full_name: "QA Manager",
        is_manager: true,
        is_primary: true,
        role: "manager",
        company_id: 36,
      });
    } else if (route === "/connect/status") {
      jsonResponse(request, 200, {
        connected: true,
        charges_enabled: true,
        payouts_enabled: true,
      });
    } else if (route === "/inventory/product-orders" && request.method() === "GET") {
      jsonResponse(request, 200, {
        orders: [{
          id: 901,
          company_id: 36,
          client_name: "Refund QA Customer",
          delivery_method: "shipping",
          fulfillment_status: "pending",
          payment_status: "paid",
          total_amount: 95,
          stripe_total_cents: 9500,
          refunded_cents: refundAcceptance.providerEffects ? 4000 : 0,
          currency: "CAD",
        }],
        pagination: { total: 1 },
        company: { id: 36, country_code: "CA" },
      });
    } else if (route === "/inventory/product-orders/901" && request.method() === "GET") {
      jsonResponse(request, 200, {
        id: 901,
        company_id: 36,
        client_name: "Refund QA Customer",
        delivery_method: "shipping",
        fulfillment_status: "pending",
        payment_status: refundAcceptance.providerEffects ? "partially_refunded" : "paid",
        total_amount: 95,
        stripe_total_cents: 9500,
        refunded_cents: refundAcceptance.providerEffects ? 4000 : 0,
        currency: "CAD",
        payment_intent_id: "pi_mocked_refund_recovery",
        inventory_committed: true,
        items: [],
        payments: [{ provider: "stripe", status: "captured", currency: "CAD" }],
        events: [],
        company: { id: 36, timezone: "America/Toronto" },
      });
    } else if (route === "/inventory/product-orders/901/refund" && request.method() === "POST") {
      const payload = JSON.parse(request.postData() || "{}");
      refundAcceptance.requests.push(payload);
      if (!refundAcceptance.responseLost) {
        refundAcceptance.responseLost = true;
        refundAcceptance.providerEffects = 1;
        request.abort("failed");
      } else {
        jsonResponse(request, 200, {
          message: "Refund recovered",
          idempotent_replay: true,
          refund_operation: { state: "succeeded", amount_cents: 4000, currency: "CAD" },
          refund_transaction: {
            id: 1901,
            amount_cents: 4000,
            currency: "CAD",
            provider: "stripe",
            status: "refunded",
          },
        });
      }
    } else if (route === "/billing/status") {
      jsonResponse(request, 200, { active: true, status: "active", plan: "pro" });
    } else if (route === "/inventory/shipping-settings") {
      jsonResponse(request, 200, shippingSettings);
    } else if (route === "/inventory/shipping-settings/manual-pricing-preview") {
      jsonResponse(request, 200, {
        eligible: true,
        reason: "flat_charge",
        eligible_subtotal_cents: 8000,
        shipping_amount_cents: 1500,
        remaining_for_free_shipping_cents: 2000,
        threshold_cents: 10000,
        currency: "CAD",
        pricing_version: "manual_flat_rate_v1",
      });
    } else if (route === "/public/vandaorchidjewels/company-info") {
      jsonResponse(request, 200, {
        company_name: "Vanda Orchid Jewellery",
        display_currency: "CAD",
        country_code: "CA",
        enable_product_payments: true,
        enable_stripe_payments: true,
        booking_hold_minutes: 10,
      });
    } else if (route === "/public/vandaorchidjewels/payments-policy") {
      jsonResponse(request, 200, {
        product_checkout: { enabled: true, mode: "pay", requires_payment_during_checkout: true },
      });
    } else if (route === "/public/vandaorchidjewels/reviews-settings") {
      jsonResponse(request, 200, { include_tip_checkout: false });
    } else if (route === "/public/vandaorchidjewels/delivery-methods") {
      jsonResponse(request, 200, deliveryMethods);
    } else if (route === "/public/vandaorchidjewels/products/1") {
      jsonResponse(request, 200, { id: 1, name: "Silver pendant", base_price: 80, is_digital: false });
    } else if (route === "/public/vandaorchidjewels/shipping/manual-estimate") {
      jsonResponse(request, 200, {
        eligible: true,
        reason: "flat_charge",
        eligible_subtotal_cents: 8000,
        shipping_amount_cents: 1500,
        remaining_for_free_shipping_cents: 2000,
        threshold_cents: 10000,
        currency: "CAD",
        pricing_version: "manual_flat_rate_v1",
        estimate_token: "signed-server-estimate",
      });
    } else if (route.includes("/website-shell") || route.includes("/website")) {
      jsonResponse(request, 200, {});
    } else {
      jsonResponse(request, 200, {});
    }
  });
  return refundAcceptance;
};

const waitForText = async (page, text, timeout = 30000) => {
  try {
    await page.waitForFunction(
      (value) => document.body.innerText.toLowerCase().includes(value.toLowerCase()),
      { timeout },
      text,
    );
  } catch (error) {
    const context = await page.evaluate(() => ({
      url: window.location.href,
      text: document.body.innerText.slice(0, 2000),
    }));
    throw new Error(`Timed out waiting for "${text}". ${JSON.stringify(context)}\n${error.message}`);
  }
};

const assertNoOverflow = async (page, label) => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(
    dimensions.scrollWidth <= dimensions.clientWidth + 1,
    `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`,
  );
};

const openManagerSettings = async (browser, viewport, label) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await installApiMocks(page);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("token", "qa-manager-token");
    localStorage.setItem("role", "manager");
    localStorage.setItem("company_id", "36");
  });
  await page.goto(`${baseUrl}/manager/advanced-management?panel=easypost-shipping`, { waitUntil: "networkidle0" });
  await waitForText(page, "Manual shipping pricing");
  const values = await page.evaluate(() => {
    const valueForLabel = (text) => {
      const label = [...document.querySelectorAll("label")]
        .find((node) => node.textContent.trim().includes(text));
      if (!label || !label.htmlFor) return undefined;
      const input = document.getElementById(label.htmlFor);
      return input ? input.value : undefined;
    };
    return {
      flat: valueForLabel("Flat charge (CAD)"),
      threshold: valueForLabel("Free shipping from"),
    };
  });
  assert(values.flat === "15.00", `${label}: flat charge did not reload from server settings`);
  assert(values.threshold === "100.00", `${label}: free threshold did not reload from server settings`);
  const previewClicked = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")]
      .find((node) => node.textContent.trim() === "Preview");
    if (!button) return false;
    button.click();
    return true;
  });
  assert(previewClicked, `${label}: server pricing simulator was unavailable`);
  await waitForText(page, "more for free shipping");
  await assertNoOverflow(page, `${label} manager settings`);
  await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, div")]
      .find((node) => node.textContent.trim() === "Manual shipping pricing");
    if (heading) heading.scrollIntoView({ block: "start" });
  });
  await page.screenshot({ path: path.join(screenshotDir, `${label}-manager.png`), fullPage: false });
  await page.close();
};

const openCustomerCheckout = async (browser, viewport, label) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await installApiMocks(page);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    sessionStorage.setItem("schedulaa:booking-cart-tenant", "vandaorchidjewels");
    sessionStorage.setItem("booking_cart", JSON.stringify([{
      id: "product-1",
      type: "product",
      product_id: 1,
      name: "Silver pendant",
      price: 80,
      quantity: 1,
      is_digital: false,
    }]));
    localStorage.setItem("site", "vandaorchidjewels");
    localStorage.setItem("checkout_product_delivery_prefill", JSON.stringify({
      delivery_method: "shipping",
      shipping: {
        name: "Jordan Customer",
        phone: "+14165550123",
        address1: "100 Queen St W",
        city: "Toronto",
        region: "ON",
        postal_code: "M5H 2N2",
        country: "CA",
      },
    }));
  });
  await page.goto(`${baseUrl}/vandaorchidjewels/basket`, { waitUntil: "networkidle0" });
  await waitForText(page, "Silver pendant");
  await page.waitForFunction(() => [...document.querySelectorAll("button")]
    .some((node) => /proceed to checkout/i.test(node.textContent) && !node.disabled));
  const clicked = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")]
      .find((node) => /proceed to checkout/i.test(node.textContent) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  });
  assert(clicked, `${label}: checkout action was not available`);
  await waitForText(page, "fixed shipping charge");
  await waitForText(page, "CA$15.00");
  await waitForText(page, "CA$20.00 more");
  await waitForText(page, "CA$95.00");
  const text = await page.evaluate(() => document.body.innerText);
  assert(!text.includes("Shipping: Free"), `${label}: paid shipping was labelled free`);
  await assertNoOverflow(page, `${label} customer checkout`);
  await page.screenshot({ path: path.join(screenshotDir, `${label}-checkout.png`), fullPage: true });
  await page.close();
};

const clickByText = async (page, selector, text) => {
  const clicked = await page.evaluate((candidateSelector, candidateText) => {
    const node = [...document.querySelectorAll(candidateSelector)]
      .find((entry) => entry.textContent.trim().toLowerCase() === candidateText.toLowerCase());
    if (!node || node.disabled) return false;
    node.click();
    return true;
  }, selector, text);
  assert(clicked, `Could not click ${selector} labelled "${text}"`);
};

const openManagerRefundRecovery = async (browser, viewport, label) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const acceptance = await installApiMocks(page);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const claims = btoa(JSON.stringify({ sub: "qa-manager-7", company_id: 36 })).replace(/=/g, "");
    localStorage.setItem("token", `header.${claims}.signature`);
    localStorage.setItem("role", "manager");
    localStorage.setItem("company_id", "36");
  });
  const route = `${baseUrl}/manager/advanced-management?panel=product-orders`;
  await page.goto(route, { waitUntil: "networkidle0" });
  await waitForText(page, "Product Orders");
  await waitForText(page, "Refund QA Customer");
  await clickByText(page, "button", "#901");
  await waitForText(page, "Order #901");
  await clickByText(page, "button, [role=tab]", "Actions");
  await waitForText(page, "Add to timeline");
  await clickByText(page, "button, h6, p, span", "Refund");
  const amountInputId = await page.evaluate(() => {
    const labelNode = [...document.querySelectorAll("label")]
      .find((node) => node.textContent.trim() === "Amount");
    return labelNode && labelNode.htmlFor ? labelNode.htmlFor : null;
  });
  assert(amountInputId, `${label}: refund amount input was unavailable`);
  await page.evaluate((inputId) => {
    const input = document.getElementById(inputId);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, "40.00");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, amountInputId);
  await clickByText(page, "button", "Record refund");
  await waitForText(page, "Retry this same refund to check its status");

  await page.reload({ waitUntil: "networkidle0" });
  await waitForText(page, "Product Orders");
  await waitForText(page, "Refund QA Customer");
  await clickByText(page, "button", "#901");
  await waitForText(page, "Order #901");
  await clickByText(page, "button, [role=tab]", "Actions");
  await waitForText(page, "Add to timeline");
  await clickByText(page, "button, h6, p, span", "Refund");
  await waitForText(page, "Check refund status");
  await clickByText(page, "button", "Check refund status");
  await waitForText(page, "Refund recovered");

  assert(acceptance.providerEffects === 1, `${label}: response loss produced more than one provider effect`);
  assert(acceptance.requests.length === 2, `${label}: expected one submit and one recovery request`);
  assert(
    acceptance.requests[0].idempotency_key === acceptance.requests[1].idempotency_key,
    `${label}: refund recovery rotated its idempotency key`,
  );
  assert(
    JSON.stringify(acceptance.requests[0]) === JSON.stringify(acceptance.requests[1]),
    `${label}: refund recovery changed its frozen payload`,
  );
  await assertNoOverflow(page, `${label} Product Order refund recovery`);
  await page.screenshot({ path: path.join(screenshotDir, `${label}-refund-recovery.png`), fullPage: true });
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
    await openManagerSettings(browser, { width: 390, height: 844 }, "mobile-390");
    await openManagerSettings(browser, { width: 1440, height: 1000 }, "desktop-1440");
    await openCustomerCheckout(browser, { width: 390, height: 844 }, "mobile-390");
    await openCustomerCheckout(browser, { width: 1440, height: 1000 }, "desktop-1440");
    await openManagerRefundRecovery(browser, { width: 390, height: 844 }, "mobile-390");
    await openManagerRefundRecovery(browser, { width: 1440, height: 1000 }, "desktop-1440");
    console.log("Manual shipping browser acceptance passed at mobile and desktop sizes.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
};

main().catch((error) => {
  console.error(error.stack || error);
  server.close(() => process.exit(1));
});
