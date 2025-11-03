import { invitationQuestionnaires, api } from '../api';

describe('invitationQuestionnaires helpers', () => {
  const original = {
    get: api.get,
    put: api.put,
    delete: api.delete,
    post: api.post,
  };

  beforeEach(() => {
    api.get = jest.fn();
    api.put = jest.fn();
    api.delete = jest.fn();
    api.post = jest.fn();
  });

  afterAll(() => {
    api.get = original.get;
    api.put = original.put;
    api.delete = original.delete;
    api.post = original.post;
  });

  it('fetches the questionnaire assignments for an invitation', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1 }] });
    const result = await invitationQuestionnaires.list(321, { headers: { 'X-Company-Id': 7 } });
    expect(api.get).toHaveBeenCalledWith('/api/invitations/321/questionnaires', { headers: { 'X-Company-Id': 7 } });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('replaces questionnaire assignments with array payloads', async () => {
    api.put.mockResolvedValue({ data: { ok: true } });
    const payload = [
      { template_id: 5, required: true, sort_order: 1 },
      { template_id: 8, required: false, sort_order: 2 },
    ];
    const response = await invitationQuestionnaires.replace(55, payload);
    expect(api.put).toHaveBeenCalledWith('/api/invitations/55/questionnaires', payload, {});
    expect(response).toEqual({ ok: true });
  });

  it('removes a questionnaire assignment', async () => {
    api.delete.mockResolvedValue({ data: { removed: true } });
    const response = await invitationQuestionnaires.remove(44, 3, { headers: { 'X-Company-Id': 2 } });
    expect(api.delete).toHaveBeenCalledWith('/api/invitations/44/questionnaires/3', { headers: { 'X-Company-Id': 2 } });
    expect(response).toEqual({ removed: true });
  });

  it('reorders questionnaire assignments', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    const order = [9, 4, 1];
    const response = await invitationQuestionnaires.reorder(11, order);
    expect(api.post).toHaveBeenCalledWith('/api/invitations/11/questionnaires/reorder', order, {});
    expect(response).toEqual({ ok: true });
  });
});
