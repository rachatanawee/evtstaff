import { NextRequest, NextResponse } from 'next/server';
import { checkInParticipant } from '../actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('API Register - Received body:', body);

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'No data provided' },
        { status: 400 }
      );
    }

    // เรียกใช้ checkInParticipant function ที่มีอยู่แล้ว
    const result = await checkInParticipant(body);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
