import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { MyBasketEmbedded } from "./MyBasket";

const mockApiGet = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/basket", search: `?${mockSearchParams.toString()}` }),
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: "beauty-salon" }),
  useSearchParams: () => [mockSearchParams],
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  api: {
    get: (...args) => mockApiGet(...args),
  },
  publicSite: {
    getWebsiteShell: jest.fn(),
  },
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "primary",
}));

jest.mock("../../components/website/SiteFrame", () => ({ children }) => <>{children}</>);

describe("MyBasket empty-state navigation", () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
    window.sessionStorage.clear();
    mockApiGet.mockReturnValue(new Promise(() => {}));
  });

  it("keeps a service-only tenant basket on the services journey", async () => {
    mockSearchParams = new URLSearchParams({
      site: "beauty-salon",
      services_return_to: "/services",
    });

    render(<MyBasketEmbedded slug="beauty-salon" />);

    expect(screen.getByRole("button", { name: "Browse services" })).toBeInTheDocument();
    expect(screen.getByText("Review services and appointment details before checkout.")).toBeInTheDocument();
  });

  it("retains the product journey when the tenant bridge supplies a product return", async () => {
    mockSearchParams = new URLSearchParams({
      site: "shop",
      return_to: "/products",
      services_return_to: "/services",
    });

    render(<MyBasketEmbedded slug="shop" />);

    expect(screen.getByRole("button", { name: "Browse products" })).toBeInTheDocument();
    expect(screen.getByText("Review products before completing your purchase.")).toBeInTheDocument();
  });
});
