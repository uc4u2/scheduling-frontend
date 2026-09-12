import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FinanceDocumentIdentityCard from './FinanceDocumentIdentityCard';

const mockGetSettings = jest.fn();
const mockUpdateSettings = jest.fn();
const mockListMedia = jest.fn();
const mockUploadMedia = jest.fn();

jest.mock('../financeApi', () => ({
  getFinanceDocumentSettings: (...args) => mockGetSettings(...args),
  updateFinanceDocumentSettings: (...args) => mockUpdateSettings(...args),
}));

jest.mock('../../../utils/api', () => ({
  website: {
    listMedia: (...args) => mockListMedia(...args),
    uploadMedia: (...args) => mockUploadMedia(...args),
  },
}));

jest.mock('../../../utils/authedCompany', () => ({
  getAuthedCompanyId: () => 36,
}));

const payload = {
  finance_document_business_name: '',
  finance_document_identity: {
    overrides: {},
    logo_media_id: null,
    show_email: true,
    show_phone: true,
    show_website: true,
    address_mode: 'full',
    reviewed_at: null,
    needs_review: true,
    resolved: {
      business_name: 'Photo Artisto Corp.',
      logo_url: 'https://cdn.example.com/header-logo.png',
      public_email: 'office@example.com',
      public_phone: '4165550101',
      website: 'www.example.com',
      address_street: '10 Main Street',
      address_city: 'Toronto',
      address_state: 'ON',
      address_zip: 'M5V 2T6',
      country_code: 'CA',
      fields: {
        business_name: { value: 'Photo Artisto Corp.', source: 'company_profile', inherited_value: 'Photo Artisto Corp.' },
        logo: { value: 'https://cdn.example.com/header-logo.png', source: 'website_header_published', inherited_value: 'https://cdn.example.com/header-logo.png' },
        public_email: { value: 'office@example.com', source: 'company_profile', inherited_value: 'office@example.com' },
        public_phone: { value: '4165550101', source: 'company_profile', inherited_value: '4165550101' },
        website: { value: 'www.example.com', source: 'company_profile', inherited_value: 'www.example.com' },
        address_street: { value: '10 Main Street', source: 'company_profile', inherited_value: '10 Main Street' },
        address_city: { value: 'Toronto', source: 'company_profile', inherited_value: 'Toronto' },
        address_state: { value: 'ON', source: 'company_profile', inherited_value: 'ON' },
        address_zip: { value: 'M5V 2T6', source: 'company_profile', inherited_value: 'M5V 2T6' },
        country_code: { value: 'CA', source: 'company_profile', inherited_value: 'CA' },
      },
    },
  },
};

describe('FinanceDocumentIdentityCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue(payload);
    mockListMedia.mockResolvedValue({
      items: [{ id: 91, url: 'https://cdn.example.com/finance.png', file_type: 'image/png', alt_text: 'Finance mark' }],
    });
    mockUpdateSettings.mockResolvedValue({
      ...payload,
      finance_document_business_name: 'Schedulaa Web Design',
      finance_document_identity: {
        ...payload.finance_document_identity,
        needs_review: false,
        reviewed_at: '2026-09-12T12:00:00',
      },
    });
  });

  test('shows resolved values and their canonical sources', async () => {
    render(<FinanceDocumentIdentityCard />);
    expect(await screen.findByText('Finance Document Identity & Branding')).toBeInTheDocument();
    expect(screen.getAllByText(/Source: Company Profile/).length).toBeGreaterThan(0);
    expect(screen.getByText('Published website header', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Review your Finance document identity before sending your first Estimate or Invoice.')).toBeInTheDocument();
    expect(screen.getByText('Photo Artisto Corp.')).toBeInTheDocument();
  });

  test('saves optional overrides and visibility without editing Company Profile', async () => {
    render(<FinanceDocumentIdentityCard />);
    const name = await screen.findByLabelText('Document business name override');
    fireEvent.change(name, { target: { value: 'Schedulaa Web Design' } });
    fireEvent.click(screen.getByLabelText('Show email'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Finance identity' }));

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(mockUpdateSettings).toHaveBeenCalledWith(expect.objectContaining({
      finance_document_identity: expect.objectContaining({
        overrides: expect.objectContaining({ business_name: 'Schedulaa Web Design' }),
        show_email: false,
      }),
    }));
    expect(await screen.findByText('Finance document identity saved. Company Profile data was not changed.')).toBeInTheDocument();
  });

  test('dismisses the setup reminder at company level', async () => {
    render(<FinanceDocumentIdentityCard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Do not show again' }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith({
      finance_document_identity: { reviewed: true },
    }));
  });
});
