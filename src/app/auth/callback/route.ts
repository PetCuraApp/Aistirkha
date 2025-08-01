import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  console.log('Auth callback recibido con código:', code ? 'Código presente' : 'Sin código');

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(cookieStore);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error al intercambiar código por sesión:', error.message);
        // Redirigir a la página de inicio de sesión con un mensaje de error
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent('Error al iniciar sesión')}`);
      }
      
      console.log('Sesión creada correctamente:', data.session ? 'Sesión válida' : 'Sin sesión');
      // Redirigir a la página de inicio después de iniciar sesión correctamente
      return NextResponse.redirect(`${requestUrl.origin}/home`);
    } catch (error: any) {
      console.error('Error inesperado en el callback de autenticación:', error.message);
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent('Error inesperado al iniciar sesión')}`);
    }
  }

  // Si no hay código, redirigir a la página de inicio
  console.log('No se proporcionó código de autenticación, redirigiendo a la página principal');
  return NextResponse.redirect(requestUrl.origin);
}