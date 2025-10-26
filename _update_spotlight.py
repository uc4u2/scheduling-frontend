from pathlib import Path
from textwrap import dedent

path = Path(r"C:\scheduler2\frontend\src\landing\pages\HomePage.js")
text = path.read_text()
# Remove inline useMemo spotlights block
old_block = dedent("""
      <Spotlight sections={useMemo(() => [
        {
          title: "Command center for every location",
          bullets: [
            "Assign roles, guardrails, and brand themes per branch.",
            "Monitor revenue, labor, and client sentiment in real time.",
            "Reuse the same booking flows across partner and franchise sites.",
          ],
          image: homeFeatureSections[1]?.imageUrl,
          alt: "Team collaborating inside Schedulaa operations center",
        },
        {
          title: "Automation that scales with you",
          bullets: [
            "Trigger onboarding, follow-ups, and payroll sync automatically.",
            "Push signal to Slack, CRM, and marketing apps via webhooks.",
            "Keep finance teams in sync with QuickBooks and Xero exports.",
          ],
          image: homeFeatureSections[2]?.imageUrl,
          alt: "Automation workflows visualized for service businesses",
        },
        {
          title: "One login for operations",
          bullets: [
            "Scheduling, payroll, and CRM context flow together.",
            "Managers approve shifts and payouts from the same view.",
            "Staff get a self-serve hub for availability and requests.",
          ],
          image: homeFeatureSections[0]?.imageUrl,
          alt: "Schedulaa product interface showing unified tools",
        },
      ], [])} accent={accent} />
""")
if old_block not in text:
    raise SystemExit('inline spotlight block not found')
text = text.replace(old_block, "      <Spotlight sections={spotlightSections} accent={accent} />\n")

# Insert spotlightSections constant after icon map
marker = "  const moduleIconMap = {\n    scheduling: EventAvailableIcon,"
new_constant = dedent("""
  const moduleIconMap = {
    scheduling: EventAvailableIcon,
    payroll: PaymentsRoundedIcon,
    storefront: LanguageIcon,
  };

  const spotlightSections = [
    {
      title: "Command center for every location",
      bullets: [
        "Assign roles, guardrails, and brand themes per branch.",
        "Monitor revenue, labor, and client sentiment in real time.",
        "Reuse the same booking flows across partner and franchise sites.",
      ],
      image: homeFeatureSections[1]?.imageUrl,
      alt: "Team collaborating inside Schedulaa operations center",
    },
    {
      title: "Automation that scales with you",
      bullets: [
        "Trigger onboarding, follow-ups, and payroll sync automatically.",
        "Push signal to Slack, CRM, and marketing apps via webhooks.",
        "Keep finance teams in sync with QuickBooks and Xero exports.",
      ],
      image: homeFeatureSections[2]?.imageUrl,
      alt: "Automation workflows visualized for service businesses",
    },
    {
      title: "One login for operations",
      bullets: [
        "Scheduling, payroll, and CRM context flow together.",
        "Managers approve shifts and payouts from the same view.",
        "Staff get a self-serve hub for availability and requests.",
      ],
      image: homeFeatureSections[0]?.imageUrl,
      alt: "Schedulaa product interface showing unified tools",
    },
  ];
""")
text = text.replace(marker, new_constant)
path.write_text(text)
