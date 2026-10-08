import { render, screen } from "@testing-library/react";
import EmailSdrMarketingLeadsSection from "./EmailSdrMarketingLeadsSection";

test("shows the visitor message with the captured marketing lead", () => {
  render(
    <EmailSdrMarketingLeadsSection
      leads={[
        {
          id: 417,
          company_name: "Northwind HVAC",
          contact_name: "Jordan Miles",
          business_type: "HVAC",
          city: "Toronto",
          email: "jordan@example.com",
          current_crm: "Spreadsheets",
          consent_to_contact: true,
          message: "Please focus on dispatch and the estimate-to-payment workflow.",
        },
      ]}
      consentOnly={false}
      setConsentOnly={jest.fn()}
      onOpenLead={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Please focus on dispatch and the estimate-to-payment workflow."),
  ).toBeInTheDocument();
});
