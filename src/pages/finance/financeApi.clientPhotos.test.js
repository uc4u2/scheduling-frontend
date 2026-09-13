import api from "../../utils/api";
import {
  deleteManagerClient360FieldPhoto,
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

  test("uses the client-scoped private deletion endpoint", async () => {
    api.delete.mockResolvedValue({ data: { deleted_storage_object: true } });
    await deleteManagerClient360FieldPhoto(42, 81);
    expect(api.delete).toHaveBeenCalledWith("/api/manager/client-360/42/field-photos/81");
  });
});
