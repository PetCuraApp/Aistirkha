'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone, FiAlertCircle } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/supabase';

type AuthMode = 'login' | 'register';

const loginSchema = z.object({
  email: z.string().email({ message: 'Ingrese un email válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Ingrese un email válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  telefono: z.string().min(8, { message: 'Ingrese un número de teléfono válido' }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors },
    reset: resetRegister,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      nombre: '',
      telefono: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAuthError(null);
    console.log('Iniciando sesión con email:', data.email);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Error de autenticación:', error.message);
        throw error;
      }

      console.log('Inicio de sesión exitoso:', authData.session ? 'Sesión creada' : 'No hay sesión');
      if (authData.session) {
        console.log('ID de usuario:', authData.session.user.id);
        console.log('Token de acceso presente:', !!authData.session.access_token);
      }

      // Redirigir al usuario a la página de inicio después del inicio de sesión exitoso
      console.log('Redirigiendo a /home');
      router.push('/home');
      router.refresh();
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      setAuthError(error.message || 'Error al iniciar sesión. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setAuthError(null);
    console.log('Registrando nuevo usuario con email:', data.email);

    try {
      // 1. Registrar al usuario con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nombre: data.nombre,
            telefono: data.telefono
          }
        },
      });

      if (authError) {
        console.error('Error en el registro de autenticación:', authError.message);
        throw authError;
      }

      console.log('Usuario registrado en Auth:', authData.user?.id);

      // 2. Insertar información adicional del usuario en la tabla 'usuarios'
      if (authData.user) {
        console.log('Insertando datos en la tabla usuarios');
        const { error: profileError } = await supabase.from('usuarios').insert([
          {
            id: authData.user.id,
            email: data.email,
            nombre: data.nombre,
            apellido: '',
            telefono: data.telefono || null,
            rol: 'cliente',
            created_at: new Date().toISOString()
          }
        ] as any);

        if (profileError) {
          console.error('Error al crear perfil de usuario:', profileError.message);
          // Continuar a pesar del error, ya que el usuario ya está creado en Auth
        } else {
          console.log('Perfil de usuario creado correctamente');
        }
      }

      // 3. Mostrar mensaje de éxito y cambiar al modo de inicio de sesión
      console.log('Registro completado, cambiando a modo login');
      alert('Registro exitoso. Por favor, verifica tu correo electrónico para confirmar tu cuenta.');
      setMode('login');
      resetRegister();
    } catch (error: any) {
      console.error('Error de registro:', error);
      setAuthError(error.message || 'Error al registrarse. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setAuthError(null);
    resetLogin();
    resetRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
            <button
              onClick={toggleMode}
              className="font-medium text-teal-600 hover:text-teal-500 focus:outline-none"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin(handleLogin)}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="login-email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    {...registerLogin('email')}
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border ${loginErrors.email ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`}
                    placeholder="Email"
                  />
                </div>
                {loginErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="sr-only">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    {...registerLogin('password')}
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border ${loginErrors.password ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`}
                    placeholder="Contraseña"
                  />
                </div>
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitRegister(handleRegister)}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="register-nombre" className="sr-only">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="register-nombre"
                    type="text"
                    autoComplete="name"
                    {...registerSignUp('nombre')}
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border ${registerErrors.nombre ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`}
                    placeholder="Nombre Completo"
                  />
                </div>
                {registerErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.nombre.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    {...registerSignUp('email')}
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border ${registerErrors.email ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`}
                    placeholder="Email"
                  />
                </div>
                {registerErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-telefono" className="sr-only">
                  Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="register-telefono"
                    type="tel"
                    autoComplete="tel"
                    {...registerSignUp('telefono')}
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border ${registerErrors.telefono ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`}
                    placeholder="Teléfono"
                  />
                </div>
                {registerErrors.telefono && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.telefono.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-password" className="sr-only">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    {...registerSignUp('password')}
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border ${registerErrors.password ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`}
                    placeholder="Contraseña"
                  />
                </div>
                {registerErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </>
                ) : (
                  'Registrarse'
                )}
              </button>
            </div>

            <div className="text-sm text-center text-gray-600">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                Política de Privacidad
              </a>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}