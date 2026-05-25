import { Link } from 'react-router-dom';
import { useCompany } from './context/CompanyContext';

export default function Header() {
  const { company } = useCompany() || {};
  const homeLink = company?.slug ? `/${company.slug}` : '/';

  return (
    <header className="header">
      <Link to={homeLink} className="logo-container" style={{ textDecoration: 'none' }}>
        <img src="/logo.png" alt="Apel Capital Registrars" className="logo" />
      </Link>
      <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.04em' }}>
        REGISTRATION PORTAL
      </span>
    </header>
  );
}
