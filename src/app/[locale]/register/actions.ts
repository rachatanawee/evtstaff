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
      if (insertError.code === '23505') {
        // 23505 is the PostgreSQL error code for unique_violation
        const { data: existingRegistration, error: selectError } =
          await supabase
            .from('registrations')
            .select('registered_at')
            .eq('employee_id', parsedData.employee_id)
            .single()

        if (selectError) {
          // This should not happen if we have a duplicate error, but handle it just in case
          throw new Error(
            `Supabase select error after duplicate: ${selectError.message}`,
          )
        }

        if (existingRegistration) {
          const registeredAt = new Date(existingRegistration.registered_at)
          const time = registeredAt.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          return { success: false, message: `มี register แล้วเมื่อเวลา ${time}` }
        }
      }
      // For other errors
      throw new Error(`Supabase insert error: ${insertError.message}`)
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
