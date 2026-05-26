import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

import { CompanyProvider, useCompany } from './context/CompanyContext';

import ShareholderCheck from './ShareholderCheck';
import PreSuccess from './pages/Presuccess';
import Success from './pages/Success';
import RegisteredHolders from './pages/RegisteredHolders';
import Header from './Header';
import Footer from './Footer';
import UserTypeSelection from './pages/UserTypeSelection';
import GuestRegistration from './pages/GuestRegistration';
import GuestSuccess from './pages/GuestSuccess';
import CompanySelector from './pages/CompanySelector';
import './pages/RegisteredHolders.css';

// Admin portal
import AdminLogin from './admin/AdminLogin';
import Companies from './admin/Companies';
import CompanyEdit from './admin/CompanyEdit';
import CompanyRegistrations from './admin/CompanyRegistrations';

// ── 404 page shown when slug doesn't exist in the DB ──────────────────────────
function CompanyNotFound({ slug }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 72px)', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>🔍</div>
        <h2 style={{ color: '#0f3d2e', marginBottom: '.5rem', fontSize: '1.5rem' }}>Company Not Found</h2>
        <p style={{ color: '#475569', marginBottom: '.5rem', lineHeight: 1.6 }}>
          <code style={{ background: '#f1f5f9', padding: '.2rem .55rem', borderRadius: 5, fontSize: '.9rem' }}>/{slug}</code>{' '}
          does not match any active company in our system.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '.875rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          The link may be incorrect, or this meeting has not been set up yet. Please contact
          {' '}<a href="mailto:registrars@apel.com.ng" style={{ color: '#107b5f' }}>registrars@apel.com.ng</a>{' '}
          if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/')}
          className="submit-btn"
          style={{ display: 'inline-flex', padding: '.75rem 2rem', fontSize: '1rem' }}
        >
          View All Active Meetings
        </button>
      </div>
    </div>
  );
}

// ── Shown when registration is closed for an existing company ─────────────────
function RegistrationClosed() {
  const { company } = useCompany();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 72px)' }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: 'var(--primary)', marginBottom: '.5rem' }}>Registration Closed</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '.95rem' }}>
          Registration for the <strong>{company?.name} {company?.meeting_type}</strong> is not currently open.
          Please check back later or contact{' '}
          <a href="mailto:registrars@apel.com.ng" style={{ color: 'var(--brand)' }}>registrars@apel.com.ng</a>.
        </p>
      </div>
    </div>
  );
}

// ── Handles all /:slug/* routes ───────────────────────────────────────────────
function CompanyRoutes() {
  const { slug } = useParams();
  const { company, loading, error, notFound } = useCompany();
  const [shareholderData, setShareholderData] = useState(null);
  const [guestData, setGuestData]             = useState(null);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 72px)' }}>
      <div className="spinner" style={{ borderTopColor: 'var(--brand)', borderColor: 'rgba(0,0,0,.1)', width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  // Company slug not found in DB or not active
  if (notFound) return <CompanyNotFound slug={slug} />;

  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <p>{error}</p>
    </div>
  );

  const closed = !company?.is_registration_open;

  return (
    <Routes>
      <Route index element={closed ? <RegistrationClosed /> : <UserTypeSelection />} />

      <Route path="shareholder" element={
        closed ? <RegistrationClosed /> : <ShareholderCheck setShareholderData={setShareholderData} />
      } />
      <Route path="shareholder/presuccess" element={
        shareholderData
          ? <PreSuccess shareholderData={shareholderData} />
          : <Navigate to={`/${slug}/shareholder`} />
      } />
      <Route path="shareholder/success" element={
        shareholderData
          ? <Success shareholderData={shareholderData} />
          : <Navigate to={`/${slug}/shareholder`} />
      } />

      <Route path="guest" element={
        closed ? <RegistrationClosed /> : <GuestRegistration setGuestData={setGuestData} />
      } />
      <Route path="guest/success" element={
        guestData
          ? <GuestSuccess guestData={guestData} />
          : <Navigate to={`/${slug}/guest`} />
      } />

      <Route path="registered-users" element={<RegisteredHolders />} />
      <Route path="*" element={<Navigate to={`/${slug}`} />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing: company selector */}
      <Route path="/" element={<CompanySelector />} />

      {/* Admin portal — static routes always beat /:slug/* */}
      <Route path="/admin/login"                       element={<AdminLogin />} />
      <Route path="/admin/companies"                   element={<Companies />} />
      <Route path="/admin/companies/:id"               element={<CompanyEdit />} />
      <Route path="/admin/companies/:id/registrations" element={<CompanyRegistrations />} />
      <Route path="/admin"                             element={<Navigate to="/admin/companies" />} />

      {/* Per-company registration flow */}
      <Route path="/:slug/*" element={<CompanyRoutes />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <CompanyProvider>
        <div className="app">
          <Header />
          <main className="main-content">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </CompanyProvider>
    </Router>
  );
}

export default App;
