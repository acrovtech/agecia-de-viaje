import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint deshabilitado. La inicialización de usuarios administrativos debe realizarse exclusivamente vía script CLI.' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint deshabilitado. La inicialización de usuarios administrativos debe realizarse exclusivamente vía script CLI.' },
    { status: 404 }
  );
}

