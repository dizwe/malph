import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import OnermLogPage from './pages/OnermLogPage'
import OnermLogLinksPage from './pages/OnermLogLinksPage'
import Header from './components/Header'
import Footer from './components/Footer'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isLinksPage = location.pathname.startsWith('/links/onerm_log')

  return (
    <div className="app">
      {!isLinksPage && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onerm_log" element={<OnermLogPage />} />
          <Route path="/links/onerm_log/*" element={<OnermLogLinksPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
      </main>
      {!isLinksPage && <Footer />}
    </div>
  )
}

function App() {
  return (
    <Router basename="/">
      <AppContent />
    </Router>
  )
}

export default App
