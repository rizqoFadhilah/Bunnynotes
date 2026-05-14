'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/api';

interface DeleteBudgetButtonProps {
  budgetIds: string[];
}

export default function DeleteBudgetButton({ budgetIds }: DeleteBudgetButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setConfirmDelete(false);
    try {
      for (const id of budgetIds) {
        if (!id) continue;
        const res1 = await supabase.from('budgets').delete().eq('ID', id);
        if (res1.error) {
           await supabase.from('budgets').delete().eq('id', id);
        }
      }
      router.refresh();
    } catch (error) {
      console.error('Failed to delete budget', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const onRequestDelete = () => {
    if (confirmDelete) {
      handleDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => {
        setConfirmDelete(false);
      }, 3000);
    }
  };

  if (!budgetIds || budgetIds.length === 0) return null;

  return (
    <div className="absolute right-2 top-2 z-20">
      <button 
        onClick={onRequestDelete} 
        disabled={isDeleting}
        className={clsx(
          "text-xs font-bold px-2 py-1 rounded-full transition-all flex items-center gap-1",
          confirmDelete ? "bg-error text-on-error" : "text-on-surface-variant hover:text-error bg-transparent"
        )}
        aria-label="Delete budget"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {confirmDelete && <span>Yakin?</span>}
      </button>
    </div>
  );
}
