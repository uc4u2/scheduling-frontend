import {
  FIELD_PHOTO_HELP,
  FIELD_PHOTO_MAX_INPUT_BYTES,
  FIELD_PHOTO_UNSUPPORTED,
  fieldPhotoAuthorizePath,
  uploadFieldPhoto,
  validateFieldPhoto,
} from "./fieldPhotoUpload";

jest.mock("./api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const photo = (overrides = {}) => ({
  name: "inspection.heic",
  type: "image/heic",
  size: 20 * 1024 * 1024,
  lastModified: 1,
  ...overrides,
});

describe("Field Photos V1.1 shared direct uploader", () => {
  test("publishes the 25 MB and automatic optimization contract", () => {
    expect(FIELD_PHOTO_HELP).toMatch(/Photos up to 25 MB/);
    expect(FIELD_PHOTO_HELP).toMatch(/automatically optimized/);
    expect(FIELD_PHOTO_MAX_INPUT_BYTES).toBe(25 * 1024 * 1024);
  });

  test("provides the three context-specific authorization routes", () => {
    expect(fieldPhotoAuthorizePath.employeeShift(11)).toBe("/employee/shifts/11/field-photos/authorize");
    expect(fieldPhotoAuthorizePath.employeeWorkOrder(22)).toBe("/finance/my-work-orders/22/field-photos/authorize");
    expect(fieldPhotoAuthorizePath.managerClient(33)).toBe("/api/manager/client-360/33/field-photos/authorize");
  });

  test("rejects unsupported and oversized originals before authorization", () => {
    expect(() => validateFieldPhoto(photo({ name: "evidence.dng", type: "image/dng" }))).toThrow(FIELD_PHOTO_UNSUPPORTED);
    expect(() => validateFieldPhoto(photo({ size: FIELD_PHOTO_MAX_INPUT_BYTES + 1 }))).toThrow(/Maximum original size: 25 MB/);
  });

  test("authorizes, PUTs privately, finalizes once, and polls to Ready", async () => {
    const apiClient = {
      post: jest.fn()
        .mockResolvedValueOnce({ data: {
          upload_id: "upload-1",
          upload: { url: "https://private.invalid/object", headers: { "Content-Type": "image/heic" } },
          finalize_url: "/finalize/upload-1",
          status_url: "/status/upload-1",
        } })
        .mockResolvedValueOnce({ data: { photo: { id: 1, processing_status: "pending_scan" } } }),
      get: jest.fn()
        .mockResolvedValueOnce({ data: { photo: { id: 1, processing_status: "processing" } } })
        .mockResolvedValueOnce({ data: { photo: { id: 1, processing_status: "ready" } } }),
    };
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true });
    const onStatus = jest.fn();
    const result = await uploadFieldPhoto({
      file: photo(), directUploadEnabled: true, authorizePath: "/authorize",
      apiClient, fetchImpl, onStatus,
    });
    expect(result.processing_status).toBe("ready");
    expect(fetchImpl).toHaveBeenCalledWith("https://private.invalid/object", expect.objectContaining({ method: "PUT" }));
    expect(apiClient.post).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenLastCalledWith("/finalize/upload-1", {});
    expect(onStatus).toHaveBeenCalledWith("ready", expect.anything());
  });

  test("deduplicates concurrent upload/finalize operations", async () => {
    let release;
    const delayed = new Promise((resolve) => { release = resolve; });
    const apiClient = {
      post: jest.fn()
        .mockReturnValueOnce(delayed)
        .mockResolvedValueOnce({ data: { photo: { processing_status: "ready" } } }),
      get: jest.fn(),
    };
    const file = photo({ size: 1000 });
    const options = {
      file, directUploadEnabled: true, authorizePath: "/authorize", apiClient,
      fetchImpl: jest.fn().mockResolvedValue({ ok: true }),
    };
    const first = uploadFieldPhoto(options);
    const second = uploadFieldPhoto(options);
    release({ data: {
      upload: { url: "https://private.invalid/object", headers: {} },
      finalize_url: "/finalize", status_url: "/status",
    } });
    await Promise.all([first, second]);
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  test("uses the compatible proxied path when direct upload is disabled", async () => {
    const fallbackUpload = jest.fn().mockResolvedValue({ id: 9, processing_status: "ready" });
    const apiClient = { post: jest.fn() };
    const result = await uploadFieldPhoto({
      file: photo({ size: 1024 }), directUploadEnabled: false,
      authorizePath: "/authorize", fallbackUpload, apiClient,
    });
    expect(result.id).toBe(9);
    expect(fallbackUpload).toHaveBeenCalledTimes(1);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  test("returns failed and blocked processing states without claiming Ready", async () => {
    for (const state of ["failed", "blocked"]) {
      const apiClient = {
        post: jest.fn()
          .mockResolvedValueOnce({ data: { upload: { url: "x", headers: {} }, finalize_url: "/f", status_url: "/s" } })
          .mockResolvedValueOnce({ data: { photo: { processing_status: state } } }),
        get: jest.fn(),
      };
      const result = await uploadFieldPhoto({
        file: photo({ name: `${state}.jpg`, type: "image/jpeg", size: 1000, lastModified: Date.now() }),
        directUploadEnabled: true, authorizePath: "/authorize", apiClient,
        fetchImpl: jest.fn().mockResolvedValue({ ok: true }),
      });
      expect(result.processing_status).toBe(state);
    }
  });
});
