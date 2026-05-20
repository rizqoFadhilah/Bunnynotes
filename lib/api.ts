import { createClient } from '@supabase/supabase-js';

// We use the environment variables explicitly provided by the user config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yfpfbnvglqfdlnofhhkl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tGpfW6veZXsvUwr7BhlF1Q_ZJVXxoUm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getTransactions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('Tanggal', { ascending: false });
    
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data || [];
}

export async function getBudgets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
  return data || [];
}

export async function getAgendas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('agendas')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) {
    console.error('Error fetching agendas:', error);
    return [];
  }
  
  return data ? data.sort((a: any, b: any) => {
    if (a.Date && b.Date) return new Date(a.Date).getTime() - new Date(b.Date).getTime();
    return 0;
  }) : [];
}

export async function getProfile(uid: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();
    
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function checkIsAllowed(email: string) {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('email')
    .eq('email', email)
    .single();
  
  if (error || !data) return false;
  return true;
}

export async function addTransaction(transaction: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transaction, user_id: user.id }])
    .select();
    
  if (error) throw error;
  return data;
}

export async function addBudget(budget: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .insert([{ ...budget, user_id: user.id }])
    .select();
    
  if (error) throw error;
  return data;
}

export async function addAgenda(agenda: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Handle multiple dates (recurrence) natively
  if (Array.isArray(agenda.Date)) {
    const agendasToInsert = agenda.Date.map((date: string) => ({
      ...agenda,
      Date: date,
      user_id: user.id
    }));
    const { data, error } = await supabase
      .from('agendas')
      .insert(agendasToInsert)
      .select();
      
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('agendas')
      .insert([{ ...agenda, user_id: user.id }])
      .select();
      
    if (error) throw error;
    return data;
  }
}

export async function completeAgenda(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, fetch to get the current state
  const { data: agenda, error: fetchError } = await supabase
    .from('agendas')
    .select('IsCompleted')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (fetchError || !agenda) {
    // If fallback is 'ID' 
    const { data: agendaFall, error: fallError } = await supabase
      .from('agendas')
      .select('IsCompleted')
      .eq('ID', id)
      .eq('user_id', user.id)
      .single();
      
    if (fallError) throw fallError;
    
    const isCompleted = agendaFall.IsCompleted === true || agendaFall.IsCompleted === 'TRUE';
    const { data, error } = await supabase
      .from('agendas')
      .update({ IsCompleted: !isCompleted })
      .eq('ID', id)
      .eq('user_id', user.id)
      .select();
      
    if (error) throw error;
    return data;
  } else {
    const isCompleted = agenda.IsCompleted === true || agenda.IsCompleted === 'TRUE';
    const { data, error } = await supabase
      .from('agendas')
      .update({ IsCompleted: !isCompleted })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();
      
    if (error) throw error;
    return data;
  }
}

export async function saveDailyNote(dateStr: string, noteText: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing, error } = await supabase
    .from('agendas')
    .select('*')
    .eq('user_id', user.id)
    .eq('Title', 'Catatan Kecil')
    .eq('Date', dateStr);

  if (error) {
    console.error('Error finding daily note:', error);
  }

  if (existing && existing.length > 0) {
    const id = existing[0].ID || existing[0].id;
    const { data, error: updateError } = await supabase
      .from('agendas')
      .update({ Notes: noteText })
      .eq('ID', id)
      .eq('user_id', user.id)
      .select();

    if (updateError) {
      const { data: dataFallback, error: errFallback } = await supabase
        .from('agendas')
        .update({ Notes: noteText })
        .eq('id', id)
        .eq('user_id', user.id)
        .select();
      if (errFallback) throw errFallback;
      return dataFallback;
    }
    return data;
  } else {
    const { data, error: insertError } = await supabase
      .from('agendas')
      .insert([{
        Title: 'Catatan Kecil',
        Date: dateStr,
        Notes: noteText,
        IsCompleted: true,
        user_id: user.id
      }])
      .select();

    if (insertError) throw insertError;
    return data;
  }
}

export async function getCategories() {
  const { data: { user } } = await supabase.auth.getUser();
  
  // If user is not logged in, they can still see default categories
  let query = supabase.from('categories').select('*');
  
  if (user) {
    query = query.or(`is_default.eq.true,user_id.eq.${user.id}`);
  } else {
    query = query.eq('is_default', true);
  }

  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function addCategory(category: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .insert([{ ...category, user_id: user.id }])
    .select();
    
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try treating parameter as 'id' or 'ID' column
  let { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select();
    
  if (error || !data || data.length === 0) {
    const { data: dataFallback, error: errorFallback } = await supabase
      .from('categories')
      .delete()
      .eq('ID', id)
      .eq('user_id', user.id)
      .select();
    
    if (errorFallback) throw errorFallback;
    return dataFallback;
  }
  
  return data;
}

export async function deleteTransaction(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select();
    
  if (error || !data || data.length === 0) {
    const { data: dataFallback, error: errorFallback } = await supabase
      .from('transactions')
      .delete()
      .eq('ID', id)
      .eq('user_id', user.id)
      .select();
      
    if (errorFallback) throw errorFallback;
    return dataFallback;
  }
  
  return data;
}

export async function deleteBudgetCategoryByMonth(category: string, year: string, month: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let deletedCount = 0;
    
    // 1. Delete from budgets table
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('Kategori', category)
      .eq('user_id', user.id);

    if (budgetData && budgetData.length > 0) {
       for (const b of budgetData) {
         let shouldDelete = true;
         if (b.Timestamp) {
            const bDate = new Date(b.Timestamp);
            if (!isNaN(bDate.getTime())) {
               shouldDelete = (bDate.getMonth() + 1).toString() === month && bDate.getFullYear().toString() === year;
            }
         }
         
         if (shouldDelete) {
            const id = b.ID || b.id;
            if (id) {
              const res1 = await supabase.from('budgets').delete().eq('ID', id).eq('user_id', user.id);
              if (res1.error) {
                await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id);
              }
              deletedCount++;
            }
         }
       }
    }

    return { success: true, count: deletedCount };
  } catch (err: any) {
    console.error('Error in deleteBudgetCategory:', err);
    return { success: false, error: err.message };
  }
}
