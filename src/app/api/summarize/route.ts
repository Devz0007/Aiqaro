// This file is no longer used and can be deleted
// We're keeping it temporarily to prevent breaking changes if other components depend on it

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    summary: '',
    success: false,
    message: 'Summarization functionality has been removed'
  }, { status: 410 }); // Gone status code
} 