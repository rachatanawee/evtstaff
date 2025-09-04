'use server'

import { createClient } from '@/lib/supabase/server'

export interface Prize {
  id: string;
  name: string;
  description: string;
}

export interface EmployeeDetails {
  employee_id: string;
  full_name: string;
  department: string | null;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): { message: string } {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the error
    return new Error(String(maybeError));
  }
}

function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

export async function searchEmployeePrize(employeeId: string): Promise<{ prize?: Prize | null; error?: string; redeemedPhotoPath?: string; employee?: EmployeeDetails }> {
  const supabase = await createClient();

  try {
    // Step 1: Check if employee has won a prize and its redemption status
    const { data: winnerData, error: winnerError } = await supabase
      .from('winners')
      .select('prize_id, redemption_status, redemption_photo_path') // Fetch status and photo path
      .eq('employee_id', employeeId)
      .single();

    if (winnerError && winnerError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw winnerError;
    }

    if (!winnerData) { // No winner found
      return { error: 'No prize found for this employee.' };
    }

    if (winnerData.redemption_status === 'redeemed') {
      return {
        error: 'รับของไปแล้ว', // "Already received the item"
        redeemedPhotoPath: winnerData.redemption_photo_path || undefined, // Include photo path if available
      };
    }

    // Step 2: Fetch employee details
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('employee_id, full_name, department')
      .eq('employee_id', employeeId)
      .single();

    if (employeeError) {
      throw employeeError;
    }

    if (!employeeData) {
      return { error: 'Employee details not found.' };
    }

    // Step 3: If winner found and not redeemed, fetch prize details
    const { data: prizeDetails, error: prizeError } = await supabase
      .from('prizes')
      .select('id, name')
      .eq('id', winnerData.prize_id)
      .single();

    if (prizeError) {
      throw prizeError;
    }

    if (!prizeDetails) { // Prize details not found (should not happen if prize_id is valid)
      return { error: 'Prize details not found.' };
    }

    return { prize: prizeDetails as Prize, employee: employeeData as EmployeeDetails };
  } catch (e: unknown) {
    return { error: getErrorMessage(e) };
  }
}

export async function submitPrizeClaim(employeeId: string, prizeId: string, photoBase64: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Check for existing claim
    const { data: existingWinner, error: checkError } = await supabase
      .from('winners')
      .select('id, redemption_status') // Select id and redemption_status to check if already redeemed
      .eq('employee_id', employeeId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    if (!existingWinner) {
      return { success: false, error: 'No existing prize record found for this employee.' };
    }

    if (existingWinner.redemption_status === 'redeemed') {
      return { success: false, error: 'This prize has already been redeemed.' };
    }

    // Get current user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const redeemedByStaffId = user.id;

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
      .from('claim_prize')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('winners')
      .update({
        redemption_status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redemption_photo_path: uploadData.path,
        redeemed_by_staff: redeemedByStaffId,
      })
      .eq('employee_id', employeeId); // Update based on employee_id

    if (dbError) throw dbError;

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}