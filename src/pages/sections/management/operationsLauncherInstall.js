export function resolveSelectedContentPack(websiteCatalog, selectedTemplateKey) {
  if (!selectedTemplateKey) return null;
  return (
    (websiteCatalog?.available_content_packs || []).find(
      (item) => item.seed_template_key === selectedTemplateKey
    ) ||
    ((websiteCatalog?.recommended_content_pack?.seed_template_key || "") ===
    selectedTemplateKey
      ? websiteCatalog?.recommended_content_pack
      : null)
  );
}

export async function executeTemplateInstallAction({
  companyId,
  selectedTemplateKey,
  websiteCatalog,
  websiteApi,
}) {
  const selectedContentPack = resolveSelectedContentPack(
    websiteCatalog,
    selectedTemplateKey
  );
  if (selectedContentPack?.key) {
    await websiteApi.installContentPack(
      selectedContentPack.key,
      {
        clear_existing: true,
        publish: false,
        install_mode: "replace",
        expected_version: selectedContentPack.version,
      },
      { companyId }
    );
    return { kind: "content-pack", key: selectedContentPack.key };
  }

  await websiteApi.importTemplate(
    {
      key: selectedTemplateKey,
      template_key: selectedTemplateKey,
      clear_existing: true,
      publish: false,
      set_theme_from_template: true,
    },
    { companyId }
  );
  return { kind: "legacy-template", key: selectedTemplateKey };
}
