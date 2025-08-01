import { NextResponse, type NextRequest } from 'next/server';

// Middleware compatible con Edge: solo manipula cookies si es necesario
export function updateSession(request: NextRequest) {
  // Si necesitas manipular cookies, hazlo aquí con request.cookies y NextResponse
  // No uses Supabase ni ninguna librería que dependa de Node.js
  return NextResponse.next();
}