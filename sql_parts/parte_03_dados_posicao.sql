-- Dados: cgof_gpc_posicao  (12 registos)
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (1, 'Em Análise') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (2, 'Devolvido a DRS') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (3, 'Para Ratificação') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (4, 'Enviado ao CATC') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (5, 'Aguardando Análise') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (6, 'Exercício Analisado') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (7, 'Exercício Concluído') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (8, 'Encaminhado ao TCE-SP') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (9, 'Devolvido a CSS') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (10, 'Encaminhado a SES-CGOF-AssisTec') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (11, 'Encaminhado a SES-CGOF-GGCON') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO public.cgof_gpc_posicao (codigo, posicao) VALUES (12, 'Devolvido ao GPC') ON CONFLICT (codigo) DO NOTHING;
