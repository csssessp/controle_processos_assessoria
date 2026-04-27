#!/usr/bin/env python3
"""
patch_tabs.py
Adiciona estrutura de abas ao RegistroModal para simplificar a tela de edição.
"""

FILE = r'C:\Users\afpereira\Downloads\cgof_controle_Processos-main\pages\GpcProcessos_v2.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. Adicionar estado activeTab ──────────────────────────────────────────────
OLD1 = "  const [savedOk, setSavedOk] = useState(false);"
NEW1 = (
    "  const [savedOk, setSavedOk] = useState(false);\n"
    "\n"
    "  const [activeTab, setActiveTab] = useState<'analise' | 'ident' | 'fluxo' | 'financeiro'>('analise');"
)
assert OLD1 in src, "PATCH 1 not found"
src = src.replace(OLD1, NEW1, 1)

# ── 2. Substituir abertura do div scrollável + injetar barra de abas ───────────
OLD2 = '      <div className="max-h-[78vh] overflow-y-auto pr-1 space-y-4">'
NEW2 = '''\
      {/* ── Barra de abas ── */}
      <div className="flex border-b border-slate-200 mb-4 gap-0 flex-wrap -mx-1">
        {([
          { id: 'analise',    label: 'Análise',       icon: '🔍' },
          { id: 'ident',      label: 'Identificação', icon: '📄' },
          ...(isEditing ? [
            { id: 'fluxo',      label: 'Fluxo',         icon: '⚡' },
            { id: 'financeiro', label: 'Financeiro',     icon: '💰' },
          ] : []),
        ] as { id: string; label: string; icon: string }[]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="text-base leading-none">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[66vh] overflow-y-auto pr-1">'''
assert OLD2 in src, "PATCH 2 not found"
src = src.replace(OLD2, NEW2, 1)

# ── 3. Fechar o div extra no final (antes do bloco de sub-modais) ─────────────
# O div.max-h-[78vh] original fechava depois de )}  (end of isEditing block)
# Precisamos fechar também o novo div extra que abrimos.
OLD3 = '      </div>\n\n\n\n      {/* Sub-modals */}'
NEW3 = '      </div>\n\n      </div>\n\n\n\n      {/* Sub-modals */}'
assert OLD3 in src, "PATCH 3 not found: " + repr(src[src.find('Sub-modals')-50:src.find('Sub-modals')+20])
src = src.replace(OLD3, NEW3, 1)

# ── 4. Envolver Identificação + Classificação com aba 'ident' ─────────────────
OLD4 = (
    '          {/* -- Identificação do Processo -- */}\n'
    '\n'
    '          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">'
)
NEW4 = (
    '          {activeTab === \'ident\' && (<>\n'
    '\n'
    '          {/* -- Identificação do Processo -- */}\n'
    '\n'
    '          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">'
)
assert OLD4 in src, "PATCH 4 not found"
src = src.replace(OLD4, NEW4, 1)

# Fechar após a seção Classificação — encontrar o marcador "-- Análise --"
OLD5 = (
    '          {/* -- Análise -- */}\n'
    '\n'
    '          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">\n'
    '\n'
    '            <Sec icon={<BookOpen size={13} />} title="Análise do Processo" />'
)
NEW5 = (
    '          </>)}\n'
    '\n'
    '          {activeTab === \'analise\' && (<>\n'
    '\n'
    '          {/* -- Análise -- */}\n'
    '\n'
    '          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">\n'
    '\n'
    '            <Sec icon={<BookOpen size={13} />} title="Análise do Processo" />'
)
assert OLD5 in src, "PATCH 5 not found"
src = src.replace(OLD5, NEW5, 1)

# Fechar após a seção Situação — antes do save bar
OLD6 = (
    '          {/* -- Save bar -- */}\n'
    '\n'
    '          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white/97 backdrop-blur-sm py-3">'
)
NEW6 = (
    '          </>)}\n'
    '\n'
    '          {/* -- Save bar -- */}\n'
    '\n'
    '          {(activeTab === \'analise\' || activeTab === \'ident\' || activeTab === \'fluxo\') && (\n'
    '          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white/97 backdrop-blur-sm py-3">'
)
assert OLD6 in src, "PATCH 6 not found"
src = src.replace(OLD6, NEW6, 1)

# Fechar o wrapping condicional do save bar
OLD7 = (
    '              {isEditing ? \'Salvar Alterações\' : \'Cadastrar Processo\'}\n'
    '\n'
    '              </button>\n'
    '\n'
    '            </div>\n'
    '\n'
    '          </div>\n'
    '\n'
    '        </form>'
)
NEW7 = (
    '              {isEditing ? \'Salvar Alterações\' : \'Cadastrar Processo\'}\n'
    '\n'
    '              </button>\n'
    '\n'
    '            </div>\n'
    '\n'
    '          </div>\n'
    '          )}\n'
    '\n'
    '        </form>'
)
assert OLD7 in src, "PATCH 7 not found: " + repr(src[src.find('Cadastrar Processo')-10:src.find('Cadastrar Processo')+200])
src = src.replace(OLD7, NEW7, 1)

# ── 5. Reestruturar o bloco isEditing: fluxo vs financeiro ───────────────────
OLD8 = (
    '        {isEditing && (\n'
    '\n'
    '          <div className="space-y-4 pb-4">\n'
    '\n'
    '\n'
    '\n'
    '            {/* Fluxo Técnico */}\n'
    '\n'
    '            <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">\n'
    '\n'
    '              <Sec icon={<Activity size={13} />} title="Fluxo Técnico e Responsáveis pela Assinatura" />'
)
NEW8 = (
    '        {isEditing && activeTab === \'fluxo\' && (\n'
    '\n'
    '          <div className="space-y-4 pb-4">\n'
    '\n'
    '\n'
    '\n'
    '            {/* Fluxo Técnico */}\n'
    '\n'
    '            <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">\n'
    '\n'
    '              <Sec icon={<Activity size={13} />} title="Fluxo Técnico e Responsáveis pela Assinatura" />'
)
assert OLD8 in src, "PATCH 8 not found"
src = src.replace(OLD8, NEW8, 1)

# Fechar a aba fluxo e abrir a aba financeiro antes do loadingFull
OLD9 = (
    '            {loadingFull && (\n'
    '\n'
    '              <div className="flex items-center gap-2 py-5 justify-center text-slate-400 text-sm">\n'
    '\n'
    '                <Loader2 size={16} className="animate-spin" />Carregando dados vinculados...\n'
    '\n'
    '              </div>\n'
    '\n'
    '            )}\n'
    '\n'
    '\n'
    '\n'
    '            {!loadingFull && full && ('
)
NEW9 = (
    '          </div>\n'
    '\n'
    '        )}\n'
    '\n'
    '        {isEditing && activeTab === \'financeiro\' && (\n'
    '\n'
    '          <div className="space-y-4 pb-4">\n'
    '\n'
    '            {loadingFull && (\n'
    '\n'
    '              <div className="flex items-center gap-2 py-5 justify-center text-slate-400 text-sm">\n'
    '\n'
    '                <Loader2 size={16} className="animate-spin" />Carregando dados vinculados...\n'
    '\n'
    '              </div>\n'
    '\n'
    '            )}\n'
    '\n'
    '\n'
    '\n'
    '            {!loadingFull && full && ('
)
assert OLD9 in src, "PATCH 9 not found: " + repr(src[src.find('loadingFull'):src.find('loadingFull')+200])
src = src.replace(OLD9, NEW9, 1)

# ── Também adicionar o fluxo em aba 'fluxo' na barra de save ─────────────────
# Já está feito no PATCH 6 acima (activeTab === 'fluxo' incluído)

with open(FILE, 'w', encoding='utf-8', newline='\n') as f:
    f.write(src)

print("✅ Patch aplicado com sucesso!")
