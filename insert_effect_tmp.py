from pathlib import Path

path = Path('src/candidateForms/CandidateFormsPanel.js')
text = path.read_text(encoding='utf-8')
anchor = '  const attachmentsAllowedMime = useMemo(() => {\n    const list = attachmentsStorage?.allowed_mime || attachmentsStorage?.allowedMime;\n    return Array.isArray(list) && list.length ? list : QUESTIONNAIRE_LIMITS.allowedMime;\n  }, [attachmentsStorage]);\n'
if anchor not in text:
    raise SystemExit('attachmentsAllowedMime anchor missing')
addition = "  const attachmentsAllowedMime = useMemo(() => {\n    const list = attachmentsStorage?.allowed_mime || attachmentsStorage?.allowedMime;\n    return Array.isArray(list) && list.length ? list : QUESTIONNAIRE_LIMITS.allowedMime;\n  }, [attachmentsStorage]);\n\n  useEffect(() => {\n    let active = True\n'"
