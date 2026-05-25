import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const CompanyContext = createContext(null);

export const API = import.meta.env.VITE_API_URL || 'http://localhost:2000';

export function CompanyProvider({ children }) {
  const location = useLocation();

  // Extract the first path segment as the company slug
  const pathSlug = location.pathname.split('/').filter(Boolean)[0] || '';
  const needsCompany = !!pathSlug && pathSlug !== 'admin';

  const [company,  setCompany]  = useState(null);
  const [loading,  setLoading]  = useState(needsCompany); // true on first render if we need a company
  const [error,    setError]    = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Admin routes and the root landing page don't need a company
    if (!needsCompany) {
      setCompany(null);
      setLoading(false);
      setError(null);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    fetch(`${API}/api/company/config?slug=${encodeURIComponent(pathSlug)}`)
      .then(async r => {
        if (r.ok) return r.json();
        throw { status: r.status };
      })
      .then(data => { setCompany(data); applyBranding(data); })
      .catch(err => {
        if (err?.status === 404) {
          // Slug doesn't exist or company is not active
          setNotFound(true);
          setCompany(null);
        } else {
          // Network error — no server response at all
          setError('Could not connect to the server. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [pathSlug]);

  return (
    <CompanyContext.Provider value={{ company, loading, error, notFound }}>
      {children}
    </CompanyContext.Provider>
  );
}

function applyBranding(company) {
  if (!company) return;
  const root = document.documentElement;
  if (company.primary_color) {
    root.style.setProperty('--brand',   company.primary_color);
    root.style.setProperty('--primary', shadeColor(company.primary_color, -30));
  }
  if (company.name) document.title = `${company.name} – ${company.meeting_type} Registration`;
}

function shadeColor(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (num & 0xff) + pct));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const useCompany = () => useContext(CompanyContext);
