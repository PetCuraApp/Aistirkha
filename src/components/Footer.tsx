import Link from 'next/link';
import { FiInstagram, FiFacebook, FiTwitter, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-teal-400">Aistirkha</h3>
            <p className="text-gray-300 mb-4">
              Ofrecemos una experiencia de relajación y bienestar a través de nuestros servicios de masajes terapéuticos.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/aistirkha" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                <FiInstagram className="h-6 w-6" />
              </a>
              <a href="https://www.facebook.com/aistirkha" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                <FiFacebook className="h-6 w-6" />
              </a>
              <a href="https://wa.me/56990658190?text=Hola%2C%20Necesito%20informacion%20sobre%20Masajes." target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
                <FaWhatsapp className="h-6 w-6" />
              </a>
              
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-teal-400">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                  Masajes
                </Link>
              </li>
              <li>
                <Link href="/reservas" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                  Reservar
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-300 hover:text-teal-400 transition-colors duration-200">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-teal-400">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <FiMapPin className="h-5 w-5 text-teal-400" />
                <span className="text-gray-300">Av. Coronel Santiago Bueras 1070</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiPhone className="h-5 w-5 text-teal-400" />
                <span className="text-gray-300">+569 90658190 </span>
              </li>
              <li className="flex items-center space-x-2">
                <FiMail className="h-5 w-5 text-teal-400" />
                <span className="text-gray-300">aistirkha@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Aistirkha . Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}