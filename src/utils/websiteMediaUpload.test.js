import { uploadWebsiteMediaFile } from "./websiteMediaUpload";

describe("Website Media upload transport", () => {
  const file = { name: "hero.png", type: "image/png", size: 11 };

  test("uploads directly and finalizes when public storage is available", async () => {
    const presign = {
      direct_upload: true,
      upload_url: "https://r2-upload.example/signed",
      key: "company/7/website-media/immutable-hero.png",
    };
    const uploadDirect = jest.fn().mockResolvedValue(undefined);
    const finalizeDirect = jest.fn().mockResolvedValue([{ id: 9 }]);
    const uploadMultipart = jest.fn();

    const result = await uploadWebsiteMediaFile({
      file,
      requestPresign: jest.fn().mockResolvedValue(presign),
      uploadDirect,
      finalizeDirect,
      uploadMultipart,
    });

    expect(uploadDirect).toHaveBeenCalledWith(presign, file);
    expect(finalizeDirect).toHaveBeenCalledWith(presign, file);
    expect(uploadMultipart).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 9 }]);
  });

  test("uses multipart only when direct storage is explicitly unavailable", async () => {
    const uploadMultipart = jest.fn().mockResolvedValue([{ id: 10 }]);
    const result = await uploadWebsiteMediaFile({
      file,
      requestPresign: jest.fn().mockRejectedValue({ response: { status: 409 } }),
      uploadDirect: jest.fn(),
      finalizeDirect: jest.fn(),
      uploadMultipart,
    });

    expect(uploadMultipart).toHaveBeenCalledWith(file);
    expect(result).toEqual([{ id: 10 }]);
  });

  test("does not duplicate an upload after a direct transport failure", async () => {
    const uploadMultipart = jest.fn();
    await expect(uploadWebsiteMediaFile({
      file,
      requestPresign: jest.fn().mockResolvedValue({
        direct_upload: true,
        upload_url: "https://r2-upload.example/signed",
        key: "company/7/website-media/immutable-hero.png",
      }),
      uploadDirect: jest.fn().mockRejectedValue(new Error("R2 rejected upload")),
      finalizeDirect: jest.fn(),
      uploadMultipart,
    })).rejects.toThrow("R2 rejected upload");
    expect(uploadMultipart).not.toHaveBeenCalled();
  });
});
