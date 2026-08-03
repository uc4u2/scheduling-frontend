import React from "react";
import { render, screen } from "@testing-library/react";

import { ProductListEmbedded } from "./ProductList";
import { setActiveCurrency } from "../../utils/currency";

const mockApiGet = jest.fn();
const mockNavigate = jest.fn();
const mockLoadCart = jest.fn(() => []);

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "sale" }),
  useSearchParams: () => [new URLSearchParams()],
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  api: {
    get: (...args) => mockApiGet(...args),
  },
  publicSite: {
    getWebsiteShell: jest.fn(),
  },
}));

jest.mock("../../utils/cart", () => ({
  addProductToCart: jest.fn(() => []),
  loadCart: (...args) => mockLoadCart(...args),
  CartErrorCodes: {
    MIXED_TYPES: "mixed_types",
  },
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "custom",
}));

jest.mock("../../components/website/SiteFrame", () => ({ children }) => <>{children}</>);

describe("ProductListEmbedded", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    setActiveCurrency("USD");
    mockLoadCart.mockReturnValue([]);
    mockApiGet.mockImplementation((url) => {
      if (String(url).startsWith("/public/sale/products")) {
        return Promise.resolve({
          data: [
            {
              id: 10,
              name: "Maple Pendant",
              description: "Customer-facing intro",
              category: "Jewelry",
              price: 69,
              selling_currency: "CAD",
              qty_on_hand: 4,
              low_stock_threshold: 1,
              track_stock: true,
              is_digital: false,
              is_active: true,
              allow_international_shipping: false,
              created_at: "2026-07-20T12:00:00Z",
              images: [{ id: 1, url: "https://example.com/pendant.jpg" }],
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("shows business-currency pricing and new badge without changing existing catalog cards", async () => {
    render(<ProductListEmbedded slug="sale" />);

    expect(await screen.findByText("Maple Pendant")).toBeInTheDocument();
    expect(screen.getByText("CA$69.00")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getAllByText("Jewelry").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /details/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  test("uses the active business currency when a product payload omits selling_currency", async () => {
    window.localStorage.setItem("company_currency", "USD");
    setActiveCurrency("CAD");
    mockApiGet.mockImplementation((url) => {
      if (String(url).startsWith("/public/sale/products")) {
        return Promise.resolve({
          data: [
            {
              id: 11,
              name: "Context Bracelet",
              description: "Customer-facing intro",
              category: "Jewelry",
              price: 69,
              qty_on_hand: 4,
              low_stock_threshold: 1,
              track_stock: true,
              is_digital: false,
              is_active: true,
              allow_international_shipping: false,
              created_at: "2026-07-20T12:00:00Z",
              images: [{ id: 1, url: "https://example.com/bracelet.jpg" }],
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(<ProductListEmbedded slug="sale" />);

    expect(await screen.findByText("Context Bracelet")).toBeInTheDocument();
    expect(screen.getByText("CA$69.00")).toBeInTheDocument();
  });
});
