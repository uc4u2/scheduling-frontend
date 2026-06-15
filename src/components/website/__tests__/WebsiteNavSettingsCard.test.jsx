import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import WebsiteNavSettingsCard from "../WebsiteNavSettingsCard";

const theme = createTheme();

function renderCard(props = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <WebsiteNavSettingsCard
        companyId={1}
        companySlug="uc-jalali"
        value={{
          nav_style: {},
          nav_overrides: {
            show_reviews_tab: true,
            reviews_tab_label: "Reviews",
            show_login_tab: true,
            login_tab_label: "Login",
            show_my_bookings_tab: true,
            my_bookings_tab_label: "My Bookings",
            menu_source: "pages",
          },
        }}
        {...props}
      />
    </ThemeProvider>
  );
}

describe("WebsiteNavSettingsCard", () => {
  it("keeps system link toggles off after a stale parent rerender", () => {
    const handleChange = jest.fn();
    const initialValue = {
      nav_style: {},
      nav_overrides: {
        show_reviews_tab: true,
        reviews_tab_label: "Reviews",
        show_login_tab: true,
        login_tab_label: "Login",
        show_my_bookings_tab: true,
        my_bookings_tab_label: "My Bookings",
        menu_source: "pages",
      },
    };

    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <WebsiteNavSettingsCard
          companyId={1}
          companySlug="uc-jalali"
          value={initialValue}
          onChange={handleChange}
        />
      </ThemeProvider>
    );

    const loginToggle = screen.getByLabelText(/show client login/i);
    expect(loginToggle).toBeChecked();

    fireEvent.click(loginToggle);
    expect(loginToggle).not.toBeChecked();

    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nav_overrides: expect.objectContaining({
          show_login_tab: false,
        }),
      })
    );

    rerender(
      <ThemeProvider theme={theme}>
        <WebsiteNavSettingsCard
          companyId={1}
          companySlug="uc-jalali"
          value={{
            ...initialValue,
            nav_overrides: { ...initialValue.nav_overrides },
          }}
          onChange={handleChange}
        />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/show client login/i)).not.toBeChecked();
  });

  it("saves explicit false values for all system links", () => {
    const handleSave = jest.fn();
    renderCard({ onSave: handleSave });

    fireEvent.click(screen.getByLabelText(/show reviews/i));
    fireEvent.click(screen.getByLabelText(/show client login/i));
    fireEvent.click(screen.getByLabelText(/show my bookings/i));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        nav_overrides: expect.objectContaining({
          show_reviews_tab: false,
          show_login_tab: false,
          show_my_bookings_tab: false,
        }),
      })
    );
  });
});
