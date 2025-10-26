from pathlib import Path
path = Path("src/App.js")
text = path.read_text()
old = "  const baseTheme = useMemo(() => (themeMap[themeName] || coolTheme), [themeName, tenantHostMode]);\n"
new = "  const baseTheme = useMemo(() => {\n    const theme = themeMap[themeName] || coolTheme;\n    if (tenantHostMode === \"custom\") {\n      // TODO: custom domain routing will adjust theming/entrypoints per tenant host.\n    }\n    return theme;\n  }, [themeName, tenantHostMode]);\n"
if old not in text:
    raise SystemExit('baseTheme line not found for update block')
text = text.replace(old, new, 1)
path.write_text(text)
