import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("ProductManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  test("shows physical shipping fields in the product editor", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ProductManagement token="test-token" />
      </ThemeProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /manager\.product\.buttonadd/i }));

    await waitFor(() => expect(screen.getByLabelText(/weight \(g\)/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/length \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ships separately/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/customs description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country of origin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hs \/ tariff code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/declared value \(cents\)/i)).toBeInTheDocument();
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
});
