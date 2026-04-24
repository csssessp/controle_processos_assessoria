#!/usr/bin/env python3
# patch_analise.py — patches GpcProcessos_v2.tsx to add MultiSelectChips for analysts

import os

FILE = os.path.join(os.path.dirname(__file__), '..', 'pages', 'GpcProcessos_v2.tsx')

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Also close the new grid div and the space-y-3 div properly
# We need to find the end of the grid and close it
# The old "grid" div wraps num_paginas + link
# We need to find "sm:col-span-2" after the link input to close the extra grid div

# Fix 1: Change the grid to space-y-3 + add analyst multi-select + wrap old grid
old1 = 'title="An\u00e1lise do Processo" />\n            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">'
new1 = '''title="An\u00e1lise do Processo" />
            <div className="space-y-3">
              <div>
                <label className={LABEL + ' flex items-center gap-1.5'}>
                  <User size={11} />T\u00e9cnicos Respons\u00e1veis pela An\u00e1lise
                  <span className="text-slate-300 font-normal normal-case tracking-normal text-[10px]">(m\u00faltiplos poss\u00edveis)</span>
                </label>
                <MultiSelectChips
                  options={gpcUsers}
                  selected={form.responsaveis_analise ?? []}
                  onChange={v => set('responsaveis_analise', v.length > 0 ? v : null)}
                />
                <p className="mt-1 text-xs text-slate-400">Cada analista \u00e9 contabilizado individualmente na produtividade</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">'''

if old1 in content:
    content = content.replace(old1, new1, 1)
    print('Patch 1 applied: analyst multi-select added')
else:
    print('WARN: Patch 1 not applied - marker not found')
    idx = content.find('title=')
    for i, m in enumerate(['An\u00e1lise do Processo', 'Analise do Processo']):
        idx2 = content.find(m)
        if idx2 >= 0:
            print(f'Found "{m}" at {idx2}')
            print(repr(content[idx2-50:idx2+200]))

# Fix 2: Close the inner grid div after the link section ends, before </div></section>
# The link section ends with:
#   </div>  (relative div)
# </div>  (link container)
# </div>  (grid)
# </section>
# We need to close the extra inner grid div we opened

# Find where the Análise section ends — right before "Situação do Processo"
old2 = '''              </div>
            </div>
          </section>

          {/* \u2500\u2500 Situa\u00e7\u00e3o do Processo \u2500\u2500 */}'''
new2 = '''              </div>
              </div>
            </div>
          </section>

          {/* \u2500\u2500 Situa\u00e7\u00e3o do Processo \u2500\u2500 */}'''

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Patch 2 applied: closed extra grid div')
else:
    print('WARN: Patch 2 not applied')

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done.')
