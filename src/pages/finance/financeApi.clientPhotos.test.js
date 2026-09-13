import api from "../../utils/api";
import {
  deleteManagerClient360FieldPhoto,
  uploadMyWorkOrderFieldPhotoFromDevice,
  uploadManagerClient360PhotoFromDevice,
} from "./financeApi";

jest.mock("../../utils/api", () => ({
  __esModule: true,
  API_BASE_URL: "http://127.0.0.1:5000",
  default: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../utils/authedCompany", () => ({
  getAuthedCompanyId: () => 7,
}));

describe("Client 360 private photo API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uploads directly to Field Photos instead of Website Media", async () => {
    const file = new File(["photo"], "inspection.heic", { type: "image/heic" });
    api.post.mockResolvedValue({ data: { photo: { id: 81, source: "manager_field_photo" } } });

    const result = await uploadManagerClient360PhotoFromDevice(42, file, { note: "Front side" });

    expect(result).toEqual({ id: 81, source: "manager_field_photo" });
    expect(api.post).toHaveBeenCalledTimes(1);
    const [path, form, options] = api.post.mock.calls[0];
    expect(path).toBe("/api/manager/client-360/42/field-photos");
    expect(path).not.toContain("website/media");
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("file")).toBe(file);
    expect(form.get("note")).toBe("Front side");
    expect(options.headers["Content-Type"]).toBe("multipart/form-data");
  });

  test("uses the direct quarantine flow for manager Client 360 when enabled", async () => {
    const file = new File(["photo"], "inspection.heic", { type: "image/heic" });
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true });
    api.post
      .mockResolvedValueOnce({ data: {
        upload: { url: "https://private.invalid/client-photo", headers: { "Content-Type": "image/heic" } },
        finalize_url: "/api/field-photos/uploads/client-upload/finalize",
        status_url: "/api/field-photos/uploads/client-upload",
      } })
      .mockResolvedValueOnce({ data: { photo: { id: 82, processing_status: "ready" } } });

    const result = await uploadManagerClient360PhotoFromDevice(42, file, { directUploadEnabled: true });

    expect(result).toEqual({ id: 82, processing_status: "ready" });
    expect(api.post.mock.calls[0][0]).toBe("/api/manager/client-360/42/field-photos/authorize");
    expect(api.post.mock.calls[1][0]).toBe("/api/field-photos/uploads/client-upload/finalize");
    expect(fetchSpy).toHaveBeenCalledWith("https://private.invalid/client-photo", expect.objectContaining({ method: "PUT", body: file }));
    fetchSpy.mockRestore();
  });

  test("uses the direct quarantine flow for an employee work order when enabled", async () => {
    const file = new File(["photo"], "equipment.webp", { type: "image/webp" });
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true });
    api.post
      .mockResolvedValueOnce({ data: {
        upload: { url: "https://private.invalid/work-order-photo", headers: { "Content-Type": "image/webp" } },
        finalize_url: "/api/field-photos/uploads/work-order-upload/finalize",
        status_url: "/api/field-photos/uploads/work-order-upload",
      } })
      .mockResolvedValueOnce({ data: { photo: { id: 83, processing_status: "ready" } } });

    const result = await uploadMyWorkOrderFieldPhotoFromDevice(71, file, { directUploadEnabled: true });

    expect(result).toEqual({ id: 83, processing_status: "ready" });
    expect(api.post.mock.calls[0][0]).toBe("/finance/my-work-orders/71/field-photos/authorize");
    expect(api.post.mock.calls[1][0]).toBe("/api/field-photos/uploads/work-order-upload/finalize");
    expect(fetchSpy).toHaveBeenCalledWith("https://private.invalid/work-order-photo", expect.objectContaining({ method: "PUT", body: file }));
    fetchSpy.mockRestore();
  });

  test("uses the client-scoped private deletion endpoint", async () => {
    api.delete.mockResolvedValue({ data: { deleted_storage_object: true } });
    await deleteManagerClient360FieldPhoto(42, 81);
    expect(api.delete).toHaveBeenCalledWith("/api/manager/client-360/42/field-photos/81");
  });
});
