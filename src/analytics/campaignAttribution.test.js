import {
  appendCampaignAttributionToParams,
  captureCampaignAttribution,
  getCampaignAttribution,
} from './campaignAttribution';

describe('campaign attribution', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('stores only allowlisted campaign parameters', () => {
    expect(
      captureCampaignAttribution('?utm_source=google&utm_campaign=salon&gclid=click-1&srsltid=merchant-result-1&email=person@example.com')
    ).toEqual({
      utm_source: 'google',
      utm_campaign: 'salon',
      gclid: 'click-1',
      srsltid: 'merchant-result-1',
    });
    expect(getCampaignAttribution()).toEqual({
      utm_source: 'google',
      utm_campaign: 'salon',
      gclid: 'click-1',
      srsltid: 'merchant-result-1',
    });
  });

  it('preserves allowlisted Merchant attribution across the login handoff without PII', () => {
    const params = new URLSearchParams('tab=billing&plan=starter&interval=annual');
    appendCampaignAttributionToParams(params, {
      utm_source: 'google',
      srsltid: 'merchant-result-2',
      email: 'person@example.com',
      phone: '555-0100',
    });

    expect(params.get('utm_source')).toBe('google');
    expect(params.get('srsltid')).toBe('merchant-result-2');
    expect(params.has('email')).toBe(false);
    expect(params.has('phone')).toBe(false);
    expect(params.get('plan')).toBe('starter');
    expect(params.get('interval')).toBe('annual');
  });
});
