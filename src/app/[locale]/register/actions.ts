'use server'

import { createClient } from '@/lib/supabase/server'

function getSession() {
  const now = new Date();
  const hour = now.getHours()+7;

  if (hour >= 6 && hour <= 14) {
    return 'Day';
  } else if (hour > 14 && hour <= 23) {
    return 'Night';
  } else {
    return 'Night'; // Default to Night for hours outside 06:00-20:00
  }
}

export async function checkInParticipant(scannedData: string) {
  const supabase = await createClient()
  const session = getSession()
  const currentTime = new Date().toISOString()

  let parsedData: {
    employee_id: string
    full_name?: string
    department?: string
  }
  try {
    console.log('Scanned Data (before JSON.parse):', scannedData)
    parsedData = JSON.parse(scannedData)
    if (!parsedData.employee_id) {
      throw new Error('Scanned data is missing employee_id.')
    }
  } catch {
    return { success: false, message: 'Invalid QR code data format.' }
  }

  try {
    // Insert new registration
    const { error: insertError } = await supabase.from('registrations').insert({
      employee_id: parsedData.employee_id,
      registered_at: currentTime,
      session: session,
    })

    if (insertError) {
      // Check for duplicate key error
      if (insertError.code === '23505' || insertError.code === '42501') {
        // 23505 is the PostgreSQL error code for unique_violation
        console.log('Duplicate error detected. Attempting to fetch existing registration.');
        console.log('Employee ID:', parsedData.employee_id);
        console.log('Session:', session);

        const { data: existingRegistration, error: selectError } =
          await supabase
            .from('registrations')
            .select('registered_at')
            .eq('employee_id', parsedData.employee_id)
            .eq('session', session)

        console.log('Select data:', existingRegistration);
        console.log('Select error:', selectError);

        if (selectError) {
          // This should not happen if we have a duplicate error, but handle it just in case
          throw new Error(
            `Supabase select error after duplicate: ${selectError.message}`,
          )
        }

        if (existingRegistration && existingRegistration.length > 0) {
          const registeredAt = new Date(existingRegistration[0].registered_at)
          /*
          const time = registeredAt.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
            */
          
          const hours = String(registeredAt.getHours()+7).padStart(2, '0');
          const minutes = String(registeredAt.getMinutes()).padStart(2, '0');
          const seconds = String(registeredAt.getSeconds()).padStart(2, '0');


          const time = `${hours}:${minutes}:${seconds}`;
          return { success: false, message: `มี register แล้วเมื่อเวลา ${time}` }
        } else {
          // This case means a duplicate error occurred, but select returned no data.
          // This could indicate an RLS issue or a race condition.
          return { success: false, message: 'Registration failed due to an unexpected duplicate entry or permission issue.' };
        }
      }
      // For other errors
      throw new Error(`Supabase insert error: ${insertError.code}:${insertError.message}`)
    }

    const message = `Successfully registered new employee ID: ${parsedData.employee_id}. Session: ${session}`
    return {
      success: true,
      message: message,
      session: session,
      registeredData: parsedData,
    }
  } catch (e: unknown) {
    return {
      success: false,
      message: e instanceof Error ? e.message : 'An unknown error occurred.',
    }
  }
}

export async function getInitialSession() {
  return getSession();
}