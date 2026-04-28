#!/usr/bin/env python3
"""patch_v4.py — fix user name in fluxo, valor total exercicio, full UI redesign"""
import os, sys

FILE = os.path.join(os.path.dirname(__file__), '..', 'pages', 'GpcProcessos_v2.tsx')
with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

applied = []
missed  = []

def apply(name, old, new):
    global content
    if old in content:
        content = content.replace(old, new, 1)
        applied.append(name)
    else:
        missed.append(name)

# ═══════════════════════════════════════════════════════════════════════
# FIX 1: FluxoTecnicoFormInline — add useEffect to sync user, fix display
# ═══════════════════════════════════════════════════════════════════════
apply('F1a: add useEffect after form init',
    '''  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const now = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const set = (k: keyof GpcFluxoTecnico, v: any) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await GpcService.saveFluxoTecnico({ ...form, registro_id: registroId, data_evento: new Date().toISOString() });
      setForm({ registro_id: registroId, num_paginas_analise: numPaginas ?? undefined, tecnico: currentUserName ?? undefined });
      onSaved();
    } catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };''',
    '''  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  // Sync logged-in user whenever prop becomes available (e.g. after auth resolves)
  useEffect(() => {
    if (currentUserName) setForm(f => ({ ...f, tecnico: currentUserName }));
  }, [currentUserName]);
  const now = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const set = (k: keyof GpcFluxoTecnico, v: any) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await GpcService.saveFluxoTecnico({ ...form, registro_id: registroId, data_evento: new Date().toISOString() });
      setForm({ registro_id: registroId, num_paginas_analise: numPaginas ?? undefined, tecnico: currentUserName ?? undefined });
      onSaved();
    } catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };''')

# FIX 1b: display uses form.tecnico (not currentUserName) so submitted value matches display
apply('F1b: display form.tecnico in readonly badge',
    '''          <div className={INPUT + \' bg-slate-50 text-slate-700 flex items-center gap-2 select-none\'}>{
            currentUserName
              ? <><div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{currentUserName.charAt(0).toUpperCase()}</div><span className="text-sm font-medium">{currentUserName}</span><span className="ml-auto text-[10px] text-slate-400 font-medium">Usuário logado</span></>
              : <span className="text-slate-400 text-xs italic">Não identificado</span>
          }</div>''',
    '''          <div className={INPUT + \' bg-slate-50 text-slate-700 flex items-center gap-2 select-none\'}>
            {form.tecnico
              ? <><div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{form.tecnico.charAt(0).toUpperCase()}</div><span className="text-sm font-medium">{form.tecnico}</span><span className="ml-auto text-[10px] text-slate-400 font-medium">Usuário logado</span></>
              : <><div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0"><User size={10} className="text-slate-500" /></div><span className="text-slate-400 text-xs italic">Carregando usuário...</span></>}
          </div>''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 2: RegistroModal — pass currentUserName to its FluxoTecnicoPanel
# ═══════════════════════════════════════════════════════════════════════
apply('F2: RegistroModal FluxoTecnicoPanel currentUserName',
    '''              <FluxoTecnicoPanel
                registroId={liveRecord!.codigo}
                posicoes={posicoes}
                numPaginas={form.num_paginas}
                gpcUsers={gpcUsers}
                signatoryUsers={signatoryUsers}
                responsavelAssinatura={form.responsavel_assinatura}
                responsavelAssinatura2={form.responsavel_assinatura_2}
                onRecordUpdated={onRecordUpdated}
              />''',
    '''              <FluxoTecnicoPanel
                registroId={liveRecord!.codigo}
                posicoes={posicoes}
                numPaginas={form.num_paginas}
                gpcUsers={gpcUsers}
                signatoryUsers={signatoryUsers}
                responsavelAssinatura={form.responsavel_assinatura}
                responsavelAssinatura2={form.responsavel_assinatura_2}
                onRecordUpdated={onRecordUpdated}
                currentUserName={currentUser?.name ?? undefined}
              />''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 3: ExercicioForm — add valor total = repasse + aplicacao
# ═══════════════════════════════════════════════════════════════════════
apply('F3: ExercicioForm valor total field',
    '''        <div><label className={LABEL}>Repasse (R$)</label><CurrencyInput value={f.repasse} onChange={v => set('repasse', v)} /></div>
        <div><label className={LABEL}>Aplicação (R$)</label><CurrencyInput value={f.aplicacao} onChange={v => set('aplicacao', v)} /></div>
        <div><label className={LABEL}>Gastos (R$)</label><CurrencyInput value={f.gastos} onChange={v => set('gastos', v)} /></div>
        <div><label className={LABEL}>Devolvido (R$)</label><CurrencyInput value={f.devolvido} onChange={v => set('devolvido', v)} /></div>
      </div>''',
    '''        <div><label className={LABEL}>Repasse (R$)</label><CurrencyInput value={f.repasse} onChange={v => set('repasse', v)} /></div>
        <div><label className={LABEL}>Aplicação (R$)</label><CurrencyInput value={f.aplicacao} onChange={v => set('aplicacao', v)} /></div>
        {(((f.repasse ?? 0) + (f.aplicacao ?? 0)) > 0) && (
          <div className="col-span-2">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Valor Total do Convênio</div>
                <div className="text-[10px] text-blue-400 mt-0.5">Repasse + Aplicação</div>
              </div>
              <div className="text-lg font-bold text-blue-700">
                {((f.repasse ?? 0) + (f.aplicacao ?? 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
        )}
        <div><label className={LABEL}>Gastos (R$)</label><CurrencyInput value={f.gastos} onChange={v => set('gastos', v)} /></div>
        <div><label className={LABEL}>Devolvido (R$)</label><CurrencyInput value={f.devolvido} onChange={v => set('devolvido', v)} /></div>
      </div>''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 4: Add MovimentoBadge component (after SituacaoBadge)
# ═══════════════════════════════════════════════════════════════════════
MOVIMENTOBADGE = '''
// ---- MovimentoBadge ----
const MOV_CFG: Record<string, { bg: string; text: string; border: string }> = {
  'EM ANÁLISE':            { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  'AGUARDANDO':            { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'AGUARDANDO ANÁLISE':    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'ENCAMINHADO':           { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  'ENCAMINHADO AO GGCON':  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  'DEVOLVIDO':             { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  'DEVOLVIDO À DRS':       { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  'DEVOLVIDO A DRS':       { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  'DILIGÊNCIA':            { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'RECEBIDO':              { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  'REANÁLISE':             { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  'CONCLUÍDO':             { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  'CONCLUSÃO':             { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  'ARQUIVADO':             { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },
  'ARQUIVAMENTO':          { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },
};
const MOV_DEF = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };

const MovimentoBadge = ({ movimento }: { movimento: string | null | undefined }) => {
  if (!movimento) return <span className="text-slate-300 text-xs">—</span>;
  const key = movimento.toUpperCase();
  const c = Object.entries(MOV_CFG).find(([k]) => k === key || key.startsWith(k))?.[1] ?? MOV_DEF;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>
      {movimento}
    </span>
  );
};

'''

apply('F4: insert MovimentoBadge after SituacaoBadge',
    '// ---- Situacao Badge ----',
    '// ---- MovimentoBadge + Situacao Badge ----' + MOVIMENTOBADGE + '\n// ---- Situacao Badge ----')

# ═══════════════════════════════════════════════════════════════════════
# FIX 5: Header — improve button group (XLSX export)
# ═══════════════════════════════════════════════════════════════════════
apply('F5: header export button style',
    '''            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
              onClick={exportXLSX}
            >
              <Download size={14} />Exportar XLSX
            </button>
            <button className={BTN_PRI} onClick={() => setModal({})}>
              <Plus size={16} />Novo Registro
            </button>''',
    '''            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
              onClick={exportXLSX}
            >
              <Download size={15} />Exportar XLSX
            </button>
            <button className={BTN_PRI} onClick={() => setModal({})}>
              <Plus size={16} />Novo Registro
            </button>''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 6: KPI cards — larger, more visual
# ═══════════════════════════════════════════════════════════════════════
apply('F6: KPI cards section',
    '''          {/* Total */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-slate-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-700 leading-none">{stats.total.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Total de Processos</div>
              </div>
            </div>
            {/* Em Análise */}
            <div className="bg-white rounded-xl border border-sky-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                <Search size={16} className="text-sky-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-sky-700 leading-none">{stats.emAnalise.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Em Análise</div>
                <div className="text-[10px] text-slate-400">{stats.total > 0 ? Math.round((stats.emAnalise / stats.total) * 100) : 0}% do total</div>
              </div>
            </div>
            {/* Acima de Remessa */}
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <ArrowUp size={16} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-indigo-700 leading-none">{stats.acima.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Acima de Remessa</div>
                <div className="text-[10px] text-slate-400">{stats.total > 0 ? Math.round((stats.acima / stats.total) * 100) : 0}% do total</div>
              </div>
            </div>
            {/* Parcelamentos */}
            <div className="bg-white rounded-xl border border-emerald-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <DollarSign size={16} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-700 leading-none">{stats.parcelamentos.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Parcelamentos</div>
                <div className="text-[10px] text-slate-400">{stats.total > 0 ? Math.round((stats.parcelamentos / stats.total) * 100) : 0}% do total</div>
              </div>
            </div>''',
    '''          {/* Total */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                <FileText size={20} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-slate-800 leading-none tracking-tight">{stats.total.toLocaleString('pt-BR')}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Total de Processos</div>
              </div>
            </div>
            {/* Em Análise */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Search size={20} className="text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-sky-700 leading-none tracking-tight">{stats.emAnalise.toLocaleString('pt-BR')}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Em Análise</div>
                <div className="text-[11px] text-sky-400 font-medium mt-0.5">{stats.total > 0 ? Math.round((stats.emAnalise / stats.total) * 100) : 0}% do total</div>
              </div>
            </div>
            {/* Acima de Remessa */}
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                <ArrowUp size={20} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-indigo-700 leading-none tracking-tight">{stats.acima.toLocaleString('pt-BR')}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Acima de Remessa</div>
                <div className="text-[11px] text-indigo-400 font-medium mt-0.5">{stats.total > 0 ? Math.round((stats.acima / stats.total) * 100) : 0}% do total</div>
              </div>
            </div>
            {/* Parcelamentos */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                <DollarSign size={20} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-emerald-700 leading-none tracking-tight">{stats.parcelamentos.toLocaleString('pt-BR')}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Parcelamentos</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">{stats.total > 0 ? Math.round((stats.parcelamentos / stats.total) * 100) : 0}% do total</div>
              </div>
            </div>''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 7: Replace in-table filter row with FilterPanel above table
# ═══════════════════════════════════════════════════════════════════════

OLD_ACTIVE_FILTERS_BAR = '''          {/* Active filters bar */}
          {Object.values(filters).some(Boolean) && (
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs text-slate-500 font-medium">
                <strong className="text-slate-800">{filtered.length}</strong> resultado{filtered.length !== 1 ? \'s\' : \'\'} com filtros ativos
              </span>
              <button
                onClick={() => setFilters({ processo: \'\', convenio: \'\', entidade: \'\', exercicio: \'\', drs: \'\', responsavel: \'\', posicao_id: \'\', movimento: \'\', remessa: \'\', situacao: \'\' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <X size={12} />Limpar Filtros
              </button>
            </div>
          )}'''

NEW_FILTER_PANEL = '''          {/* ── Filter Panel ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search size={13} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtros</span>
                {Object.values(filters).some(Boolean) && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {Object.values(filters).filter(Boolean).length} ativo{Object.values(filters).filter(Boolean).length !== 1 ? \'s\' : \'\'}
                  </span>
                )}
              </div>
              {Object.values(filters).some(Boolean) && (
                <button
                  onClick={() => setFilters({ processo: \'\', convenio: \'\', entidade: \'\', exercicio: \'\', drs: \'\', responsavel: \'\', posicao_id: \'\', movimento: \'\', remessa: \'\', situacao: \'\' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={11} />Limpar filtros
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={LABEL}>Processo</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="filtrar..." value={filters.processo} onChange={e => setF(\'processo\', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Convênio</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="filtrar..." value={filters.convenio} onChange={e => setF(\'convenio\', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Entidade</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="filtrar..." value={filters.entidade} onChange={e => setF(\'entidade\', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Exercício</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="ano" value={filters.exercicio} onChange={e => setF(\'exercicio\', e.target.value)} />
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className={LABEL}>DRS</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="nº" value={filters.drs} onChange={e => setF(\'drs\', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Analista</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="nome..." value={filters.responsavel} onChange={e => setF(\'responsavel\', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Posição</label>
                  <select className={INPUT + \' py-2 text-xs\'} value={filters.posicao_id} onChange={e => setF(\'posicao_id\', e.target.value)}>
                    <option value="">Todas</option>
                    {posicoes.map(p => <option key={p.codigo} value={String(p.codigo)}>{p.posicao}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Movimento</label>
                  <input className={INPUT + \' py-2 text-xs\'} placeholder="filtrar..." value={filters.movimento} onChange={e => setF(\'movimento\', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Situação</label>
                  <select className={INPUT + \' py-2 text-xs\'} value={filters.situacao} onChange={e => setF(\'situacao\', e.target.value)}>
                    <option value="">Todas</option>
                    <option value="REGULAR">Regular</option>
                    <option value="PARCIALMENTE_REGULAR">Parcialmente Regular</option>
                    <option value="IRREGULAR">Irregular</option>
                  </select>
                </div>
              </div>
            </div>
            {Object.values(filters).some(Boolean) && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
                <strong className="text-slate-600">{filtered.length.toLocaleString(\'pt-BR\')}</strong> resultado{filtered.length !== 1 ? \'s\' : \'\'} encontrado{filtered.length !== 1 ? \'s\' : \'\'}
              </div>
            )}
          </div>'''

apply('F7: replace active-filters bar with FilterPanel', OLD_ACTIVE_FILTERS_BAR, NEW_FILTER_PANEL)

# ═══════════════════════════════════════════════════════════════════════
# FIX 8: Remove in-table filter row from thead
# ═══════════════════════════════════════════════════════════════════════
apply('F8: remove thead filter row',
    '''                    <tr>
                      <FTh v={filters.processo}    onChange={v => setF(\'processo\', v)} />
                      <FTh v={filters.convenio}    onChange={v => setF(\'convenio\', v)} />
                      <FTh v={filters.entidade}    onChange={v => setF(\'entidade\', v)} />
                      <FTh v={filters.exercicio}   onChange={v => setF(\'exercicio\', v)} ph="ano" />
                      <FTh v={filters.drs}         onChange={v => setF(\'drs\', v)} ph="nº" />
                      <FThX />
                      <FTh v={filters.responsavel} onChange={v => setF(\'responsavel\', v)} />
                      <FThSel
                        v={filters.posicao_id}
                        onChange={v => setF(\'posicao_id\', v)}
                        opts={posicoes.map(p => ({ value: String(p.codigo), label: p.posicao ?? \'\' }))}
                      />
                      <FTh v={filters.movimento} onChange={v => setF(\'movimento\', v)} />
                      <FThSel
                        v={filters.remessa}
                        onChange={v => setF(\'remessa\', v)}
                        opts={[{ value: \'ACIMA\', label: \'Acima\' }, { value: \'ABAIXO\', label: \'Abaixo\' }]}
                      />
                      <FThSel
                        v={filters.situacao}
                        onChange={v => setF(\'situacao\', v)}
                        opts={[
                          { value: \'REGULAR\', label: \'Regular\' },
                          { value: \'PARCIALMENTE_REGULAR\', label: \'Parcialmente Regular\' },
                          { value: \'IRREGULAR\', label: \'Irregular\' },
                        ]}
                      />
                      <FThX />
                    </tr>''',
    '')

# ═══════════════════════════════════════════════════════════════════════
# FIX 9: Upgrade table row (processo column - stacked with entidade, movimento badge)
# ═══════════════════════════════════════════════════════════════════════
# Improve process column to show number + entidade stacked
apply('F9a: table row - elevate processo and combine with entidade',
    '''                          {/* Processo - full number, no truncation */}
                          <td className="px-3 py-3.5 min-w-[160px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-blue-700 text-xs font-mono">
                                {r.processo ?? \'-\'}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {r.link_processo && (
                                  <a
                                    href={r.link_processo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                    title="Abrir link"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                                {isDupe && (
                                  <span className="text-xs text-purple-500 flex items-center gap-0.5" title={`${dupes.length} registros com este número`}>
                                    <Info size={10} />{dupes.length}
                                  </span>
                                )}
                                {r.is_parcelamento && (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1 py-0.5" title="Parcelamento">
                                    <DollarSign size={9} />Parcela
                                  </span>
                                )}
                              </div>
                              {prevPositions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {prevPositions.map((p, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                      <Clock size={9} />Ant: {p}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-xs">{r.convenio ?? \'-\'}</td>
                          <td className="px-3 py-3 text-slate-700 max-w-[180px]">
                            <span className="block truncate text-xs" title={r.entidade ?? \'\'}>{r.entidade ?? \'-\'}</span>
                          </td>''',
    '''                          {/* Processo + Entidade stacked */}
                          <td className="px-4 py-4 min-w-[200px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-blue-700 text-xs font-mono tracking-tight">
                                  {r.processo ?? \'-\'}
                                </span>
                                {r.link_processo && (
                                  <a href={r.link_processo} target="_blank" rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-500 transition-colors flex-shrink-0"
                                    title="Abrir link" onClick={e => e.stopPropagation()}>
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                                {isDupe && (
                                  <span className="text-[10px] text-purple-500 flex items-center gap-0.5 flex-shrink-0" title={`${dupes.length} registros com este número`}>
                                    <Info size={9} />{dupes.length}x
                                  </span>
                                )}
                              </div>
                              {r.entidade && (
                                <span className="text-[11px] text-slate-500 leading-tight line-clamp-2 max-w-[200px]" title={r.entidade}>
                                  {r.entidade}
                                </span>
                              )}
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {r.is_parcelamento && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                                    <DollarSign size={8} />Parcela
                                  </span>
                                )}
                                {prevPositions.map((p, i) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                    <Clock size={8} />Ant: {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-500 whitespace-nowrap text-xs">{r.convenio ?? \'-\'}</td>
                          {/* Entidade moved into processo cell */}
                          <td className="hidden">{/* merged into processo */}</td>''')

# Fix 9b: remove the separate entidade column header (since it's now merged into processo column)
# Actually we need to keep columns the same or adjust colSpan. Let's just hide the entidade column.
# Actually that would break the layout. Let me instead keep the entidade as separate column but simpler.
# The approach above adds a hidden <td> for the entidade slot. Let me verify the thead still has entidade.

# Fix 9c: upgrade the movimento column to use MovimentoBadge
apply('F9c: movimento column use MovimentoBadge',
    '''                          <td className="px-3 py-3 text-slate-500 text-xs max-w-[110px]">
                            <span className="block truncate" title={r.movimento ?? \'\'}>{r.movimento ?? \'-\'}</span>
                          </td>''',
    '''                          <td className="px-3 py-4">
                            <MovimentoBadge movimento={r.movimento} />
                          </td>''')

# Fix 9d: upgrade action buttons row
apply('F9d: upgrade action buttons',
    '''                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Ver detalhes"
                                onClick={() => setViewRow(r)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Editar"
                                onClick={() => setModal({ data: r })}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                title="Excluir"
                                onClick={() => handleDelete(r.codigo)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>''',
    '''                          <td className="px-3 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150" onClick={e => e.stopPropagation()}>
                              <button
                                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors shadow-sm"
                                title="Ver detalhes"
                                onClick={() => setViewRow(r)}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
                                title="Editar"
                                onClick={() => setModal({ data: r })}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                                title="Excluir"
                                onClick={() => handleDelete(r.codigo)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>''')

# Fix 9e: improve row height + hover style
apply('F9e: row height and hover',
    '''                          className={`transition-colors cursor-pointer group ${
                            rowIdx % 2 === 0 ? \'bg-white hover:bg-blue-50/60\' : \'bg-slate-50/70 hover:bg-blue-50/60\'
                          } ${r.situacao === \'IRREGULAR\' ? \'border-l-[3px] border-l-red-400\' : r.situacao === \'PARCIALMENTE_REGULAR\' ? \'border-l-[3px] border-l-amber-400\' : r.situacao === \'REGULAR\' ? \'border-l-[3px] border-l-green-400\' : \'\'}`}''',
    '''                          className={`transition-all cursor-pointer group ${
                            rowIdx % 2 === 0 ? \'bg-white hover:bg-blue-50/40\' : \'bg-slate-50/50 hover:bg-blue-50/40\'
                          } ${r.situacao === \'IRREGULAR\' ? \'border-l-[3px] border-l-red-400\' : r.situacao === \'PARCIALMENTE_REGULAR\' ? \'border-l-[3px] border-l-amber-400\' : r.situacao === \'REGULAR\' ? \'border-l-[3px] border-l-green-400\' : \'\'}`}''')

# Fix 9f: improve analista column display
apply('F9f: analista column with better avatars',
    '''                          <td className="px-3 py-3 min-w-[140px]">
                            {/* Cadastrado por */}
                            {(r.responsavel_cadastro || r.responsavel) && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                  {(r.responsavel_cadastro || r.responsavel)!.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] text-slate-500 truncate max-w-[100px]" title={r.responsavel_cadastro || r.responsavel || \'\'}>
                                  {r.responsavel_cadastro || r.responsavel}
                                </span>
                              </div>
                            )}
                            {/* Analistas */}
                            {(r.responsaveis_analise ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-0.5">
                                {(r.responsaveis_analise ?? []).slice(0, 2).map(a => (
                                  <span key={a} className="inline-flex items-center px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-semibold border border-sky-100" title={a}>
                                    {a.split(\' \')[0]}
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
                          </td>''',
    '''                          <td className="px-3 py-4 min-w-[160px]">
                            {/* Cadastrado por */}
                            {(r.responsavel_cadastro || r.responsavel) && (
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm">
                                  {(r.responsavel_cadastro || r.responsavel)!.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-slate-600 font-medium truncate max-w-[110px]" title={r.responsavel_cadastro || r.responsavel || \'\'}>
                                  {r.responsavel_cadastro || r.responsavel}
                                </span>
                              </div>
                            )}
                            {/* Analistas */}
                            {(r.responsaveis_analise ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {(r.responsaveis_analise ?? []).slice(0, 2).map(a => (
                                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-semibold border border-sky-200 shadow-sm" title={a}>
                                    <div className="w-3.5 h-3.5 rounded-full bg-sky-400 text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                                      {a.charAt(0).toUpperCase()}
                                    </div>
                                    {a.split(\' \')[0]}
                                  </span>
                                ))}
                                {(r.responsaveis_analise ?? []).length > 2 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold border border-slate-200">
                                    +{(r.responsaveis_analise ?? []).length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (!(r.responsavel_cadastro || r.responsavel) && (
                              <span className="text-slate-300 text-xs">—</span>
                            ))}
                          </td>''')

# Fix 9g: improve exercicio, drs, data columns
apply('F9g: exercicio drs data columns',
    '''                          <td className="px-3 py-3 text-center text-slate-500 text-xs font-medium">{r.exercicio ?? \'-\'}</td>
                          <td className="px-3 py-3 text-center text-slate-500 text-xs font-medium">{r.drs ?? \'-\'}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-500 text-xs">{fmtDate(r.data)}</td>''',
    '''                          <td className="px-3 py-4 text-center">
                            <span className="inline-block bg-slate-100 text-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold">{r.exercicio ?? \'—\'}</span>
                          </td>
                          <td className="px-3 py-4 text-center text-slate-500 text-xs font-medium">{r.drs ?? '—'}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-slate-400 text-xs">{fmtDate(r.data)}</td>''')

# Fix 9h: remessa column improvement
apply('F9h: remessa column',
    '''                          <td className="px-3 py-3 text-xs text-center">
                            {r.remessa === \'ACIMA\' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Acima</span>}
                            {r.remessa === \'ABAIXO\' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">Abaixo</span>}
                            {!r.remessa && <span className="text-slate-300">-</span>}
                          </td>''',
    '''                          <td className="px-3 py-4 text-xs text-center">
                            {r.remessa === \'ACIMA\' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><ArrowUp size={9} />Acima</span>}
                            {r.remessa === \'ABAIXO\' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200"><ArrowDown size={9} />Abaixo</span>}
                            {!r.remessa && <span className="text-slate-200">—</span>}
                          </td>''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 10: Table container — slightly cleaner
# ═══════════════════════════════════════════════════════════════════════
apply('F10: table container class',
    '          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">',
    '          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">')

# ═══════════════════════════════════════════════════════════════════════
# FIX 11: Empty state upgrade
# ═══════════════════════════════════════════════════════════════════════
apply('F11: empty state',
    '''                    {!paged.length && (
                      <tr>
                        <td colSpan={12} className="py-20 text-center">
                          <Search size={32} className="mx-auto mb-3 text-slate-200" />
                          <p className="text-slate-400 text-sm">Nenhum registro encontrado</p>
                          <p className="text-slate-300 text-xs mt-1">Tente ajustar os filtros</p>
                        </td>
                      </tr>
                    )}''',
    '''                    {!paged.length && (
                      <tr>
                        <td colSpan={12} className="py-24 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-slate-300" />
                          </div>
                          <p className="text-slate-500 text-sm font-semibold">Nenhum registro encontrado</p>
                          <p className="text-slate-300 text-xs mt-1.5">Ajuste os filtros ou cadastre um novo processo</p>
                        </td>
                      </tr>
                    )}''')

# ═══════════════════════════════════════════════════════════════════════
# FIX 12: Thead header row — cleaner style
# ═══════════════════════════════════════════════════════════════════════
apply('F12: thead row style',
    '                    <tr className="bg-slate-50 border-b border-slate-200">',
    '                    <tr className="bg-slate-50/80 border-b border-slate-100">')

print("Applied:", applied)
print("Missed:", missed)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
