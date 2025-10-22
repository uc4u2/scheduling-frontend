from pathlib import Path
import re
path = Path("src/landing/pages/ContactPage.js")
text = path.read_text()
text = re.sub(
    r"items: \[(?:.|\n)*?\],",
    "items: [\n      {\n        key: \"sales\",\n        title: \"Sales & demos\",\n        description: \"Plan walkthroughs, pricing guidance, and migration timelines tailored to your team.\",\n      },\n      {\n        key: \"partnerships\",\n        title: \"Partnerships\",\n        description: \"Reseller, integration, and co-marketing opportunities for platforms serving creatives.\",\n      },\n      {\n        key: \"support\",\n        title: \"Support\",\n        description: \"24-hour ticket response, enterprise onboarding, and dedicated success managers on Pro.\",\n      },\n    ],",
    text,
    count=1,
    flags=re.S,
)
text = text.replace(
    "        section={contactContent.section}\n",
    "        section={{ ...contactContent.section, Align: \"center\" }}\n",
    1,
)
path.write_text(text)
