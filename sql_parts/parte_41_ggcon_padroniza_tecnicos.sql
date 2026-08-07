-- =============================================================================
-- PARTE 41: Padroniza Técnico Responsável para o nome completo cadastrado no
-- sistema (importação original trazia só o primeiro nome da planilha; também
-- corrige acentuação corrompida em alguns registros, ex.: "Tânia").
-- Execute no SQL Editor do Supabase.
-- =============================================================================

UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Arlete Shirley Pereira de Carvalho' WHERE tecnico_responsavel = 'Arlete'; -- 80 linha(s), valor original: "Arlete"
-- (nenhum registro encontrado com técnico correspondente a "Elza Tatsuo Samecima")
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Fernanda da Silva e Souza' WHERE tecnico_responsavel = 'Fernanda'; -- 105 linha(s), valor original: "Fernanda"
-- (nenhum registro encontrado com técnico correspondente a "Karen de Oliveira Delfino")
-- (nenhum registro encontrado com técnico correspondente a "Luiz Andrade Junior")
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Marilsa Silva e Silva' WHERE tecnico_responsavel = 'Marilsa'; -- 221 linha(s), valor original: "Marilsa"
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Maristela Aparecida Raphael' WHERE tecnico_responsavel = 'Maristela'; -- 79 linha(s), valor original: "Maristela"
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Marta Conceição de Moura' WHERE tecnico_responsavel = 'Marta'; -- 53 linha(s), valor original: "Marta"
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Renato Tatit' WHERE tecnico_responsavel = 'Renato'; -- 64 linha(s), valor original: "Renato"
-- (nenhum registro encontrado com técnico correspondente a "Ronaldo Hilario dos Santos")
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Tânia Cristina Begosso' WHERE tecnico_responsavel = 'Tânia'; -- 44 linha(s), valor original: "Tânia"
UPDATE public.cgof_ggcon_processos SET tecnico_responsavel = 'Thiago Almeida da Silva' WHERE tecnico_responsavel = 'Thiago'; -- 51 linha(s), valor original: "Thiago"

-- Total de linhas afetadas: 697
