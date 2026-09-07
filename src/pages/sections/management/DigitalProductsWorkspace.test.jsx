import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DigitalProductsWorkspace from "./DigitalProductsWorkspace";

const mockApiGet = jest.fn();
const mockCopilotDrawer = jest.fn(() => null);

jest.mock("../../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../../components/commerce-copilot/CommerceCopilotDrawer", () => (props) => {
  mockCopilotDrawer(props);
  return props.open ? <div data-testid="commerce-copilot-drawer">Commerce Copilot Drawer</div> : null;
});

describe("DigitalProductsWorkspace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockImplementation((url) => {
      if (String(url) === "/inventory/products") {
        return Promise.resolve({
          data: [
            {
              id: 11,
              name: "Digital Guide",
              is_digital: true,
              digital_delivery_mode: "external_link",
            },
          ],
        });
      }
      if (String(url) === "/inventory/digital-assets?include_inactive=1") {
        return Promise.resolve({ data: [] });
      }
      if (String(url) === "/inventory/products/11/digital-delivery") {
        return Promise.resolve({
          data: {
            digital_delivery_mode: "external_link",
            digital_requires_payment: true,
            links: [],
          },
        });
      }
      if (String(url).startsWith("/inventory/digital-license-keys")) {
        return Promise.resolve({ data: { items: [], pagination: { page: 1, page_size: 10, total: 0 } } });
      }
      if (String(url).startsWith("/inventory/digital-access-audit")) {
        return Promise.resolve({ data: { items: [], pagination: { page: 1, page_size: 10, total: 0 } } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("opens Commerce Copilot for digital product setup", async () => {
    render(<DigitalProductsWorkspace token="test-token" />);

    const button = await screen.findByRole("button", { name: /create digital product with ai/i });
    fireEvent.click(button);

    expect(await screen.findByTestId("commerce-copilot-drawer")).toBeInTheDocument();
    expect(mockCopilotDrawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        initialWorkflow: "create_digital_product",
        targetProductId: 11,
      })
    );
  });

  test("support mode exposes setup without loading customer license or audit data", async () => {
    render(<DigitalProductsWorkspace token="" supportMode />);

    expect(await screen.findByText("Asset Library")).toBeInTheDocument();
    expect(screen.getByText("Product Delivery Mapping")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Licensing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Access Audit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create digital product with ai/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        "/inventory/digital-assets?include_inactive=1",
        expect.any(Object)
      );
    });
    expect(mockApiGet.mock.calls.some(([url]) => String(url).startsWith("/inventory/digital-license-keys"))).toBe(false);
    expect(mockApiGet.mock.calls.some(([url]) => String(url).startsWith("/inventory/digital-access-audit"))).toBe(false);
  });
});
