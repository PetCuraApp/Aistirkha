'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    window.location.href = '/';
  };

  const closeMenus = () => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/productos', label: 'Masajes' },
    { href: '/reservas', label: 'Reservar' },
    { href: '/nosotros', label: 'Nosotros' },
    { href: '/contacto', label: 'Contacto' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-95 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Image src="/images/logotransparente.png" alt="Logo" width={40} height={40} className="mr-3" />
            <Link href="/" className="text-xl font-bold text-white" onClick={closeMenus}>
              Aistirkha
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${isActive(link.href) ? 'text-teal-600 font-medium' : 'text-gray-600 hover:text-teal-500'} transition-colors duration-200`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-gray-600 hover:text-teal-500 focus:outline-none"
                >
                  <FiUser className="h-5 w-5" />
                  <span>Mi Cuenta</span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5"
                    >
                      <Link
                        href="/cliente"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeMenus}
                      >
                        Mi Perfil
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={closeMenus}
                        >
                          <div className="flex items-center">
                            <FiSettings className="mr-2" />
                            Panel Admin
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : !isLoading ? (
              <div className="flex space-x-4">
                <Link
                  href="/auth"
                  className="text-gray-600 hover:text-teal-500 transition-colors duration-200"
                >
                  Iniciar Sesión
                </Link>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            {!isLoading && user && (
              <Link href="/cliente" className="text-gray-600">
                <FiUser className="h-6 w-6" />
              </Link>
            )}
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-teal-500 focus:outline-none"
            >
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${isActive(link.href) ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50 hover:text-teal-500'} block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              ))}

              {!isLoading && user ? (
                <>
                  <Link
                    href="/cliente"
                    className="text-gray-600 hover:bg-gray-50 hover:text-teal-500 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={closeMenus}
                  >
                    Mi Perfil
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-600 hover:bg-gray-50 hover:text-teal-500 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={closeMenus}
                    >
                      <div className="flex items-center">
                        <FiSettings className="mr-2" />
                        Panel Admin
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 hover:bg-gray-50 hover:text-teal-500 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : !isLoading ? (
                <>
                  <Link
                    href="/auth"
                    className="text-gray-600 hover:bg-gray-50 hover:text-teal-500 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={closeMenus}
                  >
                    Iniciar Sesión
                  </Link>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}