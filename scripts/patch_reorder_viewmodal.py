#!/usr/bin/env python3
"""patch_reorder_viewmodal.py — move Fluxo + Timeline sections to top of ViewModal content"""
import os

FILE = os.path.join(os.path.dirname(__file__), '..', 'pages', 'GpcProcessos_v2.tsx')
with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Find the Linha do Tempo + Registrar Evento blocks and extract them
old_block = '''        {/* ── Linha do Tempo do Processo ── */}
        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Sec icon={<TrendingUp size={13} />} title="Linha do Tempo do Processo" />
          <ProcessTimeline row={row} posicoes={posicoes} />
        </section>

        {/* ── Registrar Evento no Fluxo ── */}
        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Sec icon={<Activity size={13} />} title="Fluxo Técnico" />
          <FluxoTecnicoPanel
            registroId={row.codigo}
            posicoes={posicoes}
            numPaginas={row.num_paginas}
            gpcUsers={gpcUsers}
            signatoryUsers={signatoryUsers}
            responsavelAssinatura={row.responsavel_assinatura}
            responsavelAssinatura2={row.responsavel_assinatura_2}
            onRecordUpdated={onRecordUpdated}
            readOnly={false}
            hideAssinatura={true}
          />
        </section>'''

if old_block in content:
    # Remove from current position
    content = content.replace(old_block, '', 1)
    print('Removed old Fluxo+Timeline blocks')
else:
    print('WARN: old_block not found')

# 2. Insert the new blocks right before the "Indicadores chave" section
new_blocks = '''        {/* ── Registrar Evento no Fluxo ── */}
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-slate-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
          <Sec icon={<Activity size={13} />} title="Registrar Novo Evento no Fluxo" />
          <FluxoTecnicoPanel
            registroId={row.codigo}
            posicoes={posicoes}
            numPaginas={row.num_paginas}
            gpcUsers={gpcUsers}
            signatoryUsers={signatoryUsers}
            responsavelAssinatura={row.responsavel_assinatura}
            responsavelAssinatura2={row.responsavel_assinatura_2}
            onRecordUpdated={onRecordUpdated}
            readOnly={false}
            hideAssinatura={true}
          />
        </section>

        {/* ── Linha do Tempo do Processo ── */}
        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Sec icon={<TrendingUp size={13} />} title="Linha do Tempo do Processo" />
          <ProcessTimeline row={row} posicoes={posicoes} />
        </section>

        '''

# Insert before the "Indicadores chave" section
anchor = '        {/* ── Indicadores chave ── */}'
if anchor in content:
    content = content.replace(anchor, new_blocks + anchor, 1)
    print('Inserted Fluxo+Timeline before Indicadores')
else:
    print('WARN: anchor not found')

# 3. Fix P6a - lock state in RegistroModal
# Find the exact transition point in RegistroModal
# RegistroModal is defined later in the file - find its set function
old_p6a = '''  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isEditing = !!(liveRecord?.codigo);'''

new_p6a = '''  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isEditing = !!(liveRecord?.codigo);

  // Section locking (require password to edit Identificação + Classificação)
  const [identLocked, setIdentLocked] = useState(isEditing);
  const [classifLocked, setClassifLocked] = useState(isEditing);
  const tryUnlock = (setter: (v: boolean) => void) => {
    const pw = window.prompt('Digite a senha para liberar a edição desta seção:');
    if (pw === SECTION_PASSWORD) {
      setter(false);
    } else if (pw !== null) {
      alert('Senha incorreta. Acesso negado.');
    }
  };
  const LockBtn = ({ locked, onUnlock }: { locked: boolean; onUnlock: () => void }) => (
    <button
      type="button"
      onClick={locked ? onUnlock : undefined}
      title={locked ? 'Clique para desbloquear (requer senha)' : 'Seção desbloqueada para edição'}
      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
        locked
          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer'
          : 'bg-green-50 text-green-700 border border-green-200 cursor-default'
      }`}
    >
      {locked ? <Lock size={11} /> : <Unlock size={11} />}
      {locked ? 'Bloqueado' : 'Desbloqueado'}
    </button>
  );'''

if old_p6a in content:
    content = content.replace(old_p6a, new_p6a, 1)
    print('P6a lock state in RegistroModal OK')
else:
    print('WARN P6a: not found, searching...')
    idx = content.find('const set = (k: keyof GpcRecebido')
    if idx >= 0:
        print(repr(content[idx:idx+300]))

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done.')
