#!/usr/bin/env python3
"""patch_v3.py — fix analysts display, auto-user in fluxo, UI polish"""
import os

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

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: RegistroModal - add useApp to get currentUser for form default
# ─────────────────────────────────────────────────────────────────────────────
apply('F1 RegistroModal useApp',
    'const RegistroModal: React.FC<RegistroModalProps> = ({ initial, posicoes, onSave, onClose, isAdmin, onRecordUpdated }) => {\n'
    '  const [liveRecord, setLiveRecord] = useState<GpcRecebido | undefined>(initial);\n'
    '  const [form, setForm] = useState<Partial<GpcRecebido>>(initial ?? {});',

    'const RegistroModal: React.FC<RegistroModalProps> = ({ initial, posicoes, onSave, onClose, isAdmin, onRecordUpdated }) => {\n'
    '  const { currentUser } = useApp();\n'
    '  const [liveRecord, setLiveRecord] = useState<GpcRecebido | undefined>(initial);\n'
    '  const [form, setForm] = useState<Partial<GpcRecebido>>(initial ?? {});')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: FluxoTecnicoFormInline — add currentUserName prop and auto-fill tecnico
# ─────────────────────────────────────────────────────────────────────────────
apply('F2a FluxoTecnicoFormInline signature',
    'const FluxoTecnicoFormInline = ({ registroId, posicoes, numPaginas, gpcUsers, onSaved }: {\n'
    '  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;\n'
    '  gpcUsers: { id: string; name: string }[];\n'
    '  onSaved: () => Promise<void> | void;\n'
    '}) => {\n'
    '  const [form, setForm] = useState<Partial<GpcFluxoTecnico>>({\n'
    '    registro_id: registroId,\n'
    '    num_paginas_analise: numPaginas ?? undefined,\n'
    '  });',

    'const FluxoTecnicoFormInline = ({ registroId, posicoes, numPaginas, gpcUsers, onSaved, currentUserName }: {\n'
    '  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;\n'
    '  gpcUsers: { id: string; name: string }[];\n'
    '  onSaved: () => Promise<void> | void;\n'
    '  currentUserName?: string;\n'
    '}) => {\n'
    '  const [form, setForm] = useState<Partial<GpcFluxoTecnico>>({\n'
    '    registro_id: registroId,\n'
    '    num_paginas_analise: numPaginas ?? undefined,\n'
    '    tecnico: currentUserName ?? undefined,\n'
    '  });')

# FIX 2b: Reset form also resets tecnico to currentUser
apply('F2b FluxoTecnicoFormInline reset',
    '      setForm({ registro_id: registroId, num_paginas_analise: numPaginas ?? undefined });',
    '      setForm({ registro_id: registroId, num_paginas_analise: numPaginas ?? undefined, tecnico: currentUserName ?? undefined });')

# FIX 2c: Replace the tecnico dropdown with a read-only display + hidden value
apply('F2c FluxoTecnicoFormInline remove tecnico dropdown',
    '      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">\n'
    '        <div>\n'
    '          <label className={LABEL}>Técnico Responsável</label>\n'
    '          <select className={INPUT} value={form.tecnico ?? \'\'} onChange={e => set(\'tecnico\', e.target.value || null)} required>\n'
    '            <option value="">— selecione —</option>\n'
    '            {gpcUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}\n'
    '          </select>\n'
    '        </div>',

    '      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">\n'
    '        <div>\n'
    '          <label className={LABEL + \' flex items-center gap-1\'}>\n'
    '            <User size={10} className="text-slate-400" />Registrado por\n'
    '          </label>\n'
    '          <div className={INPUT + \' bg-slate-50 text-slate-700 flex items-center gap-2 select-none\'}>{\n'
    '            currentUserName\n'
    '              ? <><div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{currentUserName.charAt(0).toUpperCase()}</div><span className="text-sm font-medium">{currentUserName}</span><span className="ml-auto text-[10px] text-slate-400 font-medium">Usuário logado</span></>\n'
    '              : <span className="text-slate-400 text-xs italic">Não identificado</span>\n'
    '          }</div>\n'
    '        </div>')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: FluxoTecnicoPanel — pass currentUserName to FluxoTecnicoFormInline
# ─────────────────────────────────────────────────────────────────────────────
apply('F3a FluxoTecnicoPanel signature',
    'const FluxoTecnicoPanel = ({ registroId, posicoes, numPaginas, gpcUsers, signatoryUsers, responsavelAssinatura, responsavelAssinatura2, onRecordUpdated, readOnly, hideAssinatura }: {\n'
    '  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;\n'
    '  gpcUsers: { id: string; name: string }[];\n'
    '  signatoryUsers: { id: string; name: string }[];\n'
    '  responsavelAssinatura?: string | null;\n'
    '  responsavelAssinatura2?: string | null;\n'
    '  onRecordUpdated?: () => Promise<void> | void;\n'
    '  readOnly?: boolean;\n'
    '  hideAssinatura?: boolean;\n'
    '}) => {',

    'const FluxoTecnicoPanel = ({ registroId, posicoes, numPaginas, gpcUsers, signatoryUsers, responsavelAssinatura, responsavelAssinatura2, onRecordUpdated, readOnly, hideAssinatura, currentUserName }: {\n'
    '  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;\n'
    '  gpcUsers: { id: string; name: string }[];\n'
    '  signatoryUsers: { id: string; name: string }[];\n'
    '  responsavelAssinatura?: string | null;\n'
    '  responsavelAssinatura2?: string | null;\n'
    '  onRecordUpdated?: () => Promise<void> | void;\n'
    '  readOnly?: boolean;\n'
    '  hideAssinatura?: boolean;\n'
    '  currentUserName?: string;\n'
    '}) => {')

# FIX 3b: Pass currentUserName to FluxoTecnicoFormInline inside FluxoTecnicoPanel
apply('F3b pass currentUserName to FormInline',
    '          <FluxoTecnicoFormInline\n'
    '            registroId={registroId}\n'
    '            posicoes={posicoes}\n'
    '            numPaginas={numPaginas}\n'
    '            gpcUsers={gpcUsers}\n'
    '            onSaved={load}',
    '          <FluxoTecnicoFormInline\n'
    '            registroId={registroId}\n'
    '            posicoes={posicoes}\n'
    '            numPaginas={numPaginas}\n'
    '            gpcUsers={gpcUsers}\n'
    '            currentUserName={currentUserName}\n'
    '            onSaved={load}')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 4: ViewModal — pass currentUserName to FluxoTecnicoPanel
# ─────────────────────────────────────────────────────────────────────────────
apply('F4 ViewModal pass currentUserName',
    '          <FluxoTecnicoPanel\n'
    '            registroId={row.codigo}\n'
    '            posicoes={posicoes}\n'
    '            numPaginas={row.num_paginas}\n'
    '            gpcUsers={gpcUsers}\n'
    '            signatoryUsers={signatoryUsers}\n'
    '            responsavelAssinatura={row.responsavel_assinatura}\n'
    '            responsavelAssinatura2={row.responsavel_assinatura_2}\n'
    '            onRecordUpdated={onRecordUpdated}\n'
    '            readOnly={false}\n'
    '            hideAssinatura={true}',
    '          <FluxoTecnicoPanel\n'
    '            registroId={row.codigo}\n'
    '            posicoes={posicoes}\n'
    '            numPaginas={row.num_paginas}\n'
    '            gpcUsers={gpcUsers}\n'
    '            signatoryUsers={signatoryUsers}\n'
    '            responsavelAssinatura={row.responsavel_assinatura}\n'
    '            responsavelAssinatura2={row.responsavel_assinatura_2}\n'
    '            onRecordUpdated={onRecordUpdated}\n'
    '            readOnly={false}\n'
    '            hideAssinatura={true}\n'
    '            currentUserName={gpcUsers.find(u => u.id === undefined)?.name}')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 5: ViewModal - add currentUser from useApp so we can pass real name
# ─────────────────────────────────────────────────────────────────────────────
apply('F5 ViewModal useApp for currentUser',
    'const ViewModal = ({ row, posicoes, onEdit, onClose, prevPositions, onRecordUpdated }: {\n'
    '  row: GpcRecebido;\n'
    '  posicoes: GpcPosicao[];\n'
    '  onEdit: () => void;\n'
    '  onClose: () => void;\n'
    '  prevPositions: string[];\n'
    '  onRecordUpdated?: () => Promise<void> | void;\n'
    '}) => {\n'
    '  const [full, setFull] = useState<GpcProcessoFull | null>(null);\n'
    '  const [loadingFull, setLoadingFull] = useState(false);\n'
    '  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);\n'
    '  const [signatoryUsers, setSignatoryUsers] = useState<{ id: string; name: string }[]>([]);',

    'const ViewModal = ({ row, posicoes, onEdit, onClose, prevPositions, onRecordUpdated }: {\n'
    '  row: GpcRecebido;\n'
    '  posicoes: GpcPosicao[];\n'
    '  onEdit: () => void;\n'
    '  onClose: () => void;\n'
    '  prevPositions: string[];\n'
    '  onRecordUpdated?: () => Promise<void> | void;\n'
    '}) => {\n'
    '  const { currentUser } = useApp();\n'
    '  const [full, setFull] = useState<GpcProcessoFull | null>(null);\n'
    '  const [loadingFull, setLoadingFull] = useState(false);\n'
    '  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);\n'
    '  const [signatoryUsers, setSignatoryUsers] = useState<{ id: string; name: string }[]>([]);')

# Now fix the pass of currentUserName to use real currentUser.name
apply('F5b fix currentUserName in ViewModal FluxoPanel',
    '            currentUserName={gpcUsers.find(u => u.id === undefined)?.name}',
    '            currentUserName={currentUser?.name ?? undefined}')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 6: RegistroModal - make responsaveis_analise show when editing
#  The form state initializes from `initial` — the DB row.
#  But after saveRecebido, the returned object must also contain responsaveis_analise.
#  The issue is that the form DOES have the data, but the MultiSelectChips might
#  be reading the right field. Let's verify by checking what field is used.
# Actually the problem is in the form display — it reads form.responsaveis_analise
# which is properly set from `initial`. The issue might be that `initial` from
# the main list doesn't include the new columns. Check what fields `rows` has.
# The fix is in gpcService getRecebidos — it must SELECT responsaveis_analise.
# ─────────────────────────────────────────────────────────────────────────────

print("Patches applied:", applied)
print("Missed:", missed)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
