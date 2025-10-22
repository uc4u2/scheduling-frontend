from pathlib import Path

path = Path(r'C:/scheduler2/frontend/src/EnhancedInvitationForm.js')
text = path.read_text(encoding='utf-8')
old = "          const resolved =\n            (data.effective_profession ||\n              data.default_profession ||\n              data.profession ||\n              \"\")\n              .trim();\n          if (resolved) {\n            nextProfession = resolved;\n          } else {\n            nextProfession = \"custom\";\n          }\n"
if old not in text:
    raise SystemExit('initialisation block not found')
new = "          const normalise = (value) => (typeof value === \"string\" ? value.trim() : value);\n          const companyDefault = normalise(data?.default_profession) || \"\";\n          const effective = normalise(data?.effective_profession) || \"\";\n          const personal = normalise(data?.profession) || \"\";\n          const resolved = companyDefault or effective or personal\n"
