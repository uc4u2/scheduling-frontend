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

  it("previews a saved MP4 as video when the semantic field allows video", () => {
    render(
      <ImageField
        label="Hero image or video"
        value="/api/website/media/file/7/hero.mp4"
        onChange={jest.fn()}
        companyId={7}
        allowVideo
      />
    );

    expect(screen.getByLabelText("Hero image or video")).toHaveAttribute(
      "src",
      expect.stringContaining("/api/website/media/file/7/hero.mp4")
    );
    expect(screen.queryByAltText("selected")).not.toBeInTheDocument();
  });

  it.each([
    { name: "oversize.webp", type: "image/webp", size: 5 * 1024 * 1024 + 1, allowVideo: false, label: "manager.visualBuilder.inspector.imageField.upload", message: "Image is too large. Max size 5MB." },
    { name: "oversize.mp4", type: "video/mp4", size: 12 * 1024 * 1024 + 1, allowVideo: true, label: "Upload image/video", message: "Video is too large. Max size 12MB." },
  ])("explains the $type size limit before uploading", ({ name, type, size, allowVideo, label, message }) => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<ImageField label="Media" value="" onChange={jest.fn()} companyId={7} allowVideo={allowVideo} />);
    const file = new File([], name, { type });
    Object.defineProperty(file, "size", { value: size });

    fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining(message));
    alertSpy.mockRestore();
  });
});
