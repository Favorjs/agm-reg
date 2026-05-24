import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
        <img src="/logo.png" alt="E-Voting Logo" className="logo" />
      </Link>
      <img src="/imgs/sahco.webp" alt="SAHCO Logo" className="logo logo-right" />
    </header>
  );
}