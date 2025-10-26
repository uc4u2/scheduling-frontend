from pathlib import Path

path = Path('src/candidateForms/CandidateFormsPanel.js')
text = path.read_text(encoding='utf-8')

old_import = 'import { candidateIntakeApi } from "../utils/api";'
new_import = 'import { candidateIntakeApi, settingsApi } from "../utils/api";'
if old_import in text:
    text = text.replace(old_import, new_import, 1)
else:
    raise SystemExit('candidateIntakeApi import not found')

anchor = '  const [showAdvancedSchema, setShowAdvancedSchema] = useState(false);\n  const [showAdvancedFields, setShowAdvancedFields] = useState(false);\n'
if anchor not in text:
    raise SystemExit('advanced schema state anchor missing')
state_insertion = "  const [showAdvancedSchema, setShowAdvancedSchema] = useState(false);\n  const [showAdvancedFields, setShowAdvancedFields] = useState(false);\n  const [defaultProfessionKey, setDefaultProfessionKey] = useState(\"\");\n  const [effectiveProfessionKey, setEffectiveProfessionKey] = useState(\"\");\n  const [settingsError, setSettingsError] = useState(\"\");\n"
text = text.replace(anchor, state_insertion, 1)

anchor_effect = '  const attachmentsAllowedMime = useMemo(() => {\n    const list = attachmentsStorage?.allowed_mime || attachmentsStorage?.allowedMime;\n    return Array.isArray(list) && list.length ? list : QUESTIONNAIRE_LIMITS.allowedMime;\n  }, [attachmentsStorage]);\n'
if anchor_effect not in text:
    raise SystemExit('attachmentsAllowedMime anchor missing')
settings_effect = "  const attachmentsAllowedMime = useMemo(() => {\n    const list = attachmentsStorage?.allowed_mime || attachmentsStorage?.allowedMime;\n    return Array.isArray(list) && list.length ? list : QUESTIONNAIRE_LIMITS.allowedMime;\n  }, [attachmentsStorage]);\n\n  useEffect(() => {\n    let active = True\n"
