import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import CommerceCopilotDrawer from "./CommerceCopilotDrawer";

jest.setTimeout(30000);

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    patch: (...args) => mockApiPatch(...args),
  },
}));

const availableCapabilities = {
  availability: {
    available: true,
    chat_available: true,
    drafts_available: true,
    plans_available: true,
    write_actions_available: true,
    monetization_mode: "free_launch",
    access_source: "free_launch",
    provider_ready: true,
  },
  configuration: {
    global_feature_enabled: true,
    write_feature_enabled: true,
    openai_key_configured: true,
    model_configured: true,
    tenant_access_enabled: true,
    tenant_plan_allowed: true,
  },
  blockers: [],
  safe_message: null,
  billing: {
    ai_commerce_copilot: {
      monetization_mode: "free_launch",
      successful_actions_remaining: 100,
      successful_actions_used: 0,
      monthly_action_allowance: 100,
      addon_active: false,
      activation_available: false,
    },
  },
};

const renderDrawer = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <CommerceCopilotDrawer open onClose={jest.fn()} token="test-token" {...props} />
    </ThemeProvider>
  );

const guidedSession = {
  session: { public_id: "sess_1", workflow: "create_physical_product", status: "awaiting_manager", context_summary_json: { progress_percent: 55 } },
  messages: [
    {
      id: 1,
      role: "assistant",
      message_text:
        "Great — I understood that this is a physical product, the product looks like a necklace, the price is USD 50, you want to ship across Canada, you are only shipping domestically right now.\n\nI need 3 more details:\n1. What name should customers see?\n2. Do you want Schedulaa to track inventory?\n3. You mentioned 10 g or 50 g. What is the exact product weight without the box?\n\nYour shipping package also needs exact length, width, height, and empty-package weight. We can complete that next.",
      safe_metadata_json: {
        questions: [
          {
            question_id: "product_name",
            fact_key: "product_name",
            plain_language_question: "What name should customers see?",
            why_needed: "Customers will see this name in your storefront and at checkout.",
            input_type: "text",
            choices: [],
            allow_unknown: true,
            show_help_measure: false,
            help_text: null,
          },
          {
            question_id: "track_stock",
            fact_key: "track_stock",
            plain_language_question: "Do you want Schedulaa to track inventory?",
            why_needed: "Inventory tracking changes what stock details are required.",
            input_type: "yes_no",
            choices: [],
            allow_unknown: true,
            show_help_measure: false,
            help_text: null,
          },
          {
            question_id: "shipping_weight_grams",
            fact_key: "shipping_weight_grams",
            plain_language_question: "You mentioned 10 g or 50 g. What is the exact product weight without the box?",
            why_needed: "Carriers use the real weight to calculate accurate shipping prices.",
            input_type: "number",
            choices: [],
            allow_unknown: true,
            show_help_measure: true,
            help_text: "A small kitchen or postal scale works well. Enter grams or ounces and Schedulaa will normalize it.",
          },
        ],
      },
    },
  ],
  facts: [],
  draft: {
    public_id: "draft_1",
    status: "incomplete",
    validation_results_json: {
      progress_percent: 55,
      known: [{ key: "price" }, { key: "currency" }, { key: "is_digital" }],
      missing_required: [{ key: "product_name" }, { key: "track_stock" }],
      needs_confirmation: [{ key: "shipping_weight_grams" }],
    },
    draft_payload_json: {},
    presentation: {
      sections: {
        confirmed: [
          { fact_key: "price", label: "Price", display_value: "USD 50", raw_value: 50, editable: true },
          { fact_key: "is_digital", label: "Product type", display_value: "Physical", raw_value: false, editable: true },
          { fact_key: "domestic_destination_country", label: "Shipping area", display_value: "Canada", raw_value: "CA", editable: false },
        ],
        needs_confirmation: [
          { fact_key: "shipping_weight_grams", label: "Product weight", display_value: "You mentioned 10 g or 50 g", raw_value: null, editable: true },
          { fact_key: "package_length_mm", label: "Package length", display_value: "You mentioned 3 cm to 5 cm. Exact length, width, and height are still needed.", raw_value: null, editable: true },
        ],
        suggested: [
          { fact_key: "category", label: "Category", display_value: "Jewelry", raw_value: "Jewelry", editable: true },
          { fact_key: "product_title_candidate", label: "Product type/name suggestion", display_value: "Necklace", raw_value: "Necklace", editable: true },
        ],
        missing: [
          { fact_key: "product_name", label: "Product name", display_value: null, raw_value: null, editable: true },
          { fact_key: "track_stock", label: "Track inventory", display_value: null, raw_value: null, editable: true },
          { fact_key: "quantity", label: "Starting inventory", display_value: null, raw_value: null, editable: true },
          { fact_key: "package_tare_weight_grams", label: "Package empty weight", display_value: null, raw_value: null, editable: true },
        ],
      },
      activation_blockers: [
        {
          code: "package_profile_ready",
          plain_language_message: "A shipping package still needs to be created or selected.",
        },
      ],
    },
  },
  plan: null,
  approval: null,
  execution: null,
  usage_summary: { requests: 1, draft_generations: 1, plan_generations: 0, estimated_total_cost_micros: 1000 },
};

const shippingTestSession = {
  session: { public_id: "ship_1", workflow: "test_shipping_setup", status: "awaiting_manager", current_step: "shipping_test_setup", context_summary_json: { progress_percent: 100 } },
  messages: [],
  facts: [],
  draft: null,
  plan: null,
  approval: null,
  execution: null,
  usage_summary: { requests: 0, shipping_tests: 0 },
  shipping_test: {
    enabled: true,
    workspace_scope_note: "Package Profiles are workspace-level. Testing another package here does not attach it to this Product or change the workspace default.",
    country_catalog: [
      { code: "CA", label: "Canada" },
      { code: "US", label: "United States" },
    ],
    product_options: [
      { id: 60, name: "Smoky-Lemon Quartz Necklace", sku: "SMOKY-LEM-60", is_digital: false, shipping_weight_grams: 50, is_active: false },
    ],
    package_options: [
      { id: 9, name: "Small Jewelry Box", display_dimensions: "10 × 5 × 5 cm", tare_weight_display: "15 g", tare_weight_grams: 15, is_default: true },
    ],
    selected_product_id: 60,
    selected_package_profile_id: 9,
    draft: {
      product_id: 60,
      package_profile_id: 9,
      quantity: 1,
      save_destination: false,
      saved_destination: {
        address1: "777 Hornby St",
        city: "Vancouver",
        region: "BC",
        postal_code: "V6Z 1S4",
        country: "CA",
      },
    },
    preview: {
      total_weight_grams: 65,
      product_weight_display: "50 g × 1",
      tare_weight_display: "15 g",
      total_weight_display: "65 g",
    },
    links: {
      delivery_setup: "/manager/advanced-management?panel=easypost-shipping",
      product: "/manager/advanced-management?panel=products&editProductId=60",
    },
    address_review: null,
    result: null,
    result_stale: false,
    stale_message: "",
  },
};

const currencyQuestionSession = {
  session: { public_id: "sess_currency_1", workflow: "create_physical_product", status: "awaiting_manager", context_summary_json: { progress_percent: 25 } },
  messages: [
    {
      id: 1,
      role: "assistant",
      message_text: "I need one more detail: what currency should this product use?",
      safe_metadata_json: {
        questions: [
          {
            question_id: "currency",
            fact_key: "currency",
            plain_language_question: "What currency should this product use?",
            why_needed: "The selling price needs the correct currency.",
            input_type: "choice",
            choices: ["CAD", "USD"],
            allow_unknown: true,
            show_help_measure: false,
            help_text: null,
          },
        ],
      },
    },
  ],
  facts: [],
  draft: {
    public_id: "draft_currency_1",
    status: "incomplete",
    validation_results_json: {
      progress_percent: 25,
      known: [{ key: "price" }],
      missing_required: [{ key: "currency" }],
      needs_confirmation: [],
    },
    draft_payload_json: {},
    presentation: {
      sections: {
        confirmed: [
          { fact_key: "price", label: "Price", display_value: "10", raw_value: 10, editable: true },
        ],
        needs_confirmation: [],
        suggested: [],
        missing: [
          { fact_key: "currency", label: "Currency", display_value: null, raw_value: null, editable: true },
        ],
      },
      activation_blockers: [],
    },
  },
  plan: null,
  approval: null,
  execution: null,
  usage_summary: { requests: 1, draft_generations: 1, plan_generations: 0, estimated_total_cost_micros: 1000 },
};

const internationalExpansionSession = {
  session: { public_id: "intl_1", workflow: "international_expansion_assistant", status: "awaiting_manager", current_step: "international_review_results", context_summary_json: { progress_percent: 100 } },
  messages: [],
  facts: [],
  draft: null,
  plan: null,
  approval: null,
  execution: null,
  usage_summary: { requests: 0 },
  international_expansion: {
    enabled: true,
    selected_product_id: 60,
    draft: { product_id: 60, destinations: ["US", "GB", "QA"] },
    product_options: [
      { id: 60, name: "Travel Mug", sku: "MUG-60", is_digital: false, allow_international_shipping: true, shipping_weight_grams: 250 },
    ],
    country_catalog: [
      { code: "US", label: "United States" },
      { code: "GB", label: "United Kingdom" },
      { code: "QA", label: "Qatar" },
    ],
    recommended_destinations: [
      { label: "United States", codes: ["US"] },
      { label: "United Kingdom", codes: ["GB"] },
      { label: "Australia", codes: ["AU"] },
      { label: "European destinations", codes: ["DE", "FR"] },
    ],
    links: {
      delivery_setup: "/manager/advanced-management?panel=easypost-shipping",
      product: "/manager/advanced-management?panel=products&editProductId=60",
    },
    result_stale: false,
    stale_message: "",
    result: {
      product: { id: 60, name: "Travel Mug", is_digital: false, allow_international_shipping: true },
      origin: { code: "CA", label: "Canada" },
      common_readiness: {
        status: "needs_setup",
        items: [
          { code: "product_weight", label: "Product weight", status: "ready", message: "Product weight is present." },
          { code: "country_of_origin", label: "Country of origin", status: "missing", message: "Enter where the Product was manufactured or assembled." },
        ],
      },
      reviewed_destinations: [
        {
          code: "US",
          label: "United States",
          status: "ready_now",
          manager_label: "Configuration ready",
          summary: "Your current Product and shipping settings are configured for this destination.",
          shipping_test: { status: "passed", safe_summary: "3 services returned" },
          items: [],
        },
        {
          code: "GB",
          label: "United Kingdom",
          status: "not_enabled",
          manager_label: "Not enabled",
          summary: "United Kingdom is not included in your current destination policy.",
          shipping_test: { status: "not_tested", safe_summary: null },
          items: [
            { code: "destination_policy", label: "Destination country", message: "Add United Kingdom in Delivery Setup before offering shipping there." },
          ],
        },
        {
          code: "QA",
          label: "Qatar",
          status: "not_enabled",
          manager_label: "Not enabled",
          summary: "Qatar is not included in your current destination policy.",
          shipping_test: { status: "not_tested", safe_summary: null },
          items: [
            { code: "destination_policy", label: "Destination country", message: "Add Qatar in Delivery Setup before offering shipping there." },
          ],
        },
      ],
      available_actions: {
        help_finish_setup: true,
        open_product: true,
        open_delivery_setup: true,
        test_selected_destination: true,
        prepare_destination_enablement: false,
        copy_summary: true,
      },
      buyer_notice_preview: {
        display_lines: [
          "The carrier or customs authority may collect import duties, taxes, brokerage charges, or other fees separately before or at delivery.",
        ],
      },
      disclaimer: "Configuration ready means Product and Schedulaa settings are complete under the current supported checks. Carrier rates, Customs acceptance, and legal eligibility are not guaranteed.",
    },
  },
};

describe("CommerceCopilotDrawer", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiPost.mockReset();
    mockApiPatch.mockReset();
    window.innerWidth = 1280;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message, ...args) => {
      if (typeof message === "string" && message.includes("not wrapped in act")) {
        return;
      }
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    });
    mockApiGet.mockResolvedValue({ data: availableCapabilities });
    mockApiPatch.mockImplementation((url, body) =>
      Promise.resolve({
        data: {
          ...guidedSession,
          draft: {
            ...guidedSession.draft,
            presentation: {
              ...guidedSession.draft.presentation,
              sections: {
                ...guidedSession.draft.presentation.sections,
                confirmed: [
                  ...guidedSession.draft.presentation.sections.confirmed,
                  { fact_key: Object.keys(body)[0], label: "Product name", display_value: body.product_name || "Northern Lights Necklace", raw_value: body.product_name || "Northern Lights Necklace", editable: true },
                ],
              },
            },
          },
        },
      })
    );
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  test("shows quick starts and direct first-run input when fully available", async () => {
    renderDrawer();

    expect(await screen.findByText(/what would you like help with/i)).toBeInTheDocument();
    expect(screen.getByText(/included during free launch/i)).toBeInTheDocument();
    expect(screen.getByText(/create a physical product/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /or describe what you need/i })).toBeInTheDocument();
    expect(screen.queryByText(/preview only/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not available right now/i)).not.toBeInTheDocument();
    expect(screen.getByText(/test my shipping setup/i)).toBeInTheDocument();
    expect(screen.getByText(/review product variants/i)).toBeInTheDocument();
  });

  test("renders variant cards and safe manager actions without write actions", async () => {
    const onOpenProductCheckoutPreview = jest.fn();
    const onOpenProductVariantConfiguration = jest.fn();
    mockApiPost.mockResolvedValue({
      data: {
        session: { public_id: "variant_1", workflow: "review_product_variants", status: "awaiting_manager" },
        messages: [
          {
            id: 1,
            role: "assistant",
            message_text: "Here is the current Variant status.",
            safe_metadata_json: {
              questions: [],
              variant_cards: [
                {
                  type: "variant_summary",
                  title: "Carry Bag",
                  product_id: 60,
                  mode: "active",
                  option_names: ["Colour", "Size"],
                  counts: { variants: 4, active: 3, available: 2, sold_out: 1 },
                  price_summary: { minimum: "69.00", maximum: "79.00", varies: true, currency: "CAD" },
                  activation_readiness: { ready_for_activation: false, blockers: ["Variant selling is disabled in this environment."], warnings: [] },
                  actions: [
                    { type: "open_product_variant_configuration", label: "Open Variant configuration", product_id: 60 },
                    { type: "open_product_checkout_preview", label: "Open Checkout Preview", product_id: 60 },
                  ],
                },
                {
                  type: "selected_variant",
                  title: "Black / Mini",
                  product_id: 60,
                  variant_id: 101,
                  product_name: "Carry Bag",
                  selected_options: [
                    { option_name: "Colour", value: "Black" },
                    { option_name: "Size", value: "Mini" },
                  ],
                  sku: "BAG-BLACK-MINI",
                  effective_price: "79.00",
                  price_source: "variant_override",
                  currency: "CAD",
                  available: true,
                  out_of_stock: false,
                  image: { url: "https://example.com/black-mini.jpg" },
                  image_source_label: "Variant override",
                  actions: [{ type: "open_product_checkout_preview", label: "Open Checkout Preview", product_id: 60, variant_id: 101 }],
                },
              ],
            },
          },
        ],
        facts: [],
        draft: null,
        plan: null,
        approval: null,
        execution: null,
        completion: null,
        shipping_test: null,
        international_expansion: null,
        usage_summary: { requests: 1 },
      },
    });

    renderDrawer({
      initialWorkflow: "review_product_variants",
      targetProductId: 60,
      onOpenProductCheckoutPreview,
      onOpenProductVariantConfiguration,
    });

    expect(await screen.findByText(/variant mode:\s*active/i)).toBeInTheDocument();
    expect(screen.getByText(/variant mode:\s*active/i)).toBeInTheDocument();
    expect(screen.getByText(/options:\s*colour \/ size/i)).toBeInTheDocument();
    expect(screen.getByText(/sku:\s*bag-black-mini/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /activate variant selling/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pause variant selling/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: /open variant configuration/i })[0]);
    expect(onOpenProductVariantConfiguration).toHaveBeenCalledWith(60);

    await userEvent.click(screen.getAllByRole("button", { name: /open checkout preview/i })[0]);
    expect(onOpenProductCheckoutPreview).toHaveBeenCalledWith(60);

    await userEvent.click(screen.getAllByRole("button", { name: /open checkout preview/i })[1]);
    expect(onOpenProductCheckoutPreview).toHaveBeenCalledWith(60, { variantId: 101 });
    expect(screen.getByAltText(/carry bag black \/ mini preview/i)).toBeInTheDocument();
  });

  test("renders shipping-test workflow and requests test rates without label actions", async () => {
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: shippingTestSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/ship_1/test-shipping") {
        expect(body).toEqual(
          expect.objectContaining({
            product_id: 60,
            package_profile_id: 9,
            quantity: 1,
            save_destination: false,
            destination: expect.objectContaining({
              address1: "777 Hornby St",
              city: "Vancouver",
              region: "BC",
              postal_code: "V6Z 1S4",
              country: "CA",
            }),
          })
        );
        return Promise.resolve({
          data: {
            ...shippingTestSession,
            session: { ...shippingTestSession.session, status: "completed", current_step: "shipping_test_results" },
            shipping_test: {
              ...shippingTestSession.shipping_test,
              result: {
                status: "passed",
                product: { id: 60, name: "Smoky-Lemon Quartz Necklace", quantity: 1 },
                package: {
                  name: "Small Jewelry Box",
                  display_dimensions: "10 × 5 × 5 cm",
                  total_test_weight: "65 g",
                },
                destination: { city: "Vancouver", region: "BC", country: "Canada" },
                summary: {
                  rate_count: 2,
                  lowest_rate: { currency: "CAD", amount: "12.40" },
                  fastest_rate: { delivery_days: 2 },
                },
                rates: [
                  {
                    carrier: "CanadaPost",
                    service: "ExpeditedParcel",
                    amount: "12.40",
                    currency: "CAD",
                    delivery_estimate_label: "Estimated carrier transit: 3 business days",
                  },
                ],
                readiness: { items: [] },
                notices: ["No label was purchased.", "Actual checkout rates may differ."],
              },
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "test_shipping_setup", targetProductId: 60 });

    expect(await screen.findByText(/test shipping setup/i)).toBeInTheDocument();
    expect(screen.getByText(/total: 65 g/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /request test rates/i }));

    expect(await screen.findByText(/shipping test passed/i)).toBeInTheDocument();
    expect(screen.getByText(/lowest test rate: CAD 12\.40/i)).toBeInTheDocument();
    expect(screen.getByText(/no label was purchased/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buy label/i })).not.toBeInTheDocument();
  });

  test("submits the suggested-address acceptance choice during shipping test review", async () => {
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({
          data: {
            ...shippingTestSession,
            shipping_test: {
              ...shippingTestSession.shipping_test,
              address_review: {
                status: "corrected",
                original_address: {
                  address1: "777 Hornby Street",
                  city: "Vancouver",
                  region: "BC",
                  postal_code: "V6Z 1S4",
                  country: "CA",
                },
                suggested_address: {
                  address1: "777 Hornby St",
                  city: "Vancouver",
                  region: "BC",
                  postal_code: "V6Z 1S4",
                  country: "CA",
                },
              },
            },
          },
        });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/ship_1/test-shipping") {
        expect(body.verification_choice).toBe("suggested");
        return Promise.resolve({ data: shippingTestSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "test_shipping_setup", targetProductId: 60 });

    expect(await screen.findByText(/please review the suggested address/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /use suggested address/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/ship_1/test-shipping",
      expect.objectContaining({ verification_choice: "suggested" }),
      expect.any(Object)
    ));
  });

  test("lets the manager edit the shipping-test destination form inside the drawer", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({
          data: {
            ...shippingTestSession,
            shipping_test: {
              ...shippingTestSession.shipping_test,
              draft: {
                ...shippingTestSession.shipping_test.draft,
                saved_destination: {
                  address1: "",
                  address2: "",
                  city: "",
                  region: "",
                  postal_code: "",
                  country: "",
                },
              },
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "test_shipping_setup", targetProductId: 60 });

    const countrySelect = await screen.findByLabelText(/destination country/i);
    expect(countrySelect).toBeInTheDocument();
    expect(countrySelect).toHaveAttribute("role", "combobox");

    await userEvent.type(screen.getByLabelText(/address line 1/i), "777 Hornby St");
    await userEvent.type(screen.getByLabelText(/^city$/i), "Vancouver");
    await userEvent.type(screen.getByLabelText(/region \/ state \/ province/i), "BC");
    await userEvent.type(screen.getByLabelText(/postal \/ zip code/i), "V6Z 1S4");

    expect(screen.getByLabelText(/address line 1/i)).toHaveValue("777 Hornby St");
    expect(screen.getByLabelText(/^city$/i)).toHaveValue("Vancouver");
    expect(screen.getByLabelText(/region \/ state \/ province/i)).toHaveValue("BC");
    expect(screen.getByLabelText(/postal \/ zip code/i)).toHaveValue("V6Z 1S4");
    expect(screen.queryByText(/this question arrived without choices/i)).not.toBeInTheDocument();
  });

  test("renders the international expansion review with grouped country results", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: internationalExpansionSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "international_expansion_assistant", targetProductId: 60 });

    expect(await screen.findByText(/international expansion review/i)).toBeInTheDocument();
    expect(screen.getByText(/common product setup/i)).toBeInTheDocument();
    expect(screen.getByText(/country of origin/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /configuration ready/i })).toBeInTheDocument();
    expect(screen.getByText(/not enabled/i)).toBeInTheDocument();
    expect(screen.getAllByText(/qatar/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/what your international customer will see/i)).toBeInTheDocument();
    expect(screen.getAllByText(/not included/i).length).toBeGreaterThan(0);
  });

  test("uses a searchable country selector and prepares only explicitly selected destinations", async () => {
    const enablementSession = {
      ...internationalExpansionSession,
      international_expansion: {
        ...internationalExpansionSession.international_expansion,
        result: {
          ...internationalExpansionSession.international_expansion.result,
          common_readiness: {
            status: "ready",
            items: [
              { code: "product_weight", label: "Product weight", status: "ready", message: "Product weight is present." },
            ],
          },
          eligible_destination_codes: ["GB", "QA"],
          available_actions: {
            ...internationalExpansionSession.international_expansion.result.available_actions,
            prepare_destination_enablement: true,
          },
        },
      },
    };
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: enablementSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/intl_1/prepare-destination-enablement") {
        expect(body.destinations).toEqual(["QA"]);
        return Promise.resolve({ data: enablementSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "international_expansion_assistant", targetProductId: 60 });

    expect(await screen.findByText(/international expansion review/i)).toBeInTheDocument();
    const destinationSearch = screen.getByLabelText(/destinations to review/i);
    expect(destinationSearch).toHaveAttribute("role", "combobox");
    expect(screen.getAllByText(/qatar/i).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("checkbox", { name: /qatar/i }));
    await userEvent.click(screen.getByRole("button", { name: /prepare selected destination changes/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/intl_1/prepare-destination-enablement",
      { destinations: ["QA"] },
      expect.any(Object)
    ));
  });

  test("shows a digital-product international message instead of parcel customs guidance", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({
          data: {
            ...internationalExpansionSession,
            international_expansion: {
              ...internationalExpansionSession.international_expansion,
              result: {
                ...internationalExpansionSession.international_expansion.result,
                product: {
                  ...internationalExpansionSession.international_expansion.result.product,
                  is_digital: true,
                },
              },
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "international_expansion_assistant", targetProductId: 60 });
    expect(await screen.findByText(/this is a digital product\. international parcel shipping and customs do not apply\./i)).toBeInTheDocument();
  });

  test("starts the shipping-test workflow prefilled for the selected international country", async () => {
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        if (body.workflow === "international_expansion_assistant") {
          return Promise.resolve({ data: internationalExpansionSession });
        }
        if (body.workflow === "test_shipping_setup") {
          expect(body.initial_destination_country).toBe("US");
          expect(body.target_product_id).toBe(60);
          return Promise.resolve({
            data: {
              ...shippingTestSession,
              shipping_test: {
                ...shippingTestSession.shipping_test,
                draft: {
                  ...shippingTestSession.shipping_test.draft,
                  saved_destination: {
                    ...shippingTestSession.shipping_test.draft.saved_destination,
                    country: "US",
                  },
                },
              },
            },
          });
        }
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "international_expansion_assistant", targetProductId: 60 });

    await screen.findByText(/international expansion review/i);
    await userEvent.click(screen.getByRole("button", { name: /test shipping to this country/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions",
      expect.objectContaining({
        workflow: "test_shipping_setup",
        target_product_id: 60,
        initial_destination_country: "US",
      }),
      expect.any(Object)
    ));
  });

  test("renders structured guided questions and submits structured answers", async () => {
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: guidedSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/sess_1/messages") {
        expect(body.answers).toEqual([
          {
            question_id: "product_name",
            fact_key: "product_name",
            value: "Northern Lights Necklace",
            confirmation_status: "confirmed",
          },
          {
            question_id: "track_stock",
            fact_key: "track_stock",
            value: "yes",
            confirmation_status: "confirmed",
          },
          {
            question_id: "shipping_weight_grams",
            fact_key: "shipping_weight_grams",
            value: "50",
            confirmation_status: "confirmed",
          },
        ]);
        return Promise.resolve({
          data: {
            ...guidedSession,
            messages: [
              ...guidedSession.messages,
              { id: 2, role: "manager", message_text: "Structured answers:\n- Product name: Northern Lights Necklace" },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect((await screen.findAllByText(/step 1 of 4 - product/i)).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/tell commerce copilot what you need/i)).not.toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText(/product name/i), { target: { value: "Northern Lights Necklace" } });
    await userEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/product weight/i), { target: { value: "50" } });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/sess_1/messages",
      expect.objectContaining({ answers: expect.any(Array) }),
      expect.any(Object)
    ));
  });

  test("renders a guided currency choice selector instead of a dead text fallback", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: currencyQuestionSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));

    const currencySelect = await screen.findByLabelText(/currency/i);
    expect(currencySelect).toBeInTheDocument();
    expect(currencySelect).toHaveAttribute("role", "combobox");
    expect(currencySelect).toHaveAttribute("aria-haspopup", "listbox");
    expect(screen.queryByText(/this question arrived without choices/i)).not.toBeInTheDocument();
  });

  test("renders a read-only draft preview with humanized labels and no raw keys", async () => {
    mockApiPost.mockResolvedValueOnce({ data: guidedSession });

    renderDrawer({ initialWorkflow: "create_physical_product" });
    await userEvent.click(await screen.findByRole("button", { name: /view current draft details/i }));
    expect(await screen.findByText(/draft preview/i)).toBeInTheDocument();
    expect(screen.getAllByText("USD 50").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Physical").length).toBeGreaterThan(0);
    expect(screen.getByText("A shipping package still needs to be created or selected.")).toBeInTheDocument();
    expect(screen.queryByText(/domestic_shipping_intent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/shipping_weight_grams/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(/usd 50/i)).not.toBeInTheDocument();
  });

  test("does not flash the generic workflow chooser while an auto-start workflow is opening", async () => {
    let resolveSession;
    const pendingSession = new Promise((resolve) => {
      resolveSession = resolve;
    });
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return pendingSession;
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "create_physical_product" });

    expect(await screen.findByText(/opening commerce copilot/i)).toBeInTheDocument();
    expect(screen.getByText(/create a physical product/i)).toBeInTheDocument();
    expect(screen.queryByText(/what would you like help with\?/i)).not.toBeInTheDocument();

    resolveSession({ data: guidedSession });

    expect(await screen.findByText(/what name should customers see\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/opening commerce copilot/i)).not.toBeInTheDocument();
  });

  test("opens explicit draft edit instead of showing missing facts as text fields", async () => {
    mockApiPost.mockResolvedValueOnce({ data: guidedSession });

    renderDrawer({ initialWorkflow: "create_physical_product" });
    await userEvent.click(await screen.findByRole("button", { name: /view current draft details/i }));
    expect((await screen.findAllByText(/^Still needed$/i)).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  test("shows writes-disabled banner without blocking drafts and plans", async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        ...availableCapabilities,
        availability: {
          ...availableCapabilities.availability,
          write_actions_available: false,
        },
      },
    });
    mockApiPost.mockResolvedValueOnce({
      data: {
        ...guidedSession,
        plan: {
          public_id: "plan_1",
          version: 1,
          actions: [
            {
              public_id: "act_1",
              title: "Create product",
              plain_language_description: "Create a hidden product draft for review.",
              risk_level: "medium_write",
              execution_supported: false,
              proposed_input_json: { product_name: "Northern Lights Necklace" },
              status: "proposed",
            },
          ],
        },
      },
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findAllByText(/applying changes is currently disabled/i)).not.toHaveLength(0);
    expect(screen.queryByRole("button", { name: /apply approved changes/i })).not.toBeInTheDocument();
  });

  test("uses backend confirmation requirements and hides raw qty_on_hand labels", async () => {
    mockApiPost.mockResolvedValueOnce({
      data: {
        ...guidedSession,
        session: { ...guidedSession.session, status: "plan_ready" },
        messages: [],
        draft: {
          ...guidedSession.draft,
          status: "ready_for_review",
          presentation: {
            ...guidedSession.draft.presentation,
            sections: {
              ...guidedSession.draft.presentation.sections,
              confirmed: [
                ...guidedSession.draft.presentation.sections.confirmed,
                { fact_key: "quantity", label: "Starting inventory", display_value: "2", raw_value: 2, editable: true },
                { fact_key: "shipping_weight_grams", label: "Product weight", display_value: "50 g", raw_value: 50, editable: true },
              ],
              missing: [],
              needs_confirmation: [],
            },
          },
        },
        plan: {
          public_id: "plan_approval_1",
          version: 1,
          actions: [
            {
              public_id: "act_1",
              title: "Create hidden product",
              plain_language_description: "Create this product as hidden so you can review it before publishing.",
              risk_level: "medium_write",
              execution_supported: true,
              proposed_input_json: {
                product_payload: {
                  name: "Smoky-Lemon Quartz Necklace",
                  category: "Jewelry",
                  price: "50.00",
                  track_stock: true,
                  qty_on_hand: 2,
                  shipping_weight_grams: 50,
                  allow_international_shipping: false,
                  is_active: false,
                },
              },
              status: "proposed",
            },
          ],
          confirmation_requirements: [
            {
              requirement_id: "act_1:quantity",
              action_public_id: "act_1",
              fact_key: "quantity",
              payload_key: "qty_on_hand",
              label: "Starting inventory",
              display_value: "2",
              confirmation_source: "manager_confirmed",
              already_confirmed: true,
              requires_checkbox: false,
            },
            {
              requirement_id: "act_1:shipping_weight_grams",
              action_public_id: "act_1",
              fact_key: "shipping_weight_grams",
              payload_key: "shipping_weight_grams",
              label: "Product weight",
              display_value: "50 g",
              confirmation_source: "review_required",
              already_confirmed: false,
              requires_checkbox: true,
            },
          ],
        },
      },
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));

    expect(await screen.findByText(/review selected changes/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmed by you: starting inventory - 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/review and confirm product weight: 50 g\./i)).toBeInTheDocument();
    expect(screen.queryByText(/qty_on_hand/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/review and confirm cost/i)).not.toBeInTheDocument();
  });

  test("shows the completion card with readiness and next actions after hidden product creation", async () => {
    mockApiPost.mockResolvedValueOnce({
      data: {
        ...guidedSession,
        session: { ...guidedSession.session, current_step: "finish_setup", status: "awaiting_manager" },
        messages: guidedSession.messages,
        plan: null,
        approval: null,
        execution: {
          public_id: "exec_1",
          status: "completed",
          summary: {
            actions: [
              {
                public_id: "exec_row_1",
                status: "succeeded",
                result_summary_json: { title: "Smoky-Lemon Quartz Necklace" },
              },
            ],
          },
        },
        completion: {
          product: {
            created: true,
            product_id: 101,
            name: "Smoky-Lemon Quartz Necklace",
            is_active: false,
            visibility: "hidden",
            manager_url: "/manager/advanced-management?panel=products&editProductId=101",
          },
          readiness: {
            overall_status: "setup_incomplete",
            summary: {
              blocking_count: 1,
              warning_count: 0,
              completed_count: 1,
              informational_count: 1,
            },
            items: [
              {
                code: "product_core",
                label: "Product information",
                status: "ready",
                message: "Product name and price are complete.",
                action_target: "product",
                blocking: false,
              },
              {
                code: "easypost_connection",
                label: "Shipping connection",
                status: "missing",
                message: "Connect EasyPost before showing live carrier rates.",
                action_target: "delivery_setup",
                blocking: true,
                action: {
                  type: "open_delivery_setup",
                  label: "Fix now",
                  url: "/manager/advanced-management?panel=easypost-shipping&tab=easypost_automation&focus=api_key",
                },
                guidance: {
                  title: "Connect EasyPost",
                  steps: [
                    "Create or sign in to your EasyPost account.",
                    "Copy a Test or Production API key.",
                  ],
                  links: [
                    { label: "Open Delivery Setup", url: "/manager/advanced-management?panel=easypost-shipping&tab=easypost_automation&focus=api_key" },
                  ],
                },
              },
              {
                code: "storefront_visibility",
                label: "Storefront visibility",
                status: "informational",
                message: "This Product will remain hidden until you publish it.",
                action_target: "product",
                blocking: false,
              },
            ],
          },
          next_best_action: {
            type: "fix_setup",
            label: "Fix 1 setup item",
          },
          available_actions: {
            help_finish_setup: true,
            open_product: true,
            open_delivery_setup: true,
            open_digital_products: false,
            prepare_publish: false,
            shipping_test: {
              enabled: false,
              label: "Available after shipping setup",
              message: "Connect EasyPost and complete the shipping origin before requesting live test rates.",
            },
          },
          links: {
            product: "/manager/advanced-management?panel=products&editProductId=101",
            delivery_setup: "/manager/advanced-management?panel=easypost-shipping&tab=easypost_automation",
            digital_products: null,
          },
        },
      },
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));

    expect(await screen.findByText(/product created/i)).toBeInTheDocument();
    expect(screen.getAllByText(/smoky-lemon quartz necklace/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/1 setup item need attention/i)).toBeInTheDocument();
    expect(screen.getByText(/5? setup item complete|1 setup item complete/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fix 1 setup item/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open product/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh status/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /how to fix/i })).toBeInTheDocument();
  });

  test("opens Product checkout preview from completion more actions", async () => {
    const onOpenProductCheckoutPreview = jest.fn();
    mockApiPost.mockResolvedValueOnce({
      data: {
        ...guidedSession,
        session: { ...guidedSession.session, current_step: "finish_setup", status: "awaiting_manager" },
        completion: {
          product: {
            created: true,
            product_id: 101,
            name: "Smoky-Lemon Quartz Necklace",
            is_digital: false,
            is_active: false,
          },
          readiness: {
            overall_status: "setup_incomplete",
            summary: {
              blocking_count: 1,
              warning_count: 0,
              completed_count: 1,
              informational_count: 0,
            },
            items: [],
          },
          next_best_action: {
            type: "fix_setup",
            label: "Fix 1 setup item",
          },
          available_actions: {
            shipping_test: {
              enabled: false,
              label: "Available after shipping setup",
              message: "",
            },
            prepare_publish: false,
          },
          links: {
            product: "/manager/advanced-management?panel=products&editProductId=101",
            delivery_setup: "/manager/advanced-management?panel=easypost-shipping",
          },
        },
      },
    });

    renderDrawer({ onOpenProductCheckoutPreview });
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/product created/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /more actions/i }));
    await userEvent.click(await screen.findByRole("button", { name: /explain customer checkout/i }));

    expect(onOpenProductCheckoutPreview).toHaveBeenCalledWith(101);
    await userEvent.click(screen.getByRole("button", { name: /what could i make on this sale/i }));
    expect(onOpenProductCheckoutPreview).toHaveBeenCalledWith(101);
  });

  test("accepts package bundle input and keeps the guided flow single-column", async () => {
    const packageSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I need your package details next.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Product weight is the item itself. Package weight is the empty box, envelope, and packing material.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box or mailer customers receive.",
                defaults: {
                  package_name: "",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        },
      ],
    };
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: packageSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/sess_1/messages") {
        expect(body.answers[0]).toEqual(
          expect.objectContaining({
              question_id: "package_profile_bundle",
              fact_key: "package_profile_bundle",
              value: expect.objectContaining({
                package_profile_name: "Small Jewelry Box",
                length: "5",
                width: "4",
                height: "3",
                package_tare_weight_input: "15",
              }),
            })
        );
        return Promise.resolve({ data: packageSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    fireEvent.change(await screen.findByLabelText(/package name/i), { target: { value: "Small Jewelry Box" } });
    fireEvent.change(screen.getByLabelText(/^length$/i), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/^width$/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/^height$/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/empty package weight/i), { target: { value: "15" } });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/sess_1/messages",
      expect.objectContaining({ answers: expect.any(Array) }),
      expect.any(Object)
    ));
    expect(screen.queryByText(/horizontal/i)).not.toBeInTheDocument();
  });

  test("keeps package inputs editable with real typing", async () => {
    const packageSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I need your package details next.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Shipping rates need exact package details.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box customers receive.",
                defaults: {
                  package_name: "",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        },
      ],
    };

    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: packageSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));

    const packageNameInput = await screen.findByLabelText(/package name/i);
    const lengthInput = screen.getByLabelText(/^length$/i);
    const tareInput = screen.getByLabelText(/empty package weight/i);

    await userEvent.type(packageNameInput, "Small Jewelry Box");
    await userEvent.type(lengthInput, "10");
    await userEvent.type(tareInput, "15");

    expect(packageNameInput).toHaveValue("Small Jewelry Box");
    expect(lengthInput).toHaveValue("10");
    expect(tareInput).toHaveValue("15");
  });

  test("preserves package dimensions when inline help opens and closes", async () => {
    const packageSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I need your package details next.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Shipping rates need exact package details.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box customers receive.",
                defaults: {
                  package_name: "Gold Necklace Shipping Box",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        },
      ],
    };
    mockApiPost.mockResolvedValueOnce({ data: packageSession });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    const lengthInput = await screen.findByLabelText(/^package length$/i);
    await userEvent.type(lengthInput, "10");
    await userEvent.click(screen.getByRole("button", { name: /help me find or measure this/i }));
    expect(await screen.findByText(/how to measure your package/i)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /close help/i })[0]);
    expect(await screen.findByRole("button", { name: /help me find or measure this/i })).toBeInTheDocument();
    expect(lengthInput).toHaveValue("10");
  }, 10000);

  test("supports tab navigation across package dimensions and weight", async () => {
    const packageSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I need your package details next.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Shipping rates need exact package details.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box customers receive.",
                defaults: {
                  package_name: "",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        },
      ],
    };
    mockApiPost.mockResolvedValueOnce({ data: packageSession });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    const packageNameInput = await screen.findByLabelText(/package name/i);
    await userEvent.click(packageNameInput);
    await userEvent.tab();
    expect(screen.getByLabelText(/^package length$/i)).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText(/^package width$/i)).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText(/^package height$/i)).toHaveFocus();
  });

  test("marking a package question unknown does not save the full session", async () => {
    const packageSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I need your package details next.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Shipping rates need exact package details.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box customers receive.",
                defaults: {
                  package_name: "",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        },
      ],
    };
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: packageSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions",
      expect.any(Object),
      expect.any(Object)
    ));
    expect(await screen.findByText(/what package do you normally use for this product/i)).toBeInTheDocument();
    const unknownButtons = await screen.findAllByRole("button", { name: /i don't know yet/i });
    await userEvent.click(unknownButtons[unknownButtons.length - 1]);

    expect(await screen.findByText(/i left this question incomplete for now/i)).toBeInTheDocument();
    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: /save and finish later/i })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /save incomplete/i })).not.toBeInTheDocument();
  });

  test("keeps accepted answers and field errors visible on partial package submission", async () => {
    const partialSession = {
      ...guidedSession,
      session: { ...guidedSession.session, status: "awaiting_manager" },
      plan: {
        public_id: "plan_stale",
        version: 1,
        actions: [
          {
            public_id: "act_1",
            title: "Create hidden product",
            plain_language_description: "Create a hidden product draft.",
            risk_level: "medium_write",
            execution_supported: true,
            proposed_input_json: { product_payload: { name: "Old" } },
            status: "proposed",
          },
        ],
      },
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "A few details are needed.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "product_name",
                fact_key: "product_name",
                plain_language_question: "What name should customers see?",
                why_needed: "Customers will see this name.",
                input_type: "text",
                choices: [],
                allow_unknown: true,
                show_help_measure: false,
                help_text: null,
              },
              {
                question_id: "track_stock",
                fact_key: "track_stock",
                plain_language_question: "Do you want Schedulaa to track inventory?",
                why_needed: "Inventory tracking changes what stock details are required.",
                input_type: "yes_no",
                choices: [],
                allow_unknown: true,
                show_help_measure: false,
                help_text: null,
              },
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Shipping rates need exact package details.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box customers receive.",
                defaults: {
                  package_name: "",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        },
      ],
      draft: {
        ...guidedSession.draft,
        status: "incomplete",
        presentation: {
          ...guidedSession.draft.presentation,
          sections: {
            ...guidedSession.draft.presentation.sections,
            missing: [
              { fact_key: "product_name", label: "Product name", display_value: null, raw_value: null, editable: true },
              { fact_key: "track_stock", label: "Track inventory", display_value: null, raw_value: null, editable: true },
            ],
          },
        },
      },
    };

    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: partialSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/sess_1/messages") {
        return Promise.resolve({
          data: {
            ...partialSession,
            session: { ...partialSession.session, status: "awaiting_manager" },
            plan: null,
            messages: [
              ...partialSession.messages,
              {
                id: 2,
                role: "assistant",
                message_text: "Product name was saved. Enter the empty package weight to finish the package.",
                safe_metadata_json: {
                  questions: [
                    {
                      question_id: "quantity",
                      fact_key: "quantity",
                      plain_language_question: "How many necklaces are currently available?",
                      why_needed: "Inventory tracking is enabled.",
                      input_type: "number",
                      choices: [],
                      allow_unknown: true,
                      show_help_measure: false,
                      help_text: null,
                    },
                    {
                      question_id: "package_profile_bundle",
                      fact_key: "package_profile_bundle",
                      plain_language_question: "What package do you normally use for this product?",
                      why_needed: "Shipping rates need exact package details.",
                      input_type: "package_bundle",
                      choices: [],
                      allow_unknown: true,
                      show_help_measure: true,
                      help_text: "Use the actual box customers receive.",
                      defaults: {
                        package_name: "",
                        length: "10",
                        width: "5",
                        height: "5",
                        length_unit: "cm",
                        weight_unit: "g",
                        set_as_default: true,
                      },
                    },
                  ],
                },
              },
            ],
            answer_results: [
              { question_id: "product_name", fact_key: "product_name", status: "accepted", accepted_fields: ["product_name"], field_errors: {} },
              { question_id: "track_stock", fact_key: "track_stock", status: "accepted", accepted_fields: ["track_stock"], field_errors: {} },
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                status: "partially_accepted",
                accepted_fields: ["package_length_mm", "package_width_mm", "package_height_mm"],
                field_errors: {
                  package_tare_weight_grams: "Enter the empty package weight.",
                },
              },
            ],
            answer_feedback_message: "Product name was saved. Enter the empty package weight to finish the package.",
            questions: [
              {
                question_id: "quantity",
                fact_key: "quantity",
                plain_language_question: "How many necklaces are currently available?",
                why_needed: "Inventory tracking is enabled.",
                input_type: "number",
                choices: [],
                allow_unknown: true,
                show_help_measure: false,
                help_text: null,
              },
              {
                question_id: "package_profile_bundle",
                fact_key: "package_profile_bundle",
                plain_language_question: "What package do you normally use for this product?",
                why_needed: "Shipping rates need exact package details.",
                input_type: "package_bundle",
                choices: [],
                allow_unknown: true,
                show_help_measure: true,
                help_text: "Use the actual box customers receive.",
                defaults: {
                  package_name: "",
                  length: "10",
                  width: "5",
                  height: "5",
                  length_unit: "cm",
                  weight_unit: "g",
                  set_as_default: true,
                },
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    fireEvent.change(await screen.findByLabelText(/product name/i), { target: { value: "Smoky-Lemon Quartz Necklace" } });
    await userEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/package length/i), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/package width/i), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/package height/i), { target: { value: "5" } });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/product name was saved\. enter the empty package weight to finish the package\./i)).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("10").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("5").length).toBeGreaterThan(0);
    expect(screen.getByText(/enter the empty package weight\./i)).toBeInTheDocument();
    expect(screen.queryByText(/review selected changes/i)).not.toBeInTheDocument();
  });

  test("renders a package choice card when a saved package matches", async () => {
    const packageChoiceSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "We found a saved package that may work for this product.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_reuse_choice",
                fact_key: "package_reuse_choice",
                plain_language_question: "We found a saved package that may work for this product. What would you like to do?",
                why_needed: "The current shipping system uses the workspace default package for shipping quotes.",
                input_type: "package_choice",
                choices: [],
                allow_unknown: false,
                show_help_measure: false,
                help_text: "Reuse an existing package when the dimensions and empty-package weight match.",
                defaults: {
                  choice: "",
                  selected_package_profile_reference: "package_profile:12",
                  package_make_workspace_default: false,
                  decision_status: "exact_match",
                  recommended_action: "use_existing",
                  plain_language_reason: "A saved package has the same dimensions and empty-package weight.",
                  matches: [
                    {
                      public_reference: "package_profile:12",
                      name: "Small Jewelry Box",
                      display_dimensions: "10 × 5 × 5 cm",
                      tare_weight_display: "15 g",
                      is_default: true,
                      match_quality: "exact",
                      match_details: ["Dimensions match", "Empty-package weight matches", "Already used as the workspace default"],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: packageChoiceSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/sess_1/messages") {
        expect(body.answers).toEqual([
          {
            question_id: "package_reuse_choice",
            fact_key: "package_reuse_choice",
            value: {
              choice: "use_existing",
              selected_package_profile_reference: "package_profile:12",
              package_make_workspace_default: false,
            },
            confirmation_status: "confirmed",
          },
        ]);
        return Promise.resolve({ data: packageChoiceSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/small jewelry box/i)).toBeInTheDocument();
    expect(screen.getByText(/10 × 5 × 5 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace default: yes/i)).toBeInTheDocument();
    expect(screen.queryByText(/package_profile:12/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /use existing package/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/sess_1/messages",
      expect.objectContaining({ answers: expect.any(Array) }),
      expect.any(Object)
    ));
  });

  test("shows an informational no-match package card without choice buttons", async () => {
    const noMatchSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I need one more detail: how many are currently available?",
          safe_metadata_json: {
            questions: [
              {
                question_id: "quantity",
                fact_key: "quantity",
                plain_language_question: "How many are currently available?",
                why_needed: "Inventory tracking needs a starting quantity.",
                input_type: "number",
                choices: [],
                allow_unknown: true,
                show_help_measure: false,
                help_text: null,
              },
            ],
          },
        },
      ],
      facts: [
        { fact_key: "package_length_mm", normalized_value_json: 100 },
        { fact_key: "package_width_mm", normalized_value_json: 50 },
        { fact_key: "package_height_mm", normalized_value_json: 30 },
        { fact_key: "package_tare_weight_grams", normalized_value_json: 50 },
      ],
      draft: {
        ...guidedSession.draft,
        validation_results_json: {
          ...(guidedSession.draft?.validation_results_json || {}),
          package_reuse: {
            reuse_decision: {
              status: "no_match",
              recommended_action: "create_new",
              plain_language_reason: "No saved package matches these confirmed dimensions and empty-package weight.",
              matched_profiles: [],
            },
          },
        },
      },
    };
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: noMatchSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/no saved package matches these confirmed dimensions and empty-package weight/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use existing package/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create a new package/i })).not.toBeInTheDocument();
  });

  test("shows workspace-default warning for a non-default saved package", async () => {
    const packageChoiceSession = {
      ...guidedSession,
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "We found a saved package that may work for this product.",
          safe_metadata_json: {
            questions: [
              {
                question_id: "package_reuse_choice",
                fact_key: "package_reuse_choice",
                plain_language_question: "The saved package dimensions match, but its empty-package weight is 18 g while you entered 15 g. What would you like to do?",
                why_needed: "The current shipping system uses the workspace default package for shipping quotes.",
                input_type: "package_choice",
                choices: [],
                allow_unknown: false,
                show_help_measure: false,
                help_text: "Reuse an existing package when the dimensions and empty-package weight match.",
                defaults: {
                  choice: "",
                  selected_package_profile_reference: "package_profile:33",
                  package_make_workspace_default: false,
                  decision_status: "close_match",
                  recommended_action: "ask_manager",
                  plain_language_reason: "A saved package has matching dimensions, but the empty-package weight is slightly different.",
                  matches: [
                    {
                      public_reference: "package_profile:33",
                      name: "Necklace Mailer",
                      display_dimensions: "10 × 5 × 5 cm",
                      tare_weight_display: "18 g",
                      is_default: false,
                      match_quality: "close_weight",
                      match_details: ["Dimensions match", "Saved empty-package weight is 18 g"],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
    mockApiPost.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: packageChoiceSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await userEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/the empty-package weight is slightly different/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /use existing package/i }));
    expect(await screen.findByText(/may affect shipping quotes for other products/i)).toBeInTheDocument();
  });

  test("uses the structured package editor in draft preview instead of a generic text field", async () => {
    const packageDraftSession = {
      ...guidedSession,
      messages: [],
      facts: [
        { fact_key: "package_profile_name", normalized_value_json: "Gold Necklace Shipping Box" },
        { fact_key: "package_length_mm", normalized_value_json: 100 },
        { fact_key: "package_width_mm", normalized_value_json: 50 },
        { fact_key: "package_height_mm", normalized_value_json: 50 },
        { fact_key: "package_tare_weight_grams", normalized_value_json: 15 },
        { fact_key: "package_length_input", normalized_value_json: "10" },
        { fact_key: "package_width_input", normalized_value_json: "5" },
        { fact_key: "package_height_input", normalized_value_json: "5" },
        { fact_key: "package_tare_weight_input", normalized_value_json: "15" },
        { fact_key: "package_length_unit", normalized_value_json: "cm" },
        { fact_key: "package_weight_unit", normalized_value_json: "g" },
        { fact_key: "package_set_as_default", normalized_value_json: true },
      ],
      draft: {
        ...guidedSession.draft,
        presentation: {
          ...guidedSession.draft.presentation,
          sections: {
            ...guidedSession.draft.presentation.sections,
            package: [
              { fact_key: "package_profile_name", label: "Package name", display_value: "Gold Necklace Shipping Box", raw_value: "Gold Necklace Shipping Box", editable: true },
              { fact_key: "package_dimensions", label: "Package dimensions", display_value: "10 × 5 × 5 cm", raw_value: null, editable: true },
              { fact_key: "package_tare_weight_grams", label: "Package empty weight", display_value: "15 g", raw_value: 15, editable: true },
            ],
          },
        },
      },
    };
    mockApiPost.mockResolvedValueOnce({ data: packageDraftSession });
    mockApiPatch.mockResolvedValueOnce({
      data: {
        ...packageDraftSession,
        facts: packageDraftSession.facts.map((row) => (
          row.fact_key === "package_width_mm"
            ? { ...row, normalized_value_json: 60 }
            : row.fact_key === "package_width_input"
              ? { ...row, normalized_value_json: "6" }
              : row
        )),
      },
    });

    renderDrawer({ initialWorkflow: "create_physical_product" });
    await userEvent.click(await screen.findByRole("button", { name: /edit package/i }));
    expect(screen.getByLabelText(/package name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^package width$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^package dimensions$/i)).not.toBeInTheDocument();

    const widthInput = screen.getByLabelText(/^package width$/i);
    await userEvent.clear(widthInput);
    await userEvent.type(widthInput, "6");
    await userEvent.click(screen.getByRole("button", { name: /save package changes/i }));

    await waitFor(() => expect(mockApiPatch).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/drafts/draft_1",
      expect.objectContaining({
        package_profile_bundle: expect.objectContaining({
          width: "6",
        }),
      }),
      expect.any(Object)
    ));
  }, 10000);

  test("renders storefront content suggestions and approves selected content", async () => {
    const contentSession = {
      session: {
        public_id: "sess_content_1",
        workflow: "improve_product_content",
        status: "ready_for_review",
        current_step: "content_review",
        context_summary_json: { progress_percent: 100 },
      },
      messages: [
        {
          id: 1,
          role: "assistant",
          message_text: "I prepared storefront content suggestions for this product.",
          safe_metadata_json: {},
        },
      ],
      facts: [],
      draft: {
        public_id: "draft_content_1",
        status: "ready_for_review",
        draft_payload_json: {
          content_pack: {
            product_id: 101,
            supported_fields: ["description", "category", "sku", "slug", "meta_title", "meta_description"],
            warnings: [],
            product_state: {
              is_active: false,
              visibility_message: "Content changes will remain hidden until you publish the Product.",
            },
            product_preview: {
              title: "Smoky-Lemon Quartz Necklace",
              price: 50,
              currency: "USD",
              description: "An elegant necklace presented in a protective jewelry box.",
            },
            suggestions: {
              description: {
                current_value: "",
                value: "An elegant necklace presented in a protective jewelry box.",
                reason: "Generated from confirmed product facts.",
                status: "suggested",
                capability_status: "suggestion_available",
                actionable: true,
              },
              category: {
                current_value: "Jewelry",
                value: "Jewelry",
                reason: "No category suggestion was generated.",
                status: "suggested",
                capability_status: "no_suggestion",
                actionable: false,
              },
              sku: {
                current_value: "NECKLACE-001",
                value: "SMOKY-NECKLACE-JEWELRY",
                reason: "Suggested from the product name and checked for tenant SKU uniqueness.",
                status: "suggested",
                capability_status: "suggestion_available",
                actionable: true,
              },
              slug: {
                current_value: "",
                value: "smoky-lemon-quartz-necklace",
                reason: "Generated from the product name and normalized with current URL rules.",
                status: "suggested",
                capability_status: "suggestion_available",
                actionable: true,
              },
              meta_title: {
                current_value: "",
                value: "Smoky-Lemon Quartz Necklace | Demo",
                reason: "Generated for search results.",
                status: "suggested",
                capability_status: "suggestion_available",
                actionable: true,
              },
              meta_description: {
                current_value: "",
                value: "Explore the Smoky-Lemon Quartz Necklace and review the current product details.",
                reason: "Generated for search results without unsupported claims.",
                status: "suggested",
                capability_status: "suggestion_available",
                actionable: true,
              },
              short_storefront_copy: {
                current_value: null,
                value: null,
                reason: "This storefront does not currently store a separate short Product summary.",
                status: "unavailable",
                capability_status: "unsupported",
                actionable: false,
              },
              image_alt_text: {
                current_value: null,
                value: null,
                reason: "Image alt text is not currently editable from this Commerce Copilot workflow.",
                status: "not_applicable",
                capability_status: "not_applicable",
                actionable: false,
              },
            },
          },
          presentation: { display_state: "ready_for_review", sections: {} },
        },
        presentation: { sections: {} },
        validation_results_json: { progress_percent: 100, known: [], missing_required: [], needs_confirmation: [] },
      },
      plan: {
        public_id: "plan_content_1",
        version: 1,
        actions: [
          {
            public_id: "act_content_1",
            action_type: "update_product_content",
            title: "Update storefront content",
            plain_language_description: "Apply the selected storefront content.",
            risk_level: "medium_write",
            proposed_input_json: { product_id: 101, product_payload: {} },
            status: "proposed",
          },
        ],
        confirmation_requirements: [],
      },
      approval: null,
      execution: null,
      completion: {
        product: { created: true, product_id: 101, name: "Smoky-Lemon Quartz Necklace", is_active: false },
        available_actions: { prepare_publish: true },
        links: { product: "/manager/advanced-management?panel=products&editProductId=101" },
      },
      usage_summary: { requests: 1, draft_generations: 1, plan_generations: 1, estimated_total_cost_micros: 1000 },
    };

    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({ data: contentSession });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/sess_content_1/generate-content") {
        return Promise.resolve({ data: contentSession });
      }
      if (String(url) === "/inventory/commerce-copilot/plans/plan_content_1/approve") {
        expect(body.selected_action_ids).toEqual(["act_content_1"]);
        expect(body.action_value_edits.act_content_1.product_payload).toEqual(
          expect.objectContaining({
            description: "An elegant necklace presented in a protective jewelry box.",
            sku: "SMOKY-NECKLACE-JEWELRY",
          })
        );
        expect(body.action_value_edits.act_content_1.product_payload.category).toBeUndefined();
        return Promise.resolve({
          data: {
            public_id: "approval_content_1",
            status: "approved",
            execution_available: true,
            approved_actions: [{ action_public_id: "act_content_1" }],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer({ initialWorkflow: "improve_product_content", targetProductId: 101 });
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions",
      expect.objectContaining({ workflow: "improve_product_content", target_product_id: 101 }),
      expect.any(Object)
    ));
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/sess_content_1/generate-content",
      expect.objectContaining({ target_product_id: 101 }),
      expect.any(Object)
    ));
    expect(await screen.findByText(/storefront content suggestions/i)).toBeInTheDocument();
    expect(screen.getByText(/content changes will remain hidden until you publish the product\./i)).toBeInTheDocument();
    expect(screen.getByText(/no category suggestion was generated\./i)).toBeInTheDocument();
    expect(screen.getByText(/not managed by commerce copilot/i)).toBeInTheDocument();
    expect(screen.queryByText(/image alt text is not currently editable from this commerce copilot workflow\./i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /use all suggestions/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: /i reviewed the selected changes and understand they will update the live product when applied\./i }));
    await userEvent.click(screen.getByRole("button", { name: /approve 5 selected fields/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/plans/plan_content_1/approve",
      expect.objectContaining({ selected_action_ids: ["act_content_1"] }),
      expect.any(Object)
    ));
    expect((await screen.findAllByText(/approved — 5 fields are ready to apply\./i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/proposed_input_json/i)).not.toBeInTheDocument();
  });
});
