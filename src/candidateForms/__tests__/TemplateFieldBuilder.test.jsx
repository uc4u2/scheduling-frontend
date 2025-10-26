import React from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import TemplateFieldBuilder from "../TemplateFieldBuilder";

const renderWithTheme = (ui) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('TemplateFieldBuilder', () => {
  it('emits add field events with normalised values', async () => {
    const handleChange = jest.fn();

    renderWithTheme(<TemplateFieldBuilder fields={[]} onChange={handleChange} reservedKeys={['candidate_name']} />);

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/Field Label/i), { target: { value: 'License Number' } });
    const saveButton = within(dialog).getByRole('button', { name: /^Add Field$/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(handleChange).toHaveBeenCalled());
    const [fields] = handleChange.mock.calls[0];
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('License Number');
    expect(fields[0].key).toBe('license_number');
    expect(fields[0].type).toBe('text');
  });

  it('prevents duplicate keys', async () => {
    const handleChange = jest.fn();
    const existing = [{ key: 'license_number', label: 'License Number', type: 'text', is_required: true, config: {}, order_index: 0 }];

    renderWithTheme(<TemplateFieldBuilder fields={existing} onChange={handleChange} reservedKeys={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/Field Label/i), { target: { value: 'License Number' } });
    fireEvent.change(within(dialog).getByLabelText(/Field Key/i), { target: { value: 'license_number' } });

    const saveButton = within(dialog).getByRole('button', { name: /^Add Field$/i });
    fireEvent.click(saveButton);

    expect(await within(dialog).findByText(/Key must be unique/i)).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
