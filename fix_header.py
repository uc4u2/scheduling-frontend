from pathlib import Path
path = Path('src/RecruiterCandidates.js')
lines = path.read_text().splitlines()
lines[0] = 'import React, { useEffect, useState, useMemo } from "react";'
path.write_text('\n'.join(lines) + '\n')
