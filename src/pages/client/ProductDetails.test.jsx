import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ProductDetails from "./ProductDetails";

const mockApiGet = jest.fn();
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "sale", productId: "77" }),
  useSearchParams: () => [new URLSearchParams()],
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  api: {
    get: (...args) => mockApiGet(...args),
  },
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "custom",
}));

jest.mock("./CompanyPublic", () => ({ externalRenderOverride }) => externalRenderOverride?.node || null);

describe("ProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });
    delete navigator.share;
  });

  test("keeps existing product behavior without empty accordions and formats price with business currency", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        id: 77,
        name: "Classic Pendant",
        description: "Short intro",
        price: 69,
        selling_currency: "CAD",
        sku: "PEND-77",
        qty_on_hand: 5,
        track_stock: true,
        is_digital: false,
        allow_international_shipping: false,
        created_at: "2026-06-01T12:00:00Z",
        images: [{ id: 1, url: "https://example.com/pendant.jpg", alt: "Classic Pendant" }],
      },
    });

    render(<ProductDetails />);

    expect(await screen.findByRole("heading", { name: "Classic Pendant" })).toBeInTheDocument();
    expect(screen.getByText("CA$69.00")).toBeInTheDocument();
    expect(screen.getByText(/short intro/i)).toBeInTheDocument();
    expect(screen.getByText(/sku pend-77/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /product details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /specifications/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /shipping & returns/i })).not.toBeInTheDocument();
  });

  test("renders structured accordions, new badge, lightbox, and share fallback", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        id: 77,
        name: "Structured Pendant",
        description: "Short intro",
        price: 120,
        selling_currency: "USD",
        sku: "STR-77",
        qty_on_hand: 2,
        track_stock: true,
        is_digital: false,
        allow_international_shipping: true,
        created_at: "2026-07-20T12:00:00Z",
        details_text: "Longer detail copy.\nSecond line.",
        specifications_json: [{ label: "Material", value: "Sterling silver" }],
        materials_care_text: "Keep dry.",
        packaging_text: "Gift box included.",
        product_url: "https://app.schedulaa.com/products/structured-pendant",
        customer_shipping_returns: {
          delivery_methods: [{ code: "shipping", label: "Shipping" }],
          policy_text: "Ships in 2-3 business days.",
          policy_url: "https://example.com/shipping",
          duties_notice: "Import duties, taxes, or brokerage charges may be collected separately.",
        },
        images: [
          { id: 1, url: "https://example.com/pendant-1.jpg", alt: "Front view" },
          { id: 2, url: "https://example.com/pendant-2.jpg", alt: "Side view" },
        ],
      },
    });

    render(<ProductDetails />);

    expect(await screen.findByRole("heading", { name: "Structured Pendant" })).toBeInTheDocument();
    expect(screen.getByText("New arrival")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /share product/i }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://app.schedulaa.com/products/structured-pendant"
      )
    );
    expect(await screen.findByText(/product link copied/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /product details/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /specifications/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /materials & care/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /packaging/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /shipping & returns/i })).toBeInTheDocument();
    expect(screen.getByText(/longer detail copy\./i)).toBeInTheDocument();
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Sterling silver")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /shipping & returns/i }));
    expect(screen.getByRole("link", { name: /read full shipping & returns policy/i })).toHaveAttribute(
      "href",
      "https://example.com/shipping"
    );

    fireEvent.click(screen.getAllByAltText("Front view")[0]);
    expect(await screen.findByRole("button", { name: /close image viewer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next image/i })).toBeInTheDocument();
  });

  test("shows a mobile sticky purchase bar and disables add when sold out", async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: String(query).includes("max-width"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    mockApiGet.mockResolvedValue({
      data: {
        id: 77,
        name: "Sold Out Pendant",
        description: "Short intro",
        price: 49,
        selling_currency: "CAD",
        sku: "SO-77",
        qty_on_hand: 0,
        track_stock: true,
        is_digital: false,
        allow_international_shipping: false,
        created_at: "2026-06-01T12:00:00Z",
        images: [{ id: 1, url: "https://example.com/pendant.jpg", alt: "Sold Out Pendant" }],
      },
    });

    render(<ProductDetails />);

    expect(await screen.findByRole("heading", { name: "Sold Out Pendant" })).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: /add to basket/i });
    expect(addButtons.length).toBeGreaterThan(1);
    addButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
