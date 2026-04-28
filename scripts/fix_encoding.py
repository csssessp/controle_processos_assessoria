#!/usr/bin/env python3
"""
fix_encoding.py
Corrige bytes Latin-1 inválidos misturados em arquivo UTF-8.
Lê byte a byte: bytes UTF-8 válidos são mantidos; bytes inválidos são
tratados como Latin-1 e convertidos para o caractere Unicode correto.
"""

import sys

FILE = r'C:\Users\afpereira\Downloads\cgof_controle_Processos-main\pages\GpcProcessos_v2.tsx'

with open(FILE, 'rb') as f:
    raw = f.read()

result = []
i = 0
fixed_count = 0

while i < len(raw):
    b = raw[i]
    if b < 0x80:
        # ASCII byte
        result.append(chr(b))
        i += 1
    elif (0xC2 <= b <= 0xDF
          and i + 1 < len(raw)
          and 0x80 <= raw[i + 1] <= 0xBF):
        # Valid 2-byte UTF-8
        result.append(raw[i:i + 2].decode('utf-8'))
        i += 2
    elif (0xE0 <= b <= 0xEF
          and i + 2 < len(raw)
          and 0x80 <= raw[i + 1] <= 0xBF
          and 0x80 <= raw[i + 2] <= 0xBF):
        # Valid 3-byte UTF-8
        result.append(raw[i:i + 3].decode('utf-8'))
        i += 3
    elif (0xF0 <= b <= 0xF7
          and i + 3 < len(raw)
          and all(0x80 <= raw[i + j] <= 0xBF for j in range(1, 4))):
        # Valid 4-byte UTF-8
        result.append(raw[i:i + 4].decode('utf-8'))
        i += 4
    else:
        # Byte inválido para UTF-8 — interpretar como cp1252 (Windows-1252)
        # cp1252 cobre 0x80–0x9F com caracteres úteis (—, •, ", " etc.)
        # enquanto Latin-1 pura teria caracteres de controlo nesse intervalo
        try:
            char = bytes([b]).decode('cp1252')
        except Exception:
            char = chr(b)
        result.append(char)
        fixed_count += 1
        print(f'  Byte 0x{b:02X} na posição {i} → "{char}"', file=sys.stderr)
        i += 1

fixed = ''.join(result)

# Preservar line endings originais (detectar \r\n ou \n)
newline = '\r\n' if b'\r\n' in raw[:2000] else '\n'

with open(FILE, 'w', encoding='utf-8', newline=newline) as f:
    f.write(fixed)

print(f'Concluído. {fixed_count} byte(s) corrigido(s).')
