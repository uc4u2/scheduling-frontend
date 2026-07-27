import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import CommerceCopilotDrawer from "./CommerceCopilotDrawer";

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

describe("CommerceCopilotDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1280;
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

  test("shows quick starts and direct first-run input when fully available", async () => {
    renderDrawer();

    expect(await screen.findByText(/what would you like help with/i)).toBeInTheDocument();
    expect(screen.getByText(/included during free launch/i)).toBeInTheDocument();
    expect(screen.getByText(/create a physical product/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /or describe what you need/i })).toBeInTheDocument();
    expect(screen.queryByText(/preview only/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not available right now/i)).not.toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/a few details are needed/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/tell commerce copilot what you need/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/what name should customers see/i), { target: { value: "Northern Lights Necklace" } });
    fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/what is the exact product weight without the box/i), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/sess_1/messages",
      expect.objectContaining({ answers: expect.any(Array) }),
      expect.any(Object)
    ));
  });

  test("renders a read-only draft preview with humanized labels and no raw keys", async () => {
    mockApiPost.mockResolvedValueOnce({ data: guidedSession });

    renderDrawer();
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/draft preview/i)).toBeInTheDocument();
    expect(screen.getByText("USD 50")).toBeInTheDocument();
    expect(screen.getByText("Physical")).toBeInTheDocument();
    expect(screen.getByText("A shipping package still needs to be created or selected.")).toBeInTheDocument();
    expect(screen.queryByText(/domestic_shipping_intent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/shipping_weight_grams/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(/usd 50/i)).not.toBeInTheDocument();
  });

  test("opens explicit draft edit instead of showing missing facts as text fields", async () => {
    mockApiPost.mockResolvedValueOnce({ data: guidedSession });

    renderDrawer();
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/^Still needed$/i, { selector: "h6" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
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
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findAllByText(/applying changes is currently disabled/i)).not.toHaveLength(0);
    expect(screen.queryByRole("button", { name: /apply approved changes/i })).not.toBeInTheDocument();
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
              dimensions_input: "5 x 4 x 3 cm",
              package_tare_weight_input: "15 grams",
            }),
          })
        );
        return Promise.resolve({ data: packageSession });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    fireEvent.change(await screen.findByLabelText(/package name/i), { target: { value: "Small Jewelry Box" } });
    fireEvent.change(screen.getByLabelText(/^length$/i), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/^width$/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/^height$/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/empty package weight/i), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      "/inventory/commerce-copilot/sessions/sess_1/messages",
      expect.objectContaining({ answers: expect.any(Array) }),
      expect.any(Object)
    ));
    expect(screen.queryByText(/horizontal/i)).not.toBeInTheDocument();
  });
});
