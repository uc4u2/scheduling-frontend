# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('src/pages/sections/management/VisualSiteBuilder.js').read_text(encoding='utf-8')
text = text.replace('label="{t("manager.visualBuilder.controls.toggles.fullPreview")}"', 'label={t("manager.visualBuilder.controls.toggles.fullPreview")}')
text = text.replace('helperText="{t("manager.visualBuilder.pages.settings.fields.slugHint")}"', 'helperText={t("manager.visualBuilder.pages.settings.fields.slugHint")}')
text = text.replace('title="{t("manager.visualBuilder.sections.tooltip")}"', 'title={t("manager.visualBuilder.sections.tooltip")}')
text = text.replace('description="{t("manager.visualBuilder.sections.description")}"', 'description={t("manager.visualBuilder.sections.description")}')
text = text.replace('<SectionCard title="{t("manager.visualBuilder.canvas.empty.title")}" description="{t("manager.visualBuilder.canvas.empty.description")}">', '<SectionCard title={t("manager.visualBuilder.canvas.empty.title")} description={t("manager.visualBuilder.canvas.empty.description")} >')
text = text.replace('title="{t("manager.visualBuilder.inspector.reset")} to sensible defaults for this section type"', 'title={t("manager.visualBuilder.inspector.resetTooltip")}')
Path('src/pages/sections/management/VisualSiteBuilder.js').write_text(text, encoding='utf-8')
