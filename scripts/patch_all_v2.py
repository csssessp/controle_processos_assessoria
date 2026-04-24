#!/usr/bin/env python3
"""patch_all_v2.py — all pending UI changes for GpcProcessos_v2.tsx"""
import os, sys

FILE = os.path.join(os.path.dirname(__file__), '..', 'pages', 'GpcProcessos_v2.tsx')
with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

def apply(name, old, new):
    global content
    if old in content:
        content = content.replace(old, new, 1)
        print(f'  OK  {name}')
    else:
        print(f'  MISS {name}')

# ─────────────────────────────────────────────────────────────────────────────
# P1: Add Unlock to imports
# ─────────────────────────────────────────────────────────────────────────────
apply('P1 import Unlock',
    '  ShieldCheck, ShieldAlert, ShieldOff, Award, KeyRound,',
    '  ShieldCheck, ShieldAlert, ShieldOff, Award, KeyRound, Unlock,')

# ─────────────────────────────────────────────────────────────────────────────
# P2: Add SECTION_PASSWORD constant after fmtTs
# ─────────────────────────────────────────────────────────────────────────────
apply('P2 SECTION_PASSWORD constant',
    '// ---- InlineTable ----',
    '// ---- Section password ----\nconst SECTION_PASSWORD = \'cgof2026\';\n\n// ---- InlineTable ----')

# ─────────────────────────────────────────────────────────────────────────────
# P3: Add ProcessTimeline component (before ProdPanel)
# ─────────────────────────────────────────────────────────────────────────────
PROCESS_TIMELINE = '''
// ---- ProcessTimeline: chronological process flow ----
const ProcessTimeline = ({ row, posicoes }: { row: GpcRecebido; posicoes: GpcPosicao[] }) => {
  type TLEvent = {
    id: string; date: string; tipo: string; color: string;
    iconType: string; title: string; detail: string; badge?: string;
  };
  const [events, setEvents] = useState<TLEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      GpcService.getProdutividade(row.codigo),
      GpcService.getFluxoTecnico(row.codigo),
    ]).then(([prod, fluxo]) => {
      const ev: TLEvent[] = [];

      // Cadastro event
      if (row.created_at) {
        ev.push({
          id: 'created', date: row.created_at, tipo: 'CADASTRO',
          color: 'bg-slate-600', iconType: 'file',
          title: 'Processo cadastrado no sistema',
          detail: row.responsavel_cadastro || row.responsavel || '',
        });
      }

      // Produtividade events (excluding CADASTRO which is already above)
      for (const p of prod) {
        if (p.evento === 'INICIO_ANALISE') {
          ev.push({
            id: `prod-${p.id}`, date: p.data_evento, tipo: 'ANALISE',
            color: 'bg-sky-500', iconType: 'search',
            title: `Processo em análise — ${p.responsavel}`,
            detail: '',
            badge: p.responsavel,
          });
        } else if (p.evento === 'RESPONSAVEL') {
          ev.push({
            id: `prod-${p.id}`, date: p.data_evento, tipo: 'RESPONSAVEL',
            color: 'bg-amber-500', iconType: 'user',
            title: `Mudança de analista — ${p.responsavel}`,
            detail: p.obs ?? '',
          });
        }
      }

      // Fluxo técnico events
      for (const ft of fluxo) {
        const posLabel = posicoes.find(p => p.codigo === ft.posicao_id)?.posicao ?? ft.posicao;
        const title = posLabel
          ? `Posição: ${posLabel}`
          : ft.movimento ?? ft.acao ?? 'Evento registrado';
        ev.push({
          id: `ft-${ft.id}`, date: ft.data_evento, tipo: 'FLUXO',
          color: posLabel ? 'bg-purple-600' : ft.movimento ? 'bg-blue-600' : 'bg-slate-500',
          iconType: 'activity',
          title,
          detail: ft.tecnico ?? '',
          badge: ft.movimento ?? undefined,
        });
      }

      ev.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(ev);
      setLoading(false);
    });
  }, [row.codigo]);

  if (loading) return (
    <div className="flex items-center gap-2 py-6 justify-center text-slate-400 text-sm">
      <Loader2 size={14} className="animate-spin" />Carregando linha do tempo...
    </div>
  );
  if (!events.length) return (
    <div className="text-center py-6 text-slate-400 text-sm italic">Nenhum evento registrado ainda</div>
  );

  const IconFor = ({ type }: { type: string }) => {
    if (type === 'file') return <FileText size={14} />;
    if (type === 'search') return <Search size={14} />;
    if (type === 'user') return <User size={14} />;
    return <Activity size={14} />;
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-slate-200 to-transparent" />
      <div className="space-y-0">
        {events.map((ev, idx) => (
          <div key={ev.id} className={`relative flex items-start gap-3 ${idx < events.length - 1 ? 'pb-4' : ''}`}>
            <div className={`relative z-10 w-10 h-10 rounded-full ${ev.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white`}>
              <IconFor type={ev.iconType} />
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm min-w-0 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="font-semibold text-sm text-slate-800 leading-snug">{ev.title}</div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap font-medium tabular-nums">{fmtTs(ev.date)}</div>
              </div>
              {ev.detail && (
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <User size={10} className="flex-shrink-0" />{ev.detail}
                </div>
              )}
              {ev.badge && ev.badge !== ev.title && (
                <span className="mt-1.5 inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                  {ev.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

'''

apply('P3 ProcessTimeline component',
    'const ProdPanel = ({ registroId }: { registroId: number }) => {',
    PROCESS_TIMELINE + 'const ProdPanel = ({ registroId }: { registroId: number }) => {')

# ─────────────────────────────────────────────────────────────────────────────
# P4: ViewModal - Replace Fluxo Técnico section with editable panel + move up
#     And add ProcessTimeline replacing "Histórico de Atribuições"
# ─────────────────────────────────────────────────────────────────────────────
# 4a: Replace "Fluxo Técnico" (readOnly=true) section with readOnly=false and move to top
# 4b: Replace "Histórico de Atribuições" with ProcessTimeline

# 4a: Change readOnly={true} to readOnly={false} in FluxoTecnicoPanel inside ViewModal
apply('P4a FluxoTecnico readOnly=false',
    '            readOnly={true}\n            hideAssinatura={true}',
    '            readOnly={false}\n            hideAssinatura={true}')

# 4b: Swap Fluxo Técnico section above Situação section, and replace Histórico with ProcessTimeline

old_fluxo_section = '''        {/* ── Fluxo Técnico ── */}
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
        </section>

        {/* ── Histórico de Atribuições ── */}
        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Sec icon={<TrendingUp size={13} />} title="Histórico de Atribuições" />
          <ProdPanel registroId={row.codigo} />
        </section>'''

new_fluxo_section = '''        {/* ── Linha do Tempo do Processo ── */}
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

apply('P4b Fluxo+Timeline restructure', old_fluxo_section, new_fluxo_section)

# 4c: Move Fluxo Técnico section to appear right after indicadores (before Assinaturas)
# We need to rearrange: Indicadores → [Fluxo+Timeline] → Assinaturas → Situação
# Currently order: Indicadores → Assinaturas → Situação → Fluxo → Histórico
# New order:       Indicadores → [Timeline] → [FluxoForm] → Assinaturas → Situação

# Actually P4b already merged them. Now let's reorder: move them before Assinaturas.
old_order = '''        {/* ── Linha do Tempo do Processo ── */}
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
        </section>

        {/* ── Responsáveis pela Assinatura ── */}'''

new_order = '''        {/* ── Registrar Evento no Fluxo ── */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-5 shadow-sm">
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

        {/* ── Responsáveis pela Assinatura ── */}'''

apply('P4c Reorder Fluxo before Assinaturas', old_order, new_order)

# ─────────────────────────────────────────────────────────────────────────────
# P5: Main table - update "Responsável" column to show cadastro + analistas
# ─────────────────────────────────────────────────────────────────────────────
old_resp_col = '''                          <td className="px-3 py-3">
                            {r.responsavel
                              ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {r.responsavel.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium text-slate-700 truncate max-w-[90px]" title={r.responsavel}>
                                    {r.responsavel}
                                  </span>
                                </div>
                              ) : <span className="text-slate-300 text-xs">-</span>}
                          </td>'''

new_resp_col = '''                          <td className="px-3 py-3 min-w-[140px]">
                            {/* Cadastrado por */}
                            {(r.responsavel_cadastro || r.responsavel) && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                  {(r.responsavel_cadastro || r.responsavel)!.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] text-slate-500 truncate max-w-[100px]" title={r.responsavel_cadastro || r.responsavel || ''}>
                                  {r.responsavel_cadastro || r.responsavel}
                                </span>
                              </div>
                            )}
                            {/* Analistas */}
                            {(r.responsaveis_analise ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-0.5">
                                {(r.responsaveis_analise ?? []).slice(0, 2).map(a => (
                                  <span key={a} className="inline-flex items-center px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-semibold border border-sky-100" title={a}>
                                    {a.split(' ')[0]}
                                  </span>
                                ))}
                                {(r.responsaveis_analise ?? []).length > 2 && (
                                  <span className="inline-flex items-center px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                                    +{(r.responsaveis_analise ?? []).length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (!(r.responsavel_cadastro || r.responsavel) && (
                              <span className="text-slate-300 text-xs">—</span>
                            ))}
                          </td>'''

apply('P5 responsavel column in main table', old_resp_col, new_resp_col)

# ─────────────────────────────────────────────────────────────────────────────
# P6: RegistroModal - Add password lock for Identificação and Classificação
# ─────────────────────────────────────────────────────────────────────────────
# 6a: Add lock state before the return statement in RegistroModal
# Find the RegistroModal component's state declarations

old_modal_state = '''  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));

  const Sec = ({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => ('''

new_modal_state = '''  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));

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
  );

  const Sec = ({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => ('''

apply('P6a lock state in RegistroModal', old_modal_state, new_modal_state)

# 6b: Add lock to Identificação section header
apply('P6b Identificação section lock',
    '            <Sec icon={<FileText size={13} />} title="Identificação do Processo" />',
    '            <Sec icon={<FileText size={13} />} title="Identificação do Processo" action={isEditing ? <LockBtn locked={identLocked} onUnlock={() => tryUnlock(setIdentLocked)} /> : undefined} />')

# 6c: Wrap Identificação grid with lock overlay
apply('P6c Identificação grid lock wrap',
    '            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n              <div>\n                <label className={LABEL}>Número do Processo *</label>',
    '            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${identLocked ? \'opacity-50 pointer-events-none select-none\' : \'\'}`}>\n              <div>\n                <label className={LABEL}>Número do Processo *</label>')

# 6d: Add lock to Classificação section header
apply('P6d Classificação section lock',
    '            <Sec icon={<ClipboardList size={13} />} title="Classificação e Posição" />',
    '            <Sec icon={<ClipboardList size={13} />} title="Classificação e Posição" action={isEditing ? <LockBtn locked={classifLocked} onUnlock={() => tryUnlock(setClassifLocked)} /> : undefined} />')

# 6e: Wrap Classificação grid with lock overlay
apply('P6e Classificação grid lock wrap',
    '            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">\n              <div>\n                <label className={LABEL}>Exercício (ano)</label>',
    '            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${classifLocked ? \'opacity-50 pointer-events-none select-none\' : \'\'}`}>\n              <div>\n                <label className={LABEL}>Exercício (ano)</label>')

# ─────────────────────────────────────────────────────────────────────────────
# P7: Update table header - rename "Responsável" column to "Cadastro / Analistas"
# ─────────────────────────────────────────────────────────────────────────────
apply('P7 table header responsavel label',
    '                      <SortTh label="Responsável" col="responsavel" sort={sort} onSort={toggleSort} />',
    '                      <SortTh label="Cadastro / Analistas" col="responsavel" sort={sort} onSort={toggleSort} />')

# ─────────────────────────────────────────────────────────────────────────────
# Save
# ─────────────────────────────────────────────────────────────────────────────
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print('\nDone.')
