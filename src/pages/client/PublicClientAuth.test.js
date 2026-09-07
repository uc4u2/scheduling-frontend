import React from "react";
import { render, screen } from "@testing-library/react";

import PublicClientAuth from "./PublicClientAuth";

jest.mock("../../utils/api", () => ({
  api: { post: jest.fn() },
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "platform",
}));

jest.mock("../../utils/timezone", () => ({
  formatTimezoneLabel: () => "Toronto (America/Toronto)",
  getUserTimezone: () => "America/Toronto",
}));

jest.mock("../../components/TimezoneSelect", () => () => null);
jest.mock("../../components/Meta", () => () => null);
jest.mock("../../config/origins", () => ({
  buildMarketingLegalUrl: (path) => `https://schedulaa.com${path}`,
}));

describe("PublicClientAuth", () => {
  it("keeps autofilled login values clear of their field labels", () => {
    render(<PublicClientAuth slug="web-design" />);

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    const emailLabel = document.querySelector(`label[for="${email.id}"]`);
    const passwordLabel = document.querySelector(`label[for="${password.id}"]`);

    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(emailLabel).toHaveClass("MuiInputLabel-shrink");
    expect(passwordLabel).toHaveClass("MuiInputLabel-shrink");
  });
});
