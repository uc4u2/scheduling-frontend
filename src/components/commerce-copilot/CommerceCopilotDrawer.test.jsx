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

describe("CommerceCopilotDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1280;
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/commerce-copilot/capabilities") {
        return Promise.resolve({ data: availableCapabilities });
      }
      return Promise.resolve({ data: {} });
    });
    mockApiPatch.mockResolvedValue({
      data: {
        session: { public_id: "sess_1", workflow: "create_physical_product", status: "plan_ready" },
        messages: [],
        facts: [],
        draft: {
          public_id: "draft_1",
          validation_results_json: { progress_percent: 55 },
          draft_payload_json: { confirmed_values: { name: "Edited Necklace" }, suggested_values: {}, unknown_values: {} },
        },
        plan: {
          public_id: "plan_1",
          version: 1,
          actions: [
            {
              public_id: "act_1",
              title: "Create product",
              plain_language_description: "Create a hidden product draft for review.",
              risk_level: "medium_write",
              execution_supported: true,
              proposed_input_json: { price: "85.00", shipping_weight_grams: 25 },
              status: "rejected",
            },
          ],
        },
        usage_summary: { requests: 2, draft_generations: 2, plan_generations: 1, estimated_total_cost_micros: 2468 },
      },
    });
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

  test("submits a first-run message by creating a session and sending the manager turn", async () => {
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        expect(body.workflow).toBe("create_physical_product");
        return Promise.resolve({
          data: {
            session: { public_id: "sess_1", workflow: "create_physical_product", status: "awaiting_manager", context_summary_json: { progress_percent: 35 } },
            messages: [{ id: 1, role: "assistant", message_text: "Tell me what you sell and what customers will receive." }],
            facts: [],
            draft: {
              public_id: "draft_1",
              validation_results_json: { progress_percent: 35, known: [], missing_required: [], needs_confirmation: [], next_question_candidates: [] },
              draft_payload_json: { confirmed_values: {}, suggested_values: {}, unknown_values: {} },
            },
            plan: null,
            usage_summary: { requests: 0, draft_generations: 0, plan_generations: 0, estimated_total_cost_micros: 0 },
          },
        });
      }
      if (String(url) === "/inventory/commerce-copilot/sessions/sess_1/messages") {
        expect(body.message).toBe("I sell handmade bracelets for $45 and want to ship within Canada.");
        return Promise.resolve({
          data: {
            session: { public_id: "sess_1", workflow: "create_physical_product", status: "awaiting_manager", context_summary_json: { progress_percent: 55 } },
            messages: [
              { id: 1, role: "assistant", message_text: "Tell me what you sell and what customers will receive." },
              { id: 2, role: "manager", message_text: "I sell handmade bracelets for $45 and want to ship within Canada." },
              {
                id: 3,
                role: "assistant",
                message_text: "How much does the product itself weigh, without the box?",
                safe_metadata_json: {
                  questions: [
                    {
                      question_id: "shipping_weight_grams",
                      plain_language_question: "How much does the product itself weigh, without the box?",
                      why_needed: "Carriers use the real weight to calculate accurate shipping prices.",
                      input_type: "number",
                      choices: [],
                      allow_unknown: true,
                      show_help_measure: true,
                      help_text: "A small kitchen or postal scale works well.",
                    },
                  ],
                },
              },
            ],
            facts: [],
            draft: {
              public_id: "draft_1",
              validation_results_json: {
                progress_percent: 55,
                known: [{ key: "name", label: "Product name" }],
                missing_required: [{ key: "shipping_weight_grams", label: "Weight" }],
                needs_confirmation: [],
              },
              draft_payload_json: {
                confirmed_values: { name: "Handmade Bracelet" },
                suggested_values: { description: "A handmade bracelet sold within Canada." },
                unknown_values: { shipping_weight_grams: null },
              },
            },
            plan: null,
            usage_summary: { requests: 1, draft_generations: 1, plan_generations: 0, estimated_total_cost_micros: 1000 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    await screen.findByText(/what would you like help with/i);
    fireEvent.change(screen.getByLabelText(/tell commerce copilot what you need/i), {
      target: { value: "I sell handmade bracelets for $45 and want to ship within Canada." },
    });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findAllByText(/how much does the product itself weigh/i)).toHaveLength(2);
    expect(screen.getByText(/help me find or measure this/i)).toBeInTheDocument();
    expect(screen.getByText(/^confirmed$/i)).toBeInTheDocument();
  });

  test("shows setup-incomplete state when openai is not configured", async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        availability: {
          available: false,
          chat_available: false,
          drafts_available: false,
          plans_available: false,
          write_actions_available: false,
          monetization_mode: "free_launch",
          access_source: null,
          provider_ready: false,
        },
        configuration: {
          global_feature_enabled: true,
          write_feature_enabled: true,
          openai_key_configured: false,
          model_configured: true,
          tenant_access_enabled: true,
          tenant_plan_allowed: true,
        },
        blockers: ["openai_not_configured"],
        safe_message: "Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider.",
        billing: { ai_commerce_copilot: { monetization_mode: "free_launch" } },
      },
    });

    renderDrawer();
    expect(await screen.findByRole("heading", { name: /commerce copilot setup is incomplete/i })).toBeInTheDocument();
    expect(screen.queryByText(/create a physical product/i)).not.toBeInTheDocument();
  });

  test("keeps drafts and plans available while writes are disabled", async () => {
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
        session: { public_id: "sess_1", workflow: "create_physical_product", status: "plan_ready", context_summary_json: { progress_percent: 70 } },
        messages: [{ id: 1, role: "assistant", message_text: "I prepared a draft and plan for you." }],
        facts: [],
        draft: {
          public_id: "draft_1",
          validation_results_json: { progress_percent: 70, known: [], missing_required: [], needs_confirmation: [] },
          draft_payload_json: { confirmed_values: { name: "Silver Necklace" }, suggested_values: {}, unknown_values: {} },
        },
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
              proposed_input_json: { name: "Silver Necklace" },
              status: "proposed",
            },
          ],
        },
        usage_summary: { requests: 1, draft_generations: 1, plan_generations: 1, estimated_total_cost_micros: 1234 },
      },
    });

    renderDrawer();
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/i prepared a draft and plan for you/i)).toBeInTheDocument();
    expect(screen.getAllByText(/applying changes is currently disabled/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /apply approved changes/i })).not.toBeInTheDocument();
  });

  test("supports approval and apply flow when writes are enabled", async () => {
    mockApiPost.mockImplementation((url, body) => {
      if (String(url) === "/inventory/commerce-copilot/sessions") {
        return Promise.resolve({
          data: {
            session: { public_id: "sess_1", workflow: "create_physical_product", status: "plan_ready", context_summary_json: { progress_percent: 70 } },
            messages: [{ id: 1, role: "assistant", message_text: "I prepared a draft and plan for you." }],
            facts: [],
            draft: {
              public_id: "draft_1",
              validation_results_json: { progress_percent: 70, known: [], missing_required: [], needs_confirmation: [] },
              draft_payload_json: { confirmed_values: { name: "Silver Necklace" }, suggested_values: {}, unknown_values: {} },
            },
            plan: {
              public_id: "plan_1",
              version: 1,
              actions: [
                {
                  public_id: "act_1",
                  title: "Create product",
                  plain_language_description: "Create a hidden product draft for review.",
                  risk_level: "medium_write",
                  execution_supported: true,
                  proposed_input_json: { price: "85.00", shipping_weight_grams: 25 },
                  status: "proposed",
                },
              ],
            },
            approval: null,
            execution: null,
            usage_summary: { requests: 1, draft_generations: 1, plan_generations: 1, estimated_total_cost_micros: 1000 },
          },
        });
      }
      if (String(url) === "/inventory/commerce-copilot/plans/plan_1/approve") {
        expect(body.selected_action_ids).toEqual(["act_1"]);
        expect(body.confirmation_keys).toEqual(expect.arrayContaining(["price", "shipping_weight_grams", "__account_confirmed__"]));
        return Promise.resolve({
          data: {
            public_id: "approval_1",
            status: "approved",
            execution_available: true,
            approved_actions: [{ action_public_id: "act_1" }],
          },
        });
      }
      if (String(url) === "/inventory/commerce-copilot/approvals/approval_1/execute") {
        expect(body.final_confirmation).toBe(true);
        return Promise.resolve({
          data: {
            public_id: "exec_1",
            status: "completed",
            summary: {
              actions: [
                {
                  public_id: "row_1",
                  status: "succeeded",
                  result_summary_json: { deep_link: "/manager/advanced-management?tab=products&productId=12" },
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderDrawer();
    fireEvent.click(await screen.findByRole("button", { name: /create a physical product/i }));
    expect(await screen.findByText(/i prepared a draft and plan for you/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/i reviewed the price value/i));
    fireEvent.click(screen.getByLabelText(/i reviewed the shipping weight grams value/i));
    fireEvent.click(screen.getByLabelText(/i understand that these changes will be applied/i));
    fireEvent.click(screen.getByRole("button", { name: /approve selected changes/i }));
    expect(await screen.findByText(/changes approved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /apply approved changes/i }));
    expect(await screen.findByText(/approved changes were applied/i)).toBeInTheDocument();
    expect(screen.getByText(/execution results/i)).toBeInTheDocument();
  });
});
