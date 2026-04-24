#!/usr/bin/env python3
"""Patch: Update ViewModal indicators + ExercicioForm saldo + computeStats"""
import os

FILE = os.path.join(os.path.dirname(__file__), '..', 'pages', 'GpcProcessos_v2.tsx')

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── Patch 1: ViewModal indicators — show cadastro + analistas ──────────────
old_p1 = (
    '        {/* \u2500\u2500 Indicadores chave \u2500\u2500 */}\n'
    '        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">\n'
    '          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">\n'
    '            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">\n'
    '              <User size={17} className="text-slate-500" />\n'
    '            </div>\n'
    '            <div className="min-w-0">\n'
    '              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Respons\u00e1vel</div>\n'
    '              <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{row.responsavel || <span className="text-slate-300 font-normal">\u2014</span>}</div>\n'
    '            </div>\n'
    '          </div>'
)

new_p1 = (
    '        {/* \u2500\u2500 Indicadores chave \u2500\u2500 */}\n'
    '        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">\n'
    '          {/* Respons\u00e1vel pelo Cadastro */}\n'
    '          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">\n'
    '            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">\n'
    '              <User size={17} className="text-slate-500" />\n'
    '            </div>\n'
    '            <div className="min-w-0 flex-1">\n'
    '              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Respons\u00e1vel pelo Cadastro</div>\n'
    '              <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{row.responsavel_cadastro || row.responsavel || <span className="text-slate-300 font-normal">\u2014</span>}</div>\n'
    '            </div>\n'
    '          </div>'
)

if old_p1 in content:
    content = content.replace(old_p1, new_p1, 1)
    print('Patch 1 OK: ViewModal cadastro indicator')
else:
    print('WARN Patch 1: not found')

# ── Patch 2: Replace the "Movimento" indicator card with "Analistas" card ──
old_p2 = (
    '          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">\n'
    '            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">\n'
    '              <Activity size={17} className="text-purple-500" />\n'
    '            </div>\n'
    '            <div className="min-w-0">\n'
    '              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Movimento</div>\n'
    '              <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{row.movimento || <span className="text-slate-300 font-normal">\u2014</span>}</div>\n'
    '            </div>\n'
    '          </div>'
)
new_p2 = (
    '          {/* Analistas */}\n'
    '          <div className="flex items-start gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">\n'
    '            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">\n'
    '              <Search size={17} className="text-sky-500" />\n'
    '            </div>\n'
    '            <div className="min-w-0 flex-1">\n'
    '              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">T\u00e9cnicos Analistas</div>\n'
    '              {(row.responsaveis_analise ?? []).length > 0 ? (\n'
    '                <div className="flex flex-wrap gap-1">\n'
    '                  {(row.responsaveis_analise ?? []).map(a => (\n'
    '                    <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold border border-sky-200">{a}</span>\n'
    '                  ))}\n'
    '                </div>\n'
    '              ) : (\n'
    '                <span className="text-sm text-slate-300 font-normal italic">\u2014 n\u00e3o atribu\u00eddo</span>\n'
    '              )}\n'
    '              {row.movimento && <div className="text-[10px] text-slate-500 mt-1.5 truncate font-medium">{row.movimento}</div>}\n'
    '            </div>\n'
    '          </div>'
)
if old_p2 in content:
    content = content.replace(old_p2, new_p2, 1)
    print('Patch 2 OK: ViewModal analistas indicator')
else:
    print('WARN Patch 2: not found')

# ── Patch 3: ExercicioForm — add saldo calculation ──────────────────────────
old_p3 = (
    '        <div className="grid grid-cols-2 gap-3">\n'
    '        <div><label className={LABEL}>Exerc\u00edcio *</label>'
    '<input className={INPUT} value={f.exercicio ?? \'\'} onChange={e => set(\'exercicio\', e.target.value)} required /></div>\n'
    '        <div><label className={LABEL}>Exerc. Anterior (R$)</label><CurrencyInput value={f.exercicio_anterior} onChange={v => set(\'exercicio_anterior\', v)} /></div>\n'
    '        <div><label className={LABEL}>Repasse (R$)</label><CurrencyInput value={f.repasse} onChange={v => set(\'repasse\', v)} /></div>\n'
    '        <div><label className={LABEL}>Aplica\u00e7\u00e3o (R$)</label><CurrencyInput value={f.aplicacao} onChange={v => set(\'aplicacao\', v)} /></div>\n'
    '        <div><label className={LABEL}>Gastos (R$)</label><CurrencyInput value={f.gastos} onChange={v => set(\'gastos\', v)} /></div>\n'
    '        <div><label className={LABEL}>Devolvido (R$)</label><CurrencyInput value={f.devolvido} onChange={v => set(\'devolvido\', v)} /></div>\n'
    '      </div>'
)
new_p3 = (
    '        <div className="grid grid-cols-2 gap-3">\n'
    '        <div><label className={LABEL}>Exerc\u00edcio *</label>'
    '<input className={INPUT} value={f.exercicio ?? \'\'} onChange={e => set(\'exercicio\', e.target.value)} required /></div>\n'
    '        <div><label className={LABEL}>Exerc. Anterior (R$)</label><CurrencyInput value={f.exercicio_anterior} onChange={v => set(\'exercicio_anterior\', v)} /></div>\n'
    '        <div><label className={LABEL}>Repasse (R$)</label><CurrencyInput value={f.repasse} onChange={v => set(\'repasse\', v)} /></div>\n'
    '        <div><label className={LABEL}>Aplica\u00e7\u00e3o (R$)</label><CurrencyInput value={f.aplicacao} onChange={v => set(\'aplicacao\', v)} /></div>\n'
    '        <div><label className={LABEL}>Gastos (R$)</label><CurrencyInput value={f.gastos} onChange={v => set(\'gastos\', v)} /></div>\n'
    '        <div><label className={LABEL}>Devolvido (R$)</label><CurrencyInput value={f.devolvido} onChange={v => set(\'devolvido\', v)} /></div>\n'
    '      </div>\n'
    '      {/* Saldo disponível para próximo exercício */}\n'
    '      {(() => {\n'
    '        const repasse = f.repasse ?? 0;\n'
    '        const gastos  = f.gastos  ?? 0;\n'
    '        const devolvido = f.devolvido ?? 0;\n'
    '        const saldo = repasse - gastos - devolvido;\n'
    '        if (repasse === 0) return null;\n'
    '        return (\n'
    '          <div className={`rounded-xl border p-3.5 flex items-center gap-3 ${saldo > 0 ? \'bg-blue-50 border-blue-200\' : \'bg-slate-50 border-slate-200\'}`}>\n'
    '            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${saldo > 0 ? \'bg-blue-100\' : \'bg-slate-100\'}`}>\n'
    '              <DollarSign size={15} className={saldo > 0 ? \'text-blue-600\' : \'text-slate-400\'} />\n'
    '            </div>\n'
    '            <div className="flex-1">\n'
    '              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Valor n\u00e3o utilizado (saldo para pr\u00f3ximo exerc\u00edcio)</div>\n'
    '              <div className={`text-base font-bold ${saldo > 0 ? \'text-blue-700\' : \'text-slate-500\'}`}>\n'
    '                {saldo.toLocaleString(\'pt-BR\', { style: \'currency\', currency: \'BRL\' })}\n'
    '              </div>\n'
    '              <div className="text-xs text-slate-400 mt-0.5">Repasse {fmt(repasse)} \u2212 Gastos {fmt(gastos)} \u2212 Devolvido {fmt(devolvido)}</div>\n'
    '            </div>\n'
    '          </div>\n'
    '        );\n'
    '      })()}'
)
if old_p3 in content:
    content = content.replace(old_p3, new_p3, 1)
    print('Patch 3 OK: ExercicioForm saldo calculation')
else:
    print('WARN Patch 3: not found')

# ── Patch 4: computeStats — add cadastros counter ─────────────────────────
old_p4 = (
    'interface TechStats {\n'
    '  responsavel: string;\n'
    '  analises: number;       // unique registro_ids with INICIO_ANALISE\n'
    '  posicoes: number;       // POSICAO events\n'
    '  movimentos: number;     // MOVIMENTO events\n'
    '  total: number;\n'
    '}'
)
new_p4 = (
    'interface TechStats {\n'
    '  responsavel: string;\n'
    '  cadastros: number;      // CADASTRO events (not counted in total)\n'
    '  analises: number;       // unique registro_ids with INICIO_ANALISE\n'
    '  posicoes: number;       // POSICAO events\n'
    '  movimentos: number;     // MOVIMENTO events\n'
    '  total: number;          // analises + posicoes + movimentos (excludes cadastros)\n'
    '}'
)
if old_p4 in content:
    content = content.replace(old_p4, new_p4, 1)
    print('Patch 4 OK: TechStats cadastros field')
else:
    print('WARN Patch 4: not found')

old_p5 = (
    'function computeStats(events: ProdEvento[], gran: Granularity, period: string): TechStats[] {\n'
    '  const inPeriod = gran === \'geral\' ? events : events.filter(e => periodoKey(e.data_evento, gran) === period);\n'
    '  const map: Record<string, { analises: Set<number>; posicoes: number; movimentos: number }> = {};\n'
    '  for (const e of inPeriod) {\n'
    '    if (!map[e.responsavel]) map[e.responsavel] = { analises: new Set(), posicoes: 0, movimentos: 0 };\n'
    '    if (e.evento === \'INICIO_ANALISE\') map[e.responsavel].analises.add(e.registro_id);\n'
    '    if (e.evento === \'POSICAO\')        map[e.responsavel].posicoes++;\n'
    '    if (e.evento === \'MOVIMENTO\')      map[e.responsavel].movimentos++;\n'
    '  }\n'
    '  return Object.entries(map).map(([responsavel, s]) => ({\n'
    '    responsavel,\n'
    '    analises:   s.analises.size,\n'
    '    posicoes:   s.posicoes,\n'
    '    movimentos: s.movimentos,\n'
    '    total:      s.analises.size + s.posicoes + s.movimentos,\n'
    '  })).sort((a, b) => b.total - a.total);\n'
    '}'
)
new_p5 = (
    'function computeStats(events: ProdEvento[], gran: Granularity, period: string): TechStats[] {\n'
    '  const inPeriod = gran === \'geral\' ? events : events.filter(e => periodoKey(e.data_evento, gran) === period);\n'
    '  const map: Record<string, { cadastros: number; analises: Set<number>; posicoes: number; movimentos: number }> = {};\n'
    '  for (const e of inPeriod) {\n'
    '    if (!map[e.responsavel]) map[e.responsavel] = { cadastros: 0, analises: new Set(), posicoes: 0, movimentos: 0 };\n'
    '    if (e.evento === \'CADASTRO\')       map[e.responsavel].cadastros++;\n'
    '    if (e.evento === \'INICIO_ANALISE\') map[e.responsavel].analises.add(e.registro_id);\n'
    '    if (e.evento === \'POSICAO\')        map[e.responsavel].posicoes++;\n'
    '    if (e.evento === \'MOVIMENTO\')      map[e.responsavel].movimentos++;\n'
    '  }\n'
    '  return Object.entries(map).map(([responsavel, s]) => ({\n'
    '    responsavel,\n'
    '    cadastros:  s.cadastros,\n'
    '    analises:   s.analises.size,\n'
    '    posicoes:   s.posicoes,\n'
    '    movimentos: s.movimentos,\n'
    '    total:      s.analises.size + s.posicoes + s.movimentos, // cadastros NOT counted in total\n'
    '  })).sort((a, b) => b.total - a.total);\n'
    '}'
)
if old_p5 in content:
    content = content.replace(old_p5, new_p5, 1)
    print('Patch 5 OK: computeStats with cadastros')
else:
    print('WARN Patch 5: not found')

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print('All patches done.')
