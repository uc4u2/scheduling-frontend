import { captureCampaignAttribution, getCampaignAttribution } from './campaignAttribution';

describe('campaign attribution', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('stores only allowlisted campaign parameters', () => {
    expect(
      captureCampaignAttribution('?utm_source=google&utm_campaign=salon&gclid=click-1&email=person@example.com')
    ).toEqual({ utm_source: 'google', utm_campaign: 'salon', gclid: 'click-1' });
    expect(getCampaignAttribution()).toEqual({ utm_source: 'google', utm_campaign: 'salon', gclid: 'click-1' });
  });
});

