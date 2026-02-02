
/*
================================================================================
INSTRUÇÕES PARA O SQL EDITOR DO SUPABASE:
Execute o código abaixo no seu painel Supabase para criar as funções de busca:

-- 1. Função para Setores Únicos (Localização)
CREATE OR REPLACE FUNCTION public.distinct_setor()
RETURNS TABLE(value text) AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT sector::text AS value
  FROM processes
  WHERE sector IS NOT NULL AND sector <> ''
  ORDER BY value;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Função para Interessadas Únicas
CREATE OR REPLACE FUNCTION public.distinct_interessada()
RETURNS TABLE(value text) AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT interested::text AS value
  FROM processes
  WHERE interested IS NOT NULL AND interested <> ''
  ORDER BY value;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Função para Assuntos Únicos
CREATE OR REPLACE FUNCTION public.distinct_assunto()
RETURNS TABLE(value text) AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT subject::text AS value
  FROM processes
  WHERE subject IS NOT NULL AND subject <> ''
  ORDER BY value;
END;
$$ LANGUAGE plpgsql STABLE;

-- Permissões de Acesso
GRANT EXECUTE ON FUNCTION public.distinct_setor() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.distinct_interessada() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.distinct_assunto() TO anon, authenticated, service_role;
================================================================================
*/

import { supabase } from './supabaseClient';
import { User, Process, Log, UserRole, ProcessQueryParams, CGOF_OPTIONS } from '../types';
import { getInitialAssessoriaData } from './assessoriaData';

// Função para normalizar valores de CGOF e evitar erros de Enum no Supabase
const normalizeCGOF = (value: string): string => {
  const lower = String(value || '').toLowerCase().trim();
  if (lower.includes('recebimento')) return 'Recebimento';
  if (lower.includes('gabinete')) return 'Gabinete do Coordenador';
  return 'Assessoria';
};

// Função auxiliar para garantir que datas vazias sejam enviadas como NULL
const cleanDate = (date: string | null | undefined): string | null => {
  if (!date || date.trim() === '') return null;
  return date;
};

// Função para mapear process_link (snake_case) para processLink (camelCase)
const mapProcessFromDB = (dbProcess: any): Process => {
  const mapped: Process = {
    ...dbProcess,
    processLink: dbProcess.process_link || undefined,
    isPrestacaoConta: dbProcess.is_prestacao_conta === true || false
  };
  if (mapped.isPrestacaoConta) {
    console.log('✅ Process mapeado com isPrestacaoConta=true:', dbProcess.number);
  }
  return mapped;
};

export const DbService = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) {
      console.error('Error fetching users:', error.message);
      return [];
    }
    return data as User[];
  },

  saveUser: async (user: User, performedBy: User): Promise<void> => {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (existingEmail && existingEmail.id !== user.id) {
      throw new Error('Este email já está cadastrado no sistema.');
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    const isNewUser = !existingUser;

    const payload: any = {
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active
    };

    if (user.password && user.password.trim().length > 0) {
      payload.password = user.password; 
    } else if (isNewUser) {
      throw new Error("Uma senha é obrigatória para novos usuários.");
    }

    if (isNewUser) {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (count === 0) {
            payload.role = UserRole.ADMIN;
        }
        if (user.id) payload.id = user.id;
    }

    let error;
    if (isNewUser) {
       const { error: insertError } = await supabase.from('users').insert(payload);
       error = insertError;
    } else {
       const { error: updateError } = await supabase.from('users').update(payload).eq('id', user.id);
       error = updateError;
    }

    if (error) {
        throw new Error(error.message || "Erro ao salvar usuário no banco de dados.");
    }

    await DbService.logAction('USER_MGMT', `Usuário ${isNewUser ? 'criado' : 'atualizado'}: ${user.name}`, performedBy, user.id);
  },

  updateOwnPassword: async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    const isValid = await DbService.verifyPassword(userId, currentPass);
    if (!isValid) {
      throw new Error("Senha atual incorreta.");
    }

    const { error } = await supabase
      .from('users')
      .update({ password: newPass })
      .eq('id', userId);

    if (error) throw error;

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (user) {
      await DbService.logAction('UPDATE', `Senha alterada pelo próprio usuário`, user as User, userId);
    }
  },

  deleteUser: async (userId: string, performedBy: User): Promise<void> => {
    if (userId === performedBy.id) {
        throw new Error("Você não pode excluir seu próprio usuário.");
    }
    
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    
    await DbService.logAction('USER_MGMT', `Usuário excluído (ID: ${userId})`, performedBy, userId);
  },

  verifyPassword: async (userId: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data || !data.active) return false;

    // @ts-ignore
    const stored = data.password || data.password_hash;
    return stored === password;
  },

  // --- LOGIN ---
  login: async (email: string, pass: string): Promise<User | null> => {
    const { data: userRaw, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
        console.error("[LOGIN] Erro ao buscar usuário no Supabase:", error.message || error);
        return null;
    }

    if (!userRaw) {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (count === 0) {
            const adminId = crypto.randomUUID();
            await supabase.from('users').insert({
                id: adminId,
                name: 'Administrador',
                email: 'admin@sistema.com',
                password: '123456', 
                role: UserRole.ADMIN,
                active: true
            });
            return DbService.login('admin@sistema.com', '123456');
        }
        return null;
    }

    if (!userRaw.active) return null;

    // @ts-ignore
    const storedPassword = userRaw.password || userRaw.password_hash;

    if (storedPassword === pass) {
        const authenticatedUser = { ...userRaw, role: userRaw.role as UserRole };
        await DbService.logAction('LOGIN', `Login realizado`, authenticatedUser);
        localStorage.setItem('procontrol_session_id', userRaw.id);
        await DbService.checkAndSeedData(authenticatedUser);
        return authenticatedUser;
    }
    return null;
  },

  logout: async (user: User) => {
     await DbService.logAction('LOGOUT', `Logout realizado`, user);
     localStorage.removeItem('procontrol_session_id');
  },

  getCurrentUser: async (): Promise<User | null> => {
    const id = localStorage.getItem('procontrol_session_id');
    if (!id) return null;
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return data as User | null;
  },

  // --- PROCESSES ---
  getProcesses: async (params?: ProcessQueryParams): Promise<{ data: Process[], count: number }> => {
    try {
      // Estratégia: buscar urgentes SEM limite, depois completar com não-urgentes paginados
      const itemsPerPage = params?.itemsPerPage || 20;
      const page = params?.page || 1;
      const offset = (page - 1) * itemsPerPage;

      // 1. Buscar TODOS os processos urgentes (sem paginação)
      let urgentQuery = supabase.from('processes').select('*', { count: 'exact' });
      if (params) {
        if (params.searchTerm) {
          const term = `%${params.searchTerm}%`;
          urgentQuery = urgentQuery.or(`number.ilike.${term},interested.ilike.${term},subject.ilike.${term}`);
        }
        if (params.filters?.CGOF) urgentQuery = urgentQuery.eq('CGOF', params.filters.CGOF);
        if (params.filters?.sector) urgentQuery = urgentQuery.ilike('sector', `%${params.filters.sector}%`);
        if (params.filters?.entryDateStart) urgentQuery = urgentQuery.gte('entryDate', params.filters.entryDateStart);
        if (params.filters?.entryDateEnd) urgentQuery = urgentQuery.lte('entryDate', params.filters.entryDateEnd);
        if (params.filters?.emptyExitDate) urgentQuery = urgentQuery.is('processDate', null);
        if (params.filters?.emptySector) urgentQuery = urgentQuery.or('sector.is.null,sector.eq.""');
      }
      
      // Sempre busca urgentes primeiro
      urgentQuery = urgentQuery.eq('urgent', true);
      urgentQuery = urgentQuery.order('entryDate', { ascending: false });

      const { data: urgentData, error: urgentError, count: urgentCount } = await urgentQuery;
      if (urgentError) {
        console.error('Erro ao buscar processos urgentes:', urgentError.message);
        return { data: [], count: 0 };
      }

      const urgentProcesses = (urgentData || []).map(mapProcessFromDB);

      // 2. Se há espaço na página, buscar não-urgentes
      let nonUrgentProcesses: Process[] = [];
      let totalCount = urgentProcesses.length;

      if (urgentProcesses.length < (offset + itemsPerPage)) {
        // Calcular quantos não-urgentes precisamos
        const neededNonUrgent = offset + itemsPerPage - urgentProcesses.length;
        const nonUrgentOffset = Math.max(0, offset - urgentProcesses.length);

        let nonUrgentQuery = supabase.from('processes').select('*', { count: 'exact' });
        if (params) {
          if (params.searchTerm) {
            const term = `%${params.searchTerm}%`;
            nonUrgentQuery = nonUrgentQuery.or(`number.ilike.${term},interested.ilike.${term},subject.ilike.${term}`);
          }
          if (params.filters?.CGOF) nonUrgentQuery = nonUrgentQuery.eq('CGOF', params.filters.CGOF);
          if (params.filters?.sector) nonUrgentQuery = nonUrgentQuery.ilike('sector', `%${params.filters.sector}%`);
          if (params.filters?.entryDateStart) nonUrgentQuery = nonUrgentQuery.gte('entryDate', params.filters.entryDateStart);
          if (params.filters?.entryDateEnd) nonUrgentQuery = nonUrgentQuery.lte('entryDate', params.filters.entryDateEnd);
          if (params.filters?.emptyExitDate) nonUrgentQuery = nonUrgentQuery.is('processDate', null);
          if (params.filters?.emptySector) nonUrgentQuery = nonUrgentQuery.or('sector.is.null,sector.eq.""');
        }
        
        // Buscar não-urgentes
        nonUrgentQuery = nonUrgentQuery.eq('urgent', false);
        nonUrgentQuery = nonUrgentQuery.order('entryDate', { ascending: false });
        
        // Aplicar paginação
        nonUrgentQuery = nonUrgentQuery.range(nonUrgentOffset, nonUrgentOffset + neededNonUrgent - 1);
        
        const { data: allNonUrgent, error: nonUrgentError, count } = await nonUrgentQuery;
        
        if (!nonUrgentError && allNonUrgent) {
          nonUrgentProcesses = allNonUrgent.map(mapProcessFromDB);
          totalCount = urgentProcesses.length + (count || 0);
        }
      } else {
        // Contar total de não-urgentes para estatística
        const { count } = await supabase
          .from('processes')
          .select('*', { count: 'exact', head: true })
          .eq('urgent', false);
        totalCount = urgentProcesses.length + (count || 0);
      }

      // 3. Combinar: urgentes + não-urgentes
      const pageData = [
        ...urgentProcesses.slice(offset, offset + itemsPerPage),
        ...nonUrgentProcesses
      ].slice(0, itemsPerPage);

      return { data: pageData, count: totalCount };
    } catch (err) {
      console.error('Error fetching processes:', err);
      return { data: [], count: 0 };
    }
  },

  getAllProcesses: async (): Promise<Process[]> => {
    try {
      let allData: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      let batchCount = 0;

      // Buscar em lotes de 1000 registros até trazer tudo
      while (hasMore) {
        batchCount++;
        const { data, error } = await supabase
          .from('processes')
          .select('*')
          .order('entryDate', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error(`[getAllProcesses] Erro na batch ${batchCount}:`, error);
          break;
        }

        if (data && data.length > 0) {
          console.log(`[getAllProcesses] Batch ${batchCount}: Retornou ${data.length} registros`);
          allData = allData.concat(data);
          offset += pageSize;
          
          // Se retornou menos que pageSize, significa que chegou ao fim
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`[getAllProcesses] Completado. Total: ${allData.length} registros`);
      return allData.map(mapProcessFromDB) as Process[];
    } catch (err) {
      console.error('Erro ao buscar todos os processos:', err);
      return [];
    }
  },

  saveProcess: async (process: Process, performedBy: User): Promise<void> => {
    const { processLink, isPrestacaoConta, ...processData } = process;
    const payload = {
      ...processData,
      CGOF: normalizeCGOF(process.CGOF),
      processDate: cleanDate(process.processDate),
      deadline: cleanDate(process.deadline),
      process_link: processLink || null,
      is_prestacao_conta: isPrestacaoConta || false
    };
    console.log('Saving process with is_prestacao_conta:', payload.is_prestacao_conta);
    const { error } = await supabase.from('processes').upsert(payload);
    if (error) {
      // Se o erro for sobre coluna não encontrada, tente sem o campo is_prestacao_conta
      if (error.message?.includes('isPrestacaoConta') || error.message?.includes('is_prestacao_conta')) {
        const payloadWithoutField = { ...payload };
        delete payloadWithoutField.is_prestacao_conta;
        const { error: retryError } = await supabase.from('processes').upsert(payloadWithoutField);
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }
    await DbService.logAction(process.id ? 'UPDATE' : 'CREATE', `Processo salvo: ${process.number}`, performedBy, process.id);
  },

  updateProcesses: async (ids: string[], updates: Partial<Process>, performedBy: User): Promise<void> => {
    const cleanedUpdates = { ...updates };
    if ('processDate' in cleanedUpdates) cleanedUpdates.processDate = cleanDate(cleanedUpdates.processDate);
    if ('deadline' in cleanedUpdates) cleanedUpdates.deadline = cleanDate(cleanedUpdates.deadline);

    const { error } = await supabase.from('processes').update(cleanedUpdates).in('id', ids);
    if (error) throw error;
    await DbService.logAction('UPDATE', `Atualização em massa: ${ids.length} processos`, performedBy);
  },

  importProcesses: async (processes: Process[], performedBy: User): Promise<void> => {
    const normalized = processes.map(p => {
      const { processLink, isPrestacaoConta, ...processData } = p;
      return {
        ...processData,
        CGOF: normalizeCGOF(p.CGOF),
        processDate: cleanDate(p.processDate),
        deadline: cleanDate(p.deadline),
        process_link: processLink || null,
        is_prestacao_conta: isPrestacaoConta || false
      };
    });
    
    const BATCH_SIZE = 100;
    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
        const chunk = normalized.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('processes').insert(chunk);
        if (error) throw error;
    }
    
    await DbService.logAction('CREATE', `Importação em massa: ${processes.length} processos`, performedBy);
  },

  deleteProcess: async (id: string, performedBy: User): Promise<void> => {
    const { error } = await supabase.from('processes').delete().eq('id', id);
    if (error) throw error;
    await DbService.logAction('DELETE', `Processo excluído (ID: ${id})`, performedBy, id);
  },

  deleteProcesses: async (ids: string[], performedBy: User): Promise<void> => {
    const { error } = await supabase.from('processes').delete().in('id', ids);
    if (error) throw error;
    await DbService.logAction('DELETE', `${ids.length} processos excluídos`, performedBy);
  },

  deleteLastMovement: async (number: string, performedBy: User): Promise<void> => {
    const { data, error: fetchError } = await supabase
      .from('processes')
      .select('id')
      .eq('number', number)
      .order('entryDate', { ascending: false })
      .order('updatedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!data) return;

    const { error: deleteError } = await supabase.from('processes').delete().eq('id', data.id);
    if (deleteError) throw deleteError;

    await DbService.logAction('DELETE', `Última movimentação excluída para o processo: ${number}`, performedBy, data.id);
  },

  getProcessHistory: async (number: string): Promise<Process[]> => {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .eq('number', number)
      .order('entryDate', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProcessFromDB) as Process[];
  },

  getAllProcessesForDashboard: async (): Promise<{ data: Process[], count: number }> => {
    // Busca um volume expressivo de dados para garantir que os cálculos do dashboard sejam precisos
    const { data, count, error } = await supabase
      .from('processes')
      .select('*', { count: 'exact' })
      .limit(30000); // Limite aumentado para cobrir bases grandes
      
    if (error) {
      console.error('Erro ao buscar dados para dashboard:', error.message);
      return { data: [], count: 0 };
    }
    const mappedData = (data || []).map(mapProcessFromDB);
    return { data: mappedData as Process[], count: count || 0 };
  },

  getUniqueValues: async (column: 'sector' | 'interested' | 'subject'): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select(column)
        .not(column, 'is', null);
      
      if (error) {
        console.error(`Error fetching unique ${column}:`, error.message);
        return [];
      }

      // Remover duplicatas e valores vazios, ordenar alfabeticamente
      const unique = Array.from(new Set(
        (data as any[])
          .map(item => item[column])
          .filter((val: string) => val && val.trim() !== '')
          .map((val: string) => val.trim())
      )).sort();

      return unique as string[];
    } catch (err) {
      console.error(`Error fetching unique ${column}:`, err);
      return [];
    }
  },

  getProcessesPrestacaoConta: async (): Promise<Process[]> => {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .eq('is_prestacao_conta', true)
      .order('number', { ascending: true });
    
    if (error) {
      console.error('Error fetching prestação de contas processes:', error.message);
      return [];
    }
    
    console.log('Processos de prestação encontrados:', data?.length || 0);
    return (data || []).map(mapProcessFromDB) as Process[];
  },

  // --- LOGS ---
  getLogs: async (): Promise<Log[]> => {
    const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(500);
    if (error) {
      console.error('Error fetching logs:', error.message);
      return [];
    }
    return data as Log[];
  },

  logAction: async (action: Log['action'], description: string, user: User, targetId?: string) => {
    await supabase.from('logs').insert({
      id: crypto.randomUUID(),
      action,
      description,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      targetId
    });
  },

  checkAndSeedData: async (user: User) => {
    const { count } = await supabase.from('processes').select('*', { count: 'exact', head: true }).limit(1);
    if (count === 0) {
      const initialDataRaw = getInitialAssessoriaData();
      const initialData = initialDataRaw.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      await DbService.importProcesses(initialData as Process[], user);
    }
  },

  // --- PRESTAÇÕES DE CONTAS ---
  getPrestacoes: async (params: any): Promise<{ data: any[], count: number }> => {
    try {
      let query = supabase.from('prestacoes_contas').select('*', { count: 'exact' });

      // Filtro por número do processo
      if (params.filters?.processNumber) {
        query = query.ilike('process_number', `%${params.filters.processNumber}%`);
      }

      // Filtro por status
      if (params.filters?.status) {
        query = query.eq('status', params.filters.status);
      }

      // Filtro por período
      if (params.filters?.monthStart) {
        query = query.gte('month', params.filters.monthStart);
      }
      if (params.filters?.monthEnd) {
        query = query.lte('month', params.filters.monthEnd);
      }

      // Busca por texto
      if (params.searchTerm) {
        query = query.or(`process_number.ilike.%${params.searchTerm}%,motivo.ilike.%${params.searchTerm}%`);
      }

      // Ordenação - Mapear camelCase para snake_case
      if (params.sortBy?.field) {
        const order = params.sortBy.order === 'asc' ? { ascending: true } : { ascending: false };
        let orderField = params.sortBy.field;
        
        // Mapear campos camelCase para snake_case
        if (orderField === 'processNumber') orderField = 'process_number';
        else if (orderField === 'updatedAt') orderField = 'updated_at';
        else if (orderField === 'createdAt') orderField = 'created_at';
        
        query = query.order(orderField, order);
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // Paginação
      const offset = ((params.page || 1) - 1) * (params.itemsPerPage || 20);
      query = query.range(offset, offset + (params.itemsPerPage || 20) - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Erro ao buscar prestações:', error);
        throw error;
      }

      return { 
        data: (data || []).map((item: any) => ({
          ...item,
          processId: item.process_id,
          processNumber: item.process_number,
          interested: item.interested,
          month: item.month,
          status: item.status,
          motivo: item.motivo,
          observations: item.observations,
          entryDate: item.entry_date,
          exitDate: item.exit_date,
          link: item.link,
          createdBy: item.created_by,
          updatedBy: item.updated_by,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        count: count || 0
      };
    } catch (err) {
      console.error('Erro ao buscar prestações de contas:', err);
      return { data: [], count: 0 };
    }
  },

  getAllPrestacoes: async (): Promise<any[]> => {
    try {
      let allData: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      // Buscar em lotes de 1000 registros até trazer tudo
      while (hasMore) {
        const { data, error } = await supabase
          .from('prestacoes_contas')
          .select('*')
          .order('month', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error('Erro ao buscar prestações:', error.message);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
          offset += pageSize;
          
          // Se retornou menos que pageSize, significa que chegou ao fim
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      return allData.map((item: any) => ({
        id: item.id,
        processId: item.process_id,
        processNumber: item.process_number,
        interested: item.interested,
        month: item.month,
        status: item.status,
        motivo: item.motivo,
        observations: item.observations,
        entryDate: item.entry_date,
        exitDate: item.exit_date,
        link: item.link,
        createdBy: item.created_by,
        updatedBy: item.updated_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (err) {
      console.error('Erro ao buscar todas as prestações:', err);
      return [];
    }
  },

  savePrestacao: async (prestacao: any, user: User): Promise<void> => {
    try {
      const isNew = !prestacao.id;
      const id = prestacao.id || crypto.randomUUID();

      // Buscar dados antigos se for UPDATE para registrar no histórico
      let dadosAntigos: any = null;
      if (!isNew) {
        const { data } = await supabase
          .from('prestacoes_contas')
          .select('*')
          .eq('id', id)
          .single();
        dadosAntigos = data;
      }

      const versionNumber = (prestacao.versionNumber || 0) + 1;

      const payload: any = {
        id,
        process_id: prestacao.processId || null,
        process_number: prestacao.processNumber,
        interested: prestacao.interested || null,
        month: prestacao.month,
        status: prestacao.status,
        motivo: prestacao.status === 'IRREGULAR' ? prestacao.motivo : null,
        observations: prestacao.observations || null,
        entry_date: prestacao.entryDate || null,
        exit_date: prestacao.exitDate || null,
        link: prestacao.link || null,
        version_number: versionNumber,
        created_by: prestacao.createdBy || user.id,
        updated_by: user.id,
        created_at: prestacao.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { error } = await supabase.from('prestacoes_contas').insert(payload);
        
        if (error) {
          console.error('Erro ao inserir prestação:', error);
          throw new Error(`Insert failed: ${error.message}`);
        }

        // Registrar entrada inicial no histórico
        await DbService.saveHistoricoPrestacao({
          prestacaoId: id,
          versionNumber: 1,
          statusAnterior: null,
          statusNovo: prestacao.status,
          motivoAnterior: null,
          motivoNovo: prestacao.status === 'IRREGULAR' ? prestacao.motivo : null,
          descricao: `Prestação criada com status ${prestacao.status}`,
          alteradoPor: user.id,
          nomeUsuario: user.name
        });
      } else {
        const { error } = await supabase.from('prestacoes_contas').update(payload).eq('id', prestacao.id);
        
        if (error) {
          console.error('Erro ao atualizar prestação:', error);
          throw new Error(`Update failed: ${error.message}`);
        }

        // Se status mudou, registrar no histórico
        if (dadosAntigos && (dadosAntigos.status !== prestacao.status || dadosAntigos.motivo !== (prestacao.status === 'IRREGULAR' ? prestacao.motivo : null))) {
          await DbService.saveHistoricoPrestacao({
            prestacaoId: id,
            versionNumber,
            statusAnterior: dadosAntigos.status,
            statusNovo: prestacao.status,
            motivoAnterior: dadosAntigos.motivo,
            motivoNovo: prestacao.status === 'IRREGULAR' ? prestacao.motivo : null,
            observacoes: prestacao.observations,
            descricao: `Status alterado de ${dadosAntigos.status} para ${prestacao.status}`,
            alteradoPor: user.id,
            nomeUsuario: user.name
          });
        }
      }

      await DbService.logAction('CREATE', `Prestação de contas ${isNew ? 'criada' : 'atualizada'}: ${prestacao.processNumber} - ${prestacao.month}`, user, id);
    } catch (err: any) {
      console.error('Erro em savePrestacao:', err);
      throw err;
    }
  },

  deletePrestacao: async (id: string, user: User): Promise<void> => {
    const { error } = await supabase.from('prestacoes_contas').delete().eq('id', id);
    if (error) throw error;
    await DbService.logAction('DELETE', `Prestação de contas excluída (ID: ${id})`, user, id);
  },

  getPrestacoesByProcessNumber: async (processNumber: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('prestacoes_contas')
      .select('*')
      .eq('process_number', processNumber)
      .order('month', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      processId: item.process_id,
      processNumber: item.process_number,
      interested: item.interested,
      entryDate: item.entry_date,
      exitDate: item.exit_date,
      link: item.link,
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },

  // --- HISTÓRICO DE PRESTAÇÕES ---
  getHistoricoPrestacao: async (prestacaoId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('prestacoes_contas_historico')
      .select('*')
      .eq('prestacao_id', prestacaoId)
      .order('data_alteracao', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      prestacaoId: item.prestacao_id,
      versionNumber: item.version_number,
      statusAnterior: item.status_anterior,
      statusNovo: item.status_novo,
      motivoAnterior: item.motivo_anterior,
      motivoNovo: item.motivo_novo,
      alteradoPor: item.alterado_por,
      nomeUsuario: item.nome_usuario,
      dataAlteracao: item.data_alteracao
    }));
  },

  getHistoricoByProcessNumber: async (processNumber: string): Promise<any[]> => {
    // Buscar todas as prestações com esse número de processo
    const { data: prestacoes, error: prestError } = await supabase
      .from('prestacoes_contas')
      .select('id, month, entry_date, exit_date')
      .eq('process_number', processNumber);

    if (prestError) throw prestError;
    if (!prestacoes || prestacoes.length === 0) return [];

    const prestacaoIds = prestacoes.map(p => p.id);
    const prestacaoMap = new Map(prestacoes.map(p => [p.id, p]));

    // Buscar histórico de todas essas prestações
    const { data, error } = await supabase
      .from('prestacoes_contas_historico')
      .select('*')
      .in('prestacao_id', prestacaoIds)
      .order('data_alteracao', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => {
      const prestacao = prestacaoMap.get(item.prestacao_id);
      return {
        ...item,
        prestacaoId: item.prestacao_id,
        versionNumber: item.version_number,
        statusAnterior: item.status_anterior,
        statusNovo: item.status_novo,
        motivoAnterior: item.motivo_anterior,
        motivoNovo: item.motivo_novo,
        alteradoPor: item.alterado_por,
        nomeUsuario: item.nome_usuario,
        dataAlteracao: item.data_alteracao,
        // Dados da prestação
        mes: prestacao?.month,
        dataEntrada: prestacao?.entry_date,
        dataSaida: prestacao?.exit_date
      };
    });
  },

  saveHistoricoPrestacao: async (entrada: any): Promise<void> => {
    const payload = {
      id: crypto.randomUUID(),
      prestacao_id: entrada.prestacaoId,
      version_number: entrada.versionNumber,
      status_anterior: entrada.statusAnterior || null,
      status_novo: entrada.statusNovo,
      motivo_anterior: entrada.motivoAnterior || null,
      motivo_novo: entrada.motivoNovo || null,
      observacoes: entrada.observacoes || null,
      descricao: entrada.descricao,
      alterado_por: entrada.alteradoPor,
      nome_usuario: entrada.nomeUsuario,
      data_alteracao: new Date().toISOString()
    };

    const { error } = await supabase.from('prestacoes_contas_historico').insert(payload);
    if (error) throw error;
  },

  deleteHistoricoEntry: async (historicoId: string, user: User): Promise<void> => {
    const { error } = await supabase.from('prestacoes_contas_historico').delete().eq('id', historicoId);
    if (error) throw error;
    await DbService.logAction('DELETE', `Entrada de histórico excluída (ID: ${historicoId})`, user, historicoId);
  },

  // ============ DASHBOARD STATISTICS ============
  
  getStatistics: async (): Promise<any> => {
    try {
      const allProcesses = await DbService.getAllProcesses();
      const allPrestacoes = await DbService.getAllPrestacoes();

      // 1. Processos por origem (CGOF) - contagem única
      const processosPorOrigem = Array.from(
        new Map(allProcesses.map(p => [p.CGOF, { origem: p.CGOF || 'Sem origem', count: 0 }])).values()
      ).map(item => ({
        ...item,
        count: allProcesses.filter(p => p.CGOF === item.origem).length
      }));

      // 2. Processos entrada últimos 7 dias
      const hoje = new Date();
      const processosEntrada7Dias: { [key: string]: number } = {};
      
      for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const chave = data.toISOString().split('T')[0];
        processosEntrada7Dias[chave] = 0;
      }
      
      allProcesses.forEach(p => {
        if (p.entryDate) {
          const dataStr = p.entryDate.split('T')[0];
          if (processosEntrada7Dias.hasOwnProperty(dataStr)) {
            processosEntrada7Dias[dataStr]++;
          }
        }
      });

      const entradaChart = Object.entries(processosEntrada7Dias).map(([data, count]) => ({
        data: new Date(data).toLocaleDateString('pt-BR'),
        quantidade: count
      }));

      // 3. Processos saída últimos 7 dias
      const processosSaida7Dias: { [key: string]: number } = {};
      
      for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const chave = data.toISOString().split('T')[0];
        processosSaida7Dias[chave] = 0;
      }
      
      allProcesses.forEach(p => {
        if (p.processDate) {
          const dataStr = p.processDate.split('T')[0];
          if (processosSaida7Dias.hasOwnProperty(dataStr)) {
            processosSaida7Dias[dataStr]++;
          }
        }
      });

      const saidaChart = Object.entries(processosSaida7Dias).map(([data, count]) => ({
        data: new Date(data).toLocaleDateString('pt-BR'),
        quantidade: count
      }));

      // 4. Localizações mais enviadas
      const localizacaoCounts = new Map<string, number>();
      allProcesses.forEach(p => {
        if (p.sector) {
          localizacaoCounts.set(p.sector, (localizacaoCounts.get(p.sector) || 0) + 1);
        }
      });
      
      const localizacoesMaisEnviadas = Array.from(localizacaoCounts.entries())
        .map(([localizacao, count]) => ({ localizacao, quantidade: count }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // 5. Processos urgentes
      const processosUrgentes = allProcesses.filter(p => p.urgent === true).length;

      // 6. Processos sem data de saída
      const processosSemdataSaida = allProcesses.filter(p => !p.processDate).length;

      // 7. Processos sem localização
      const processosSemLocalizacao = allProcesses.filter(p => !p.sector).length;

      // 8. Prestações por interessado por mês
      const prestacaoPorInteressado: { [key: string]: { [key: string]: number } } = {};
      
      allPrestacoes.forEach(p => {
        const interessado = p.interested || 'Sem interessado';
        const mes = p.month || 'Sem data';
        
        if (!prestacaoPorInteressado[interessado]) {
          prestacaoPorInteressado[interessado] = {};
        }
        prestacaoPorInteressado[interessado][mes] = (prestacaoPorInteressado[interessado][mes] || 0) + 1;
      });

      // 9. Prestações regulares vs irregulares (removendo duplicatas por processNumber + month)
      const prestacaoMap = new Map<string, any>();
      allPrestacoes.forEach(p => {
        const key = `${p.processNumber}__${p.month}`;
        if (!prestacaoMap.has(key)) {
          prestacaoMap.set(key, p);
        }
      });
      const uniquePrestacoes = Array.from(prestacaoMap.values());
      const prestacaoRegulares = uniquePrestacoes.filter(p => p.status === 'REGULAR').length;
      const prestacaoIrregulares = uniquePrestacoes.filter(p => p.status === 'IRREGULAR').length;

      return {
        processosPorOrigem,
        entradaChart,
        saidaChart,
        localizacoesMaisEnviadas,
        processosUrgentes,
        processosSemdataSaida,
        processosSemLocalizacao,
        prestacaoPorInteressado,
        prestacaoRegulares,
        prestacaoIrregulares,
        totalProcessos: allProcesses.length,
        totalPrestacoes: allPrestacoes.length
      };
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    }
  }
};

