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

  it("repositions directly in the existing image preview and commits once on release", () => {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: MouseEvent,
    });
    const onPositionPreview = jest.fn();
    const onPositionChange = jest.fn();
    render(
      <ImageField
        label="Gallery image"
        value="https://cdn.example.test/gallery.jpg"
        onChange={jest.fn()}
        companyId={7}
        position={{ x: 50, y: 50 }}
        onPositionPreview={onPositionPreview}
        onPositionChange={onPositionChange}
      />
    );

    const surface = screen.getByRole("application", { name: /Gallery image/ });
    surface.getBoundingClientRect = () => ({
      width: 400,
      height: 160,
      top: 0,
      left: 0,
      right: 400,
      bottom: 160,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    fireEvent.pointerDown(surface, { button: 0, pointerId: 1, clientX: 200, clientY: 80 });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 160, clientY: 96 });

    expect(onPositionPreview).toHaveBeenLastCalledWith({ x: 60, y: 40 });
    expect(onPositionChange).not.toHaveBeenCalled();

    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 160, clientY: 96 });
    expect(onPositionChange).toHaveBeenCalledTimes(1);
    expect(onPositionChange).toHaveBeenCalledWith({ x: 60, y: 40 });
    expect(screen.queryByText("Adjust visible area")).not.toBeInTheDocument();
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
