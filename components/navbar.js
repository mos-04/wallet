// components/Navbar.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');

  const translations = {
    en: {
      dashboard: 'Dashboard',
      sales: 'Sales',
      reports: 'Reports',
      admin: 'Admin',
      logout: 'Logout',
      english: 'English',
      arabic: 'العربية'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      sales: 'المبيعات',
      reports: 'التقارير',
      admin: 'الإدارة',
      logout: 'تسجيل الخروج',
      english: 'English',
      arabic: 'العربية'
    }
  };

  const t = translations[language];

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          {language === 'en' ? 'Sand POS' : 'نقاط بيع الرمال'}
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <select 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-blue-500 p-2 rounded text-white"
          >
            <option value="en">{t.english}</option>
            <option value="ar">{t.arabic}</option>
          </select>

          {/* Navigation Links */}
          <Link href="/cashier" className={`hover:underline ${router.pathname === '/cashier' ? 'font-bold' : ''}`}>
            {t.sales}
          </Link>
          
          <Link href="/reports" className={`hover:underline ${router.pathname === '/reports' ? 'font-bold' : ''}`}>
            {t.reports}
          </Link>
          
          {router.pathname.includes('admin') && (
            <Link href="/admin" className="hover:underline font-bold">
              {t.admin}
            </Link>
          )}
          
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
          >
            {t.logout}
          </button>
        </div>
      </div>
    </nav>
  );
}
