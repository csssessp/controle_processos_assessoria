"""Fix literal \\uXXXX escape sequences written into the TSX file."""
import re

path = 'pages/GpcProcessos_v2.tsx'

with open(path, encoding='utf-8') as f:
    src = f.read()

# Map of literal escape sequence → correct UTF-8 character
replacements = [
    (r'\u00ea', 'ê'),   # ê  (convênio)
    (r'\u00ed', 'í'),   # í  (município, exercício, disponível)
    (r'\u00e7', 'ç'),   # ç  (aplicação)
    (r'\u00e3', 'ã'),   # ã  (aplicação)
    (r'\u00f3', 'ó'),   # ó  (próximo)
    (r'\u26a0', '⚠'),   # ⚠  (warning symbol)
]

fixed = src
for esc, char in replacements:
    before = fixed.count(esc)
    fixed = fixed.replace(esc, char)
    after = fixed.count(esc)
    print(f"  {esc} → {char!r}: replaced {before - after} occurrence(s)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(fixed)

print("Done.")
