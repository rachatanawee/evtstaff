'use server'

import { createClient } from '@/lib/supabase/client'

export async function checkInParticipant(scannedData: string) {
  const supabase = createClient();

  try {
    const { data: updateData, error: updateError } = await supabase
      .from('participants')
      .update({ status: 'checked-in', updated_at: new Date().toISOString() })
      .eq('id', scannedData)
      .select();

    if (updateError) {
      throw new Error(`Supabase error: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      throw new Error('Participant not found.');
    }

    return { success: true, message: `Successfully checked-in participant: ${scannedData}` };
  } catch (e: unknown) {
    return { success: false, message: (e instanceof Error) ? e.message : 'An unknown error occurred.' };
  }
}
