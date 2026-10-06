import {
  buildProgressChecklist,
  resolveOperationsPublicWebsiteUrl,
} from "./operationsLauncherLogic";

describe("OperationsLauncher progress checklist", () => {
  it("opens an operational custom domain instead of the company slug", () => {
    expect(resolveOperationsPublicWebsiteUrl({
      companySlug: "beauty-salon",
      currentOrigin: "https://app.schedulaa.com",
      websiteStatus: {
        company_slug: "beauty-salon",
        is_live: true,
        published_renderer_engine: "nextjs",
        published_visual_theme_key: "iron-ember",
        public_url_contract: {
          primary_public_url: "https://www.lumiereprivatesalon.com/",
          schedulaa_url: "https://app.schedulaa.com/beauty-salon",
          custom_domain_url: "https://www.lumiereprivatesalon.com/",
          custom_domain_active: true,
        },
      },
    })).toBe("https://www.lumiereprivatesalon.com");
  });

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
