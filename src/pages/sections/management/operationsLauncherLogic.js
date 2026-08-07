export const buildProgressChecklist = ({ profession, answers, websiteStatus }) => {
  const serverProgress = websiteStatus?.progress || {};
  const items = [
    {
      key: "industry",
      label: "Company industry chosen",
      done:
        typeof serverProgress.company_industry_chosen === "boolean"
          ? serverProgress.company_industry_chosen
          : profession && profession !== "general",
    },
    {
      key: "team",
      label: "Team mode chosen",
      done: Boolean(answers.team_size),
    },
    {
      key: "goal",
      label: "Main workflow chosen",
      done: Boolean(answers.primary_goal),
    },
    {
      key: "booking",
      label: "Booking plan decided",
      done: answers.booking_now === "yes" || answers.booking_now === "no",
    },
    {
      key: "products",
      label: "Product mode decided",
      done: answers.sells_products === "yes" || answers.sells_products === "no",
    },
    {
      key: "content",
      label: "Website content installed",
      done: Boolean(serverProgress.website_content_installed),
    },
    {
      key: "visual_style",
      label: "Website visual style selected",
      done: Boolean(serverProgress.website_visual_style_selected),
    },
    {
      key: "public_site",
      label: "Public website available",
      done: Boolean(serverProgress.public_website_available),
    },
  ];
  const doneCount = items.filter((item) => item.done).length;
  const score = Math.round((doneCount / items.length) * 100);
  let label = "Getting started";
  if (score >= 85) label = "Launch-ready";
  else if (score >= 60) label = "Strong setup";
  else if (score >= 40) label = "Setup in progress";
  return { items, doneCount, total: items.length, score, label };
};
