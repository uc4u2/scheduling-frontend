import { fireEvent, render, screen } from "@testing-library/react";

import ProductBasketImage from "./ProductBasketImage";

describe("ProductBasketImage", () => {
  it("renders the selected product image stored with the basket line", () => {
    render(<ProductBasketImage item={{ name: "Silver Floral Ring", image: "https://example.test/ring.jpg" }} />);

    expect(screen.getByRole("img", { name: "Silver Floral Ring product image" })).toHaveAttribute(
      "src",
      "https://example.test/ring.jpg"
    );
  });

  it("falls back cleanly when the stored product image cannot load", () => {
    render(<ProductBasketImage item={{ name: "Silver Floral Ring", image: "https://example.test/missing.jpg" }} />);

    fireEvent.error(screen.getByRole("img", { name: "Silver Floral Ring product image" }));
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
  });
});
