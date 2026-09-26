const mockInitialize = jest.fn();
const mockSend = jest.fn();
const mockEvent = jest.fn();

jest.mock('react-ga4', () => ({
  __esModule: true,
  default: {
    initialize: mockInitialize,
    send: mockSend,
    event: mockEvent,
  },
}));

describe('GA4 event helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    window.sessionStorage.clear();
    process.env.REACT_APP_GA_MEASUREMENT_ID = 'G-TEST123';
    mockInitialize.mockClear();
    mockSend.mockClear();
    mockEvent.mockClear();
  });

  afterEach(() => {
    delete process.env.REACT_APP_GA_MEASUREMENT_ID;
  });

  it('initializes once and emits named GA4 events', () => {
    const analytics = require('./ga');
    analytics.initGA();
    analytics.initGA();
    analytics.trackGAEvent('registration_complete', {
      account_role: 'manager',
      email: 'must-not-be-sent@example.com',
    });
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockEvent).toHaveBeenCalledWith('registration_complete', { account_role: 'manager' });
  });

  it('does not emit unapproved events', () => {
    const analytics = require('./ga');
    analytics.initGA();
    analytics.trackGAEvent('message_content', { page_path: '/register' });
    expect(mockEvent).not.toHaveBeenCalled();
  });

  it('removes query strings and fragments from page views', () => {
    const analytics = require('./ga');
    analytics.initGA();
    analytics.trackPageview({ path: '/billing/success?sid=secret#done', title: 'Billing' });
    expect(mockSend).toHaveBeenCalledWith({
      hitType: 'pageview',
      page: '/billing/success',
      title: 'Billing',
    });
  });

  it('deduplicates authoritative events within the browser session', () => {
    const analytics = require('./ga');
    analytics.initGA();
    analytics.trackGAEventOnce('subscription:one', 'subscription_activated', { plan_key: 'starter' });
    analytics.trackGAEventOnce('subscription:one', 'subscription_activated', { plan_key: 'starter' });
    expect(mockEvent).toHaveBeenCalledTimes(1);
  });
});
