import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ShareholderCheck from './ShareholderCheck';
import PreSuccess from './pages/Presuccess';
import Success from './pages/Success';
import RegisteredHolders from './pages/RegisteredHolders';
import Header from './Header';
import Footer from './Footer';
import './pages/RegisteredHolders.css';
import UserTypeSelection from './pages/UserTypeSelection';
import GuestRegistration from './pages/GuestRegistration';
import GuestSuccess from './pages/GuestSuccess';

function App() {
  const [shareholderData, setShareholderData] = useState(null);
  const [guestData, setGuestData] = useState(null);

  return (
    <Router>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <Routes>
            {/* Landing page - User type selection */}
            <Route path="/" element={<UserTypeSelection />} />
            
            {/* Shareholder flow */}
            <Route path="/shareholder" element={
              <ShareholderCheck 
                setShareholderData={setShareholderData}
              />
            } />
            <Route path="/shareholder/presuccess" element={
              shareholderData ? (
                <PreSuccess 
                  shareholderData={shareholderData}
                  onBackToHome={() => <Navigate to="/shareholder" />}
                />
              ) : (
                <Navigate to="/shareholder" />
              )
            } />
            <Route path="/shareholder/success" element={
              shareholderData ? (
                <Success 
                  shareholderData={shareholderData}
                  onBackToHome={() => <Navigate to="/" />}
                />
              ) : (
                <Navigate to="/shareholder" />
              )
            } />
            
            {/* Guest flow */}
            <Route path="/guest" element={
              <GuestRegistration 
                setGuestData={setGuestData}
              />
            } />
         
         <Route path="/guest/success" element={guestData ? (<GuestSuccess guestData={guestData} />) : (<Navigate to="/guest" />)} />

            {/* Admin/registered users */}
            <Route path="/registered-users" element={<RegisteredHolders />} />
            
            {/* Fallback routes */}
            <Route path="/registration-success" element={<Navigate to="/shareholder/success" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;