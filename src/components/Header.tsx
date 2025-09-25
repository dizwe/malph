import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <span className="logo-text">malph</span>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">홈</Link>
          <Link to="/privacy-policy" className="nav-link">개인정보처리방침</Link>
          <Link to="/terms-of-service" className="nav-link">서비스약관</Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
