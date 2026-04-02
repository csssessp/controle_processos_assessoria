-- Dados: cgof_gpc_classificacao  (4 registos)
INSERT INTO public.cgof_gpc_classificacao (codigo, indice, descricao) VALUES (1, 0, 'Não Classificado') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_classificacao (codigo, indice, descricao) VALUES (2, 1, 'Sim') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_classificacao (codigo, indice, descricao) VALUES (3, 2, 'Não') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_classificacao (codigo, indice, descricao) VALUES (4, 3, 'Prejudicado') ON CONFLICT (codigo) DO NOTHING;
