import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ProductVariantConfigurationDialog from "./ProductVariantConfigurationDialog";

const mockApiGet = jest.fn();
const mockApiPut = jest.fn();
const mockApiDelete = jest.fn();

const installMatchMedia = (matcher = () => false) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: matcher(String(query || "")),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    put: (...args) => mockApiPut(...args),
    delete: (...args) => mockApiDelete(...args),
  },
}));

const renderDialog = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <ProductVariantConfigurationDialog
        open
        token="test-token"
        onClose={jest.fn()}
        notify={jest.fn()}
        product={{
          id: 48,
          sku: "BAG-001",
          name: "Carry Bag",
          price: 69,
          selling_currency: "CAD",
          images: [
            { id: 201, filename: "soft-white.jpg" },
            { id: 202, filename: "black.jpg" },
          ],
        }}
        {...props}
      />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  window.confirm = jest.fn(() => true);
  installMatchMedia(() => false);
  mockApiGet.mockResolvedValue({
    data: {
      product_id: 48,
      variant_mode: "none",
      configuration_version: "2026-08-03T12:00:00",
      runtime_selling_enabled: false,
      limits: { max_options: 2, max_values_per_option: 20, max_variants: 100 },
      options: [],
      variants: [],
      readiness: {
        complete: false,
        sellable: false,
        expected_combinations: 0,
        configured_variants: 0,
        blockers: [],
      },
      activation_readiness: {
        ready_for_activation: false,
        blockers: [],
        warnings: [],
      },
      variant_summary: {
        option_count: 0,
        variant_count: 0,
        active_variant_count: 0,
        configuration_complete: false,
        selling_enabled: false,
      },
      product_summary: {
        variant_mode: "none",
        variant_summary: {
          option_count: 0,
          variant_count: 0,
          active_variant_count: 0,
          configuration_complete: false,
          selling_enabled: false,
        },
        selling_currency: "CAD",
      },
    },
  });
  mockApiPut.mockResolvedValue({
    data: {
      product_id: 48,
      variant_mode: "draft",
      configuration_version: "2026-08-03T12:05:00",
      runtime_selling_enabled: false,
      options: [
        {
          id: 1,
          name: "Colour",
          display_order: 0,
          values: [{ id: 11, value: "Soft White", display_order: 0, swatch_color: "#F4F1EA", image_id: 201 }],
        },
      ],
      variants: [
        {
          id: 101,
          selection: [{ option_id: 1, option_name: "Colour", value_id: 11, value: "Soft White" }],
          sku: "BAG-001-SOFT-WHITE",
          price_override: null,
          effective_price: "69.00",
          qty_on_hand: 0,
          is_active: true,
          primary_image_id: 201,
        },
      ],
      readiness: {
        complete: true,
        sellable: false,
        expected_combinations: 1,
        configured_variants: 1,
        blockers: [],
      },
      activation_readiness: {
        ready_for_activation: true,
        blockers: [],
        warnings: [],
      },
      variant_summary: {
        option_count: 1,
        variant_count: 1,
        active_variant_count: 1,
        configuration_complete: true,
        selling_enabled: false,
      },
      product_summary: {
        variant_mode: "draft",
        variant_summary: {
          option_count: 1,
          variant_count: 1,
          active_variant_count: 1,
          configuration_complete: true,
          selling_enabled: false,
        },
        selling_currency: "CAD",
      },
    },
  });
  mockApiDelete.mockResolvedValue({
    data: {
      product_id: 48,
      variant_mode: "none",
      configuration_version: "2026-08-03T12:10:00",
      runtime_selling_enabled: false,
      options: [],
      variants: [],
      readiness: {
        complete: false,
        sellable: false,
        expected_combinations: 0,
        configured_variants: 0,
        blockers: [],
      },
      activation_readiness: {
        ready_for_activation: false,
        blockers: [],
        warnings: [],
      },
      variant_summary: {
        option_count: 0,
        variant_count: 0,
        active_variant_count: 0,
        configuration_complete: false,
        selling_enabled: false,
      },
      product_summary: {
        variant_mode: "none",
        variant_summary: {
          option_count: 0,
          variant_count: 0,
          active_variant_count: 0,
          configuration_complete: false,
          selling_enabled: false,
        },
        selling_currency: "CAD",
      },
    },
  });
});

test("shows draft warning, generates combinations, and saves a one-option draft", async () => {
  const onSaved = jest.fn();
  const notify = jest.fn();
  renderDialog({ onSaved, notify });

  expect(await screen.findByText(/Draft only/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Add option/i }));
  expect(screen.getByDisplayValue("Colour")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /Add value/i }));
  fireEvent.change(screen.getByLabelText(/^Value$/i), { target: { value: "Soft White" } });
  fireEvent.change(screen.getByLabelText(/Swatch/i), { target: { value: "#F4F1EA" } });

  expect(await screen.findByText(/1 combinations/i)).toBeInTheDocument();
  expect(await screen.findByText(/Soft White/i)).toBeInTheDocument();
  expect(screen.getByText(/Uses Product price:/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /Save draft variants/i }));

  await waitFor(() =>
    expect(mockApiPut).toHaveBeenCalledWith(
      "/inventory/products/48/variant-configuration",
      expect.objectContaining({
        configuration_version: "2026-08-03T12:00:00",
        options: [
          expect.objectContaining({
            name: "Colour",
          }),
        ],
        variants: [
          expect.objectContaining({
            sku: "BAG-001-SOFT-WHITE",
          }),
        ],
      }),
      expect.any(Object)
    )
  );
  expect(onSaved).toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith("Draft variants saved.");
});

test("prevents adding a third option group", async () => {
  renderDialog();

  await userEvent.click(await screen.findByRole("button", { name: /Add option/i }));
  await userEvent.click(screen.getByRole("button", { name: /Add option/i }));
  expect(screen.getByRole("button", { name: /Add option/i })).toBeDisabled();
});

test("shows mobile stacked variant cards", async () => {
  installMatchMedia((query) => query.includes("max-width"));
  renderDialog();

  await userEvent.click(await screen.findByRole("button", { name: /Add option/i }));
  await userEvent.click(screen.getByRole("button", { name: /Add value/i }));
  fireEvent.change(screen.getByLabelText(/^Value$/i), { target: { value: "Mini" } });

  expect(await screen.findByTestId("variant-mobile-cards")).toBeInTheDocument();
});

test("warns before closing with unsaved changes", async () => {
  const onClose = jest.fn();
  renderDialog({ onClose });

  await userEvent.click(await screen.findByRole("button", { name: /Add option/i }));
  await userEvent.click(screen.getByRole("button", { name: /^Close$/i }));

  expect(window.confirm).toHaveBeenCalledWith("Discard unsaved variant draft changes?");
});

test("removes an existing draft with confirmation", async () => {
  mockApiGet.mockResolvedValueOnce({
    data: {
      product_id: 48,
      variant_mode: "draft",
      configuration_version: "2026-08-03T12:00:00",
      runtime_selling_enabled: false,
      options: [
        {
          id: 1,
          name: "Size",
          display_order: 0,
          values: [{ id: 11, value: "Mini", display_order: 0, swatch_color: null, image_id: null }],
        },
      ],
      variants: [
        {
          id: 101,
          selection: [{ option_id: 1, option_name: "Size", value_id: 11, value: "Mini" }],
          sku: "BAG-001-MINI",
          price_override: null,
          effective_price: "69.00",
          qty_on_hand: 0,
          is_active: true,
          primary_image_id: null,
        },
      ],
      readiness: {
        complete: true,
        sellable: false,
        expected_combinations: 1,
        configured_variants: 1,
        blockers: [],
      },
      activation_readiness: {
        ready_for_activation: true,
        blockers: [],
        warnings: [],
      },
      variant_summary: {
        option_count: 1,
        variant_count: 1,
        active_variant_count: 1,
        configuration_complete: true,
        selling_enabled: false,
      },
      product_summary: {
        variant_mode: "draft",
        variant_summary: {
          option_count: 1,
          variant_count: 1,
          active_variant_count: 1,
          configuration_complete: true,
          selling_enabled: false,
        },
        selling_currency: "CAD",
      },
    },
  });
  const notify = jest.fn();
  renderDialog({ notify });

  await screen.findByDisplayValue("BAG-001-MINI");
  await userEvent.click(screen.getByRole("button", { name: /Remove draft configuration/i }));

  await waitFor(() =>
    expect(mockApiDelete).toHaveBeenCalledWith(
      "/inventory/products/48/variant-configuration",
      expect.objectContaining({
        data: { configuration_version: "2026-08-03T12:00:00" },
      })
    )
  );
  expect(notify).toHaveBeenCalledWith("Draft variant configuration removed.");
});
