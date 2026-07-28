import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ProductManagement from "./ProductManagement";

const mockApiGet = jest.fn();
const mockCopilotDrawer = jest.fn(() => null);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@mui/x-data-grid", () => ({
  DataGrid: () => <div data-testid="product-grid" />,
}));

jest.mock("../../../components/common/CategoryAutocomplete", () => () => null);
jest.mock("../../../components/common/CategoryManagerDialog", () => () => null);
jest.mock("./EasyPostShippingSettingsPanel", () => () => <div>Delivery setup panel</div>);
jest.mock("../../../components/commerce-copilot/CommerceCopilotDrawer", () => (props) => {
  mockCopilotDrawer(props);
  return props.open ? <div data-testid="commerce-copilot-drawer">Commerce Copilot Drawer</div> : null;
});

jest.setTimeout(15000);

describe("ProductManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/manager/advanced-management?panel=products");
    mockApiGet.mockImplementation((url) => {
      if (String(url).startsWith("/inventory/products?") || String(url) === "/inventory/products") {
        return Promise.resolve({ data: [] });
      }
      if (String(url) === "/inventory/product-categories") {
        return Promise.resolve({ data: { categories: [] } });
      }
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({
          data: {
            allow_pickup: true,
            allow_shipping: true,
            allow_local_delivery: false,
            country_catalog: [
              { code: "CA", label: "Canada" },
              { code: "QA", label: "Qatar" },
              { code: "US", label: "United States" },
            ],
          },
        });
      }
      if (String(url) === "/inventory/products/low-stock?limit=10") {
        return Promise.resolve({
          data: {
            count: 0,
            out_of_stock_count: 0,
            low_stock_count: 0,
            items: [],
          },
        });
      }
      if (String(url) === "/finance/inventory/items?active=true") {
        return Promise.resolve({ data: { items: [] } });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("shows physical shipping fields, uses server country catalog, and reveals customs only for international shipping", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ProductManagement token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /manager\.product\.buttonadd/i }));

    expect(await screen.findByLabelText(/weight \(g\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/length \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /ships separately/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/customs description/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no customs information is needed for domestic sales/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/allow international shipping/i));

    expect(await screen.findByLabelText(/customs description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country of origin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hs \/ tariff code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^declared value$/i)).toBeInTheDocument();

    const originInput = screen.getByLabelText(/country of origin/i);
    fireEvent.change(originInput, { target: { value: "Qat" } });
    expect(await screen.findByText(/Qatar \(QA\)/i)).toBeInTheDocument();
  });

  test("shows shipping and customs guidance in Product Management Help", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ProductManagement token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /help/i }));
    expect(await screen.findByText(/product management help/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /shipping & packages/i }));
    expect(screen.getByText(/product weight:/i)).toBeInTheDocument();
    expect(screen.getByText(/package dimensions:/i)).toBeInTheDocument();
    expect(screen.getByText(/package tare weight:/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open delivery setup/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /international customs/i }));
    expect(screen.getByText(/only for physical products that will ship outside your origin country/i)).toBeInTheDocument();
    expect(screen.getByText(/ECCN:/i)).toBeInTheDocument();
  });

  test("opens Commerce Copilot from product entry points", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ProductManagement token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /create with ai/i }));
    expect(await screen.findByTestId("commerce-copilot-drawer")).toBeInTheDocument();
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "create_physical_product",
        targetProductId: null,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: /improve content with ai/i }));
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "improve_product_content",
        targetProductId: null,
      })
    );
  });

  test("closing a URL-opened edit modal clears editProductId so it stays closed", async () => {
    window.history.replaceState({}, "", "/manager/advanced-management?panel=products&editProductId=60");
    mockApiGet.mockImplementation((url) => {
      if (String(url).startsWith("/inventory/products?") || String(url) === "/inventory/products") {
        return Promise.resolve({
          data: [
            {
              id: 60,
              sku: "SMOKY-LEM-60",
              name: "Smoky-Lemon Quartz Necklace",
              price: 50,
              qty_on_hand: 2,
              track_stock: true,
              is_digital: false,
              is_active: true,
            },
          ],
        });
      }
      if (String(url) === "/inventory/product-categories") {
        return Promise.resolve({ data: { categories: [] } });
      }
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({
          data: {
            allow_pickup: true,
            allow_shipping: true,
            allow_local_delivery: false,
            country_catalog: [],
          },
        });
      }
      if (String(url) === "/inventory/products/low-stock?limit=10") {
        return Promise.resolve({
          data: {
            count: 0,
            out_of_stock_count: 0,
            low_stock_count: 0,
            items: [],
          },
        });
      }
      if (String(url) === "/finance/inventory/items?active=true") {
        return Promise.resolve({ data: { items: [] } });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <ProductManagement token="test-token" />
      </ThemeProvider>
    );

    expect(await screen.findByText("manager.product.dialog.editTitle")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /manager\.product\.dialog\.cancel/i }));

    expect(screen.queryByText("manager.product.dialog.editTitle")).not.toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("editProductId")).toBeNull();
  });

  test("opens shipping-test Copilot workflow from the edit product modal", async () => {
    window.history.replaceState({}, "", "/manager/advanced-management?panel=products&editProductId=60");
    mockApiGet.mockImplementation((url) => {
      if (String(url).startsWith("/inventory/products?") || String(url) === "/inventory/products") {
        return Promise.resolve({
          data: [
            {
              id: 60,
              sku: "SMOKY-LEM-60",
              name: "Smoky-Lemon Quartz Necklace",
              price: 50,
              qty_on_hand: 2,
              track_stock: true,
              is_digital: false,
              is_active: true,
            },
          ],
        });
      }
      if (String(url) === "/inventory/product-categories") {
        return Promise.resolve({ data: { categories: [] } });
      }
      if (String(url) === "/inventory/shipping-settings") {
        return Promise.resolve({
          data: {
            allow_pickup: true,
            allow_shipping: true,
            allow_local_delivery: false,
            country_catalog: [],
          },
        });
      }
      if (String(url) === "/inventory/products/low-stock?limit=10") {
        return Promise.resolve({
          data: { count: 0, out_of_stock_count: 0, low_stock_count: 0, items: [] },
        });
      }
      if (String(url) === "/finance/inventory/items?active=true") {
        return Promise.resolve({ data: { items: [] } });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <ProductManagement token="test-token" />
      </ThemeProvider>
    );

    expect(await screen.findByText("manager.product.dialog.editTitle")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /test this product's shipping setup/i }));

    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "test_shipping_setup",
        targetProductId: 60,
      })
    );
  });
});
