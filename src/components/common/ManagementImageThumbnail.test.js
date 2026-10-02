import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ManagementImageThumbnail, { resolveManagementImageUrl } from "./ManagementImageThumbnail";

const renderThumbnail = (props) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <ManagementImageThumbnail {...props} />
    </ThemeProvider>
  );

describe("ManagementImageThumbnail", () => {
  test("uses the first ordered image and opens the existing image manager", () => {
    const onClick = jest.fn();
    renderThumbnail({
      row: {
        images: [
          { id: 2, url_public: "https://cdn.example.test/primary.jpg" },
          { id: 3, url_public: "https://cdn.example.test/secondary.jpg" },
        ],
      },
      label: "Balayage",
      onClick,
    });

    const image = screen.getByRole("img", { name: "Balayage preview" });
    expect(image).toHaveAttribute("src", "https://cdn.example.test/primary.jpg");
    fireEvent.click(screen.getByRole("button", { name: "View or manage Balayage image" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("falls back to the canonical image asset and renders an accessible empty state", () => {
    expect(resolveManagementImageUrl({ image_asset: { url: "https://cdn.example.test/asset.png" } }))
      .toBe("https://cdn.example.test/asset.png");

    const { rerender } = renderThumbnail({ row: {}, label: "New product", onClick: jest.fn() });
    expect(screen.getByRole("button", { name: "Add New product image" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(
      <ThemeProvider theme={createTheme()}>
        <ManagementImageThumbnail
          row={{ images: [{ url_public: "https://cdn.example.test/broken.jpg" }] }}
          label="New product"
          onClick={jest.fn()}
        />
      </ThemeProvider>
    );
    fireEvent.error(screen.getByRole("img", { name: "New product preview" }));
    expect(screen.getByRole("button", { name: "Add New product image" })).toBeInTheDocument();
  });
});
