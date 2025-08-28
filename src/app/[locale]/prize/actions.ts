'use server'

import { createClient } from '@/lib/supabase/server'

export interface Prize {
  id: string;
  name: string;
  description: string;
}

export async function searchEmployeePrize(employeeId: string): Promise<{ prize?: Prize | null; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        prizes (*)
      `)
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    if (!data || !data.prizes || data.prizes.length === 0) return { error: 'No prize found for this employee.' };

    return { prize: data.prizes[0] as Prize };
  } catch (e: unknown) {
    return { error: (e instanceof Error) ? e.message : 'An unknown error occurred.' };
  }
}

export async function submitPrizeClaim(employeeId: string, prizeId: string, photoBase64: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Convert base64 to ArrayBuffer
    const base64WithoutPrefix = photoBase64.split(',')[1];
    const binaryString = atob(base64WithoutPrefix);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes.buffer], { type: 'image/jpeg' });

    const fileName = `${employeeId}-${prizeId}-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prize-confirmations')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('prize_claims')
      .insert({
        employee_id: employeeId,
        prize_id: prizeId,
        photo_url: uploadData.path,
      });

    if (dbError) throw dbError;

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e instanceof Error) ? e.message : 'An unknown error occurred.' };
  }
}
