'use server'

import { createClient } from '@/lib/supabase/server'

function getSession() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour <= 16) {
    return 'Day';
  } else if (hour > 16 && hour <= 20) {
    return 'Night';
  } else {
    return 'Night'; // Default to Night for hours outside 06:00-20:00
  }
}

export async function checkInParticipant(scannedData: string) {
  const supabase = await createClient();
  const session = getSession();
  const currentTime = new Date().toISOString();

  let parsedData: { employee_id: string; full_name?: string; department?: string };
  try {
    console.log('Scanned Data (before JSON.parse):', scannedData);
    parsedData = JSON.parse(scannedData);
    if (!parsedData.employee_id) {
      throw new Error('Scanned data is missing employee_id.');
    }
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return { success: false, message: 'Invalid QR code data format.' };
  }

  try {
    // Try to find an existing registration
    const { data: existingRegistration, error: selectError } = await supabase
      .from('registrations')
      .select('employee_id')
      .eq('employee_id', parsedData.employee_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(`Supabase select error: ${selectError.message}`);
    }

    let message = '';
    if (existingRegistration) {
      // Update existing registration
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: _updatedRegistration, error: updateError } = await supabase
        .from('registrations')
        .update({  registered_at: currentTime, session: session })
        .eq('employee_id', parsedData.employee_id)
        .select();

      if (updateError) {
        throw new Error(`Supabase update error: ${updateError.message}`);
      }
      message = `Successfully updated registration for employee ID: ${parsedData.employee_id}. Session: ${session}`;
    } else {
      // Insert new registration
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: _newRegistration, error: insertError } = await supabase
        .from('registrations')
        .insert({ employee_id: parsedData.employee_id, registered_at: currentTime, session: session })
        .select();

      if (insertError) {
        throw new Error(`Supabase insert error: ${insertError.message}`);
      }
      message = `Successfully registered new employee ID: ${parsedData.employee_id}. Session: ${session}`;
    }

    return { success: true, message: message, session: session, registeredData: parsedData };
  } catch (e: unknown) {
    return { success: false, message: (e instanceof Error) ? e.message : 'An unknown error occurred.' };
  }
}

export async function getInitialSession() {
  return getSession();
}
