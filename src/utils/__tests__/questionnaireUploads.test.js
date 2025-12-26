jest.mock('../../constants/questionnaireUploads', () => ({
  QUESTIONNAIRE_ALLOWED_MIME: ['application/pdf', 'image/png'],
  QUESTIONNAIRE_MAX_FILE_BYTES: 10 * 1024 * 1024,
  QUESTIONNAIRE_LIMITS: {
    maxFileMb: 10,
    maxFileBytes: 10 * 1024 * 1024,
    maxFilesPerSubmission: 10,
    allowedMime: ['application/pdf', 'image/png'],
    scanningEnabled: true,
  },
}));

jest.mock('../api', () => {
  const apiMock = jest.fn();
  apiMock.post = jest.fn();
  const questionnaireUploadsApiMock = {
    reserveRecruiter: jest.fn(),
    reserveCandidate: jest.fn(),
    completeRecruiter: jest.fn(),
    completeCandidate: jest.fn(),
    downloadRecruiter: jest.fn(),
    downloadCandidate: jest.fn(),
  };
  return { api: apiMock, questionnaireUploadsApi: questionnaireUploadsApiMock };
});

const { uploadQuestionnaireFile, validateQuestionnaireFile, downloadQuestionnaireFile } = require('../questionnaireUploads');
const { questionnaireUploadsApi, api } = require('../api');

describe('questionnaireUploads helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates file size and mime type using defaults', () => {
    const tooLarge = { size: 25 * 1024 * 1024, type: 'application/pdf', name: 'doc.pdf' };
    const tooLargeResult = validateQuestionnaireFile(tooLarge);
    expect(tooLargeResult.ok).toBe(false);
    expect(tooLargeResult.reason).toContain('10MB');

    const wrongType = { size: 1024, type: 'application/zip', name: 'archive.zip' };
    const wrongTypeResult = validateQuestionnaireFile(wrongType);
    expect(wrongTypeResult.ok).toBe(false);
    expect(wrongTypeResult.reason).toBe('File type is not allowed');

    const okFile = { size: 1024, type: 'application/pdf', name: 'file.pdf' };
    const okResult = validateQuestionnaireFile(okFile);
    expect(okResult.ok).toBe(true);
  });

  it('reserves and completes recruiter uploads without transport metadata', async () => {
    const file = { name: 'license.pdf', type: 'application/pdf', size: 4 };
    questionnaireUploadsApi.reserveRecruiter.mockResolvedValue({
      file: { id: 123, field_key: 'questionnaire_1' },
    });

    const onComplete = jest.fn();
    const result = await uploadQuestionnaireFile({
      context: 'recruiter',
      submissionId: 99,
      fieldKey: 'questionnaire_1',
      file,
      onComplete,
    });

    expect(questionnaireUploadsApi.reserveRecruiter).toHaveBeenCalledWith({
      submission_id: 99,
      field_key: 'questionnaire_1',
      filename: 'license.pdf',
      content_type: 'application/pdf',
      size: file.size,
    });
    expect(onComplete).toHaveBeenCalledWith({ id: 123, field_key: 'questionnaire_1' });
    expect(result).toEqual({ id: 123, field_key: 'questionnaire_1' });
  });

  it('handles S3 recruiter uploads and completes with returned metadata', async () => {
    const file = { name: 'medical.pdf', type: 'application/pdf', size: 6 };
    questionnaireUploadsApi.reserveRecruiter.mockResolvedValue({
      file: { id: 456, field_key: 'questionnaire_2' },
      upload: {
        provider: 's3',
        url: 'https://example.com/upload',
        method: 'POST',
        fields: { key: 'value' },
      },
    });
    questionnaireUploadsApi.completeRecruiter.mockResolvedValue({
      file: { id: 456, field_key: 'questionnaire_2', scan_status: 'pending' },
    });
    api.mockResolvedValue({});

    const onProgress = jest.fn();
    const completed = await uploadQuestionnaireFile({
      context: 'recruiter',
      submissionId: 44,
      fieldKey: 'questionnaire_2',
      file,
      onProgress,
    });

    expect(api).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: 'https://example.com/upload',
    }));
    expect(questionnaireUploadsApi.completeRecruiter).toHaveBeenCalledWith(456);
    expect(completed).toEqual({ id: 456, field_key: 'questionnaire_2', scan_status: 'pending' });
    const stages = onProgress.mock.calls.map(([payload]) => payload.stage);
    expect(stages).toContain('reserve');
    expect(stages).toContain('complete');
  });

  it('downloads recruiter files through the shared helper', async () => {
    questionnaireUploadsApi.downloadRecruiter.mockResolvedValue({ status: 200 });
    const response = await downloadQuestionnaireFile({ context: 'recruiter', fileId: 999 });
    expect(questionnaireUploadsApi.downloadRecruiter).toHaveBeenCalledWith(
      999,
      expect.objectContaining({ responseType: 'blob' })
    );
    expect(response).toEqual({ status: 200 });
  });
});
