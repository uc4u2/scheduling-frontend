import React from "react";
import { buildCanonicalHvacPageModel, isCorporateFlagshipSlug } from "../../hvac-shared/canonicalHvacPageModel";
import CorporateHomePage from "./CorporateHomePage";
import CorporateServicesPage from "./CorporateServicesPage";
import CorporateServiceDetailPage from "./CorporateServiceDetailPage";
import CorporateAboutPage from "./CorporateAboutPage";
import CorporateProjectsPage from "./CorporateProjectsPage";
import CorporateReviewsPage from "./CorporateReviewsPage";
import CorporateContactPage from "./CorporateContactPage";

export default function CorporatePageComposer({ page, site }) {
  const model = buildCanonicalHvacPageModel({ page, site });
  if (!model || !isCorporateFlagshipSlug(model.slug)) {
    return null;
  }
  switch (model.pageKind) {
    case "home":
      return <CorporateHomePage model={model} />;
    case "services":
      return <CorporateServicesPage model={model} />;
    case "about":
      return <CorporateAboutPage model={model} />;
    case "projects":
      return <CorporateProjectsPage model={model} />;
    case "reviews":
      return <CorporateReviewsPage model={model} />;
    case "contact":
      return <CorporateContactPage model={model} />;
    case "service-detail":
      return <CorporateServiceDetailPage model={model} />;
    default:
      return null;
  }
}

