from pathlib import Path
text = Path('src/RecruiterDashboard.js').read_text()
idx = text.index('        </Grid>')
print(repr(text[idx:idx+40]))
