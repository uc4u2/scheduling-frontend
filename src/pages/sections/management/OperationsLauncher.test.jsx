import { buildProgressChecklist } from "./operationsLauncherLogic";

describe("OperationsLauncher progress checklist", () => {
  it("does not mark website content installed from a selected template key alone", () => {
    const checklist = buildProgressChecklist({
      profession: "home_services",
      answers: {
        team_size: "solo",
        primary_goal: "website",
        booking_now: "yes",
        sells_products: "no",
      },
      websiteStatus: {
        progress: {
          company_industry_chosen: true,
          website_content_installed: false,
          website_visual_style_selected: true,
          public_website_available: false,
        },
      },
    });

    expect(checklist.items.find((item) => item.key === "content")?.done).toBe(false);
    expect(checklist.items.find((item) => item.key === "visual_style")?.done).toBe(true);
  });

  it("requires a live site with published content before public website is available", () => {
    const checklist = buildProgressChecklist({
      profession: "medical_clinic",
      answers: {
        team_size: "2_5",
        primary_goal: "online_bookings",
        booking_now: "yes",
        sells_products: "no",
      },
      websiteStatus: {
        progress: {
          company_industry_chosen: true,
          website_content_installed: true,
          website_visual_style_selected: true,
          public_website_available: false,
        },
      },
    });

    expect(checklist.items.find((item) => item.key === "public_site")?.done).toBe(false);
  });
});
