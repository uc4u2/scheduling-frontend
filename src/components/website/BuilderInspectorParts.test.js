import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ImageField } from "./BuilderInspectorParts";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../utils/api", () => ({ website: {} }));

jest.mock("./MediaLibraryDialog", () => function MediaLibraryDialogMock({ open, onPick }) {
  return open ? <button onClick={() => onPick({ url: "https://cdn.example.test/library-image.jpg" })}>Pick library image</button> : null;
});

describe("ImageField", () => {
  it("reuses the existing media library dialog and returns its selected URL", () => {
    const onChange = jest.fn();
    render(<ImageField label="Hero image" value="" onChange={onChange} companyId={10} />);

    fireEvent.click(screen.getByRole("button", { name: "Media library" }));
    fireEvent.click(screen.getByRole("button", { name: "Pick library image" }));

    expect(onChange).toHaveBeenCalledWith("https://cdn.example.test/library-image.jpg");
  });
});
