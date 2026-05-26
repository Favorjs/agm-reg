export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bottom" style={{ borderTop: 'none', marginTop: 0 }}>
        <p>
          &copy; {new Date().getFullYear()} Apel Capital Registrars Limited. All rights reserved.
          &nbsp;·&nbsp;
          <a href="mailto:registrars@apel.com.ng" style={{ color: '#ffffff', textDecoration: 'none' }}>
            registrars@apel.com.ng
          </a>
        </p>
      </div>
    </footer>
  );
}
