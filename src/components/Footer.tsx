import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-text">malph</span>
            </div>
            <p className="footer-description">
              일상에서 영감을 받아,둘이서 서비스를 만듭니다
            </p>
          </div>
          
          <div className="footer-section">
            <h4>서비스</h4>
            <ul className="footer-links">
              <li><Link to="/">홈</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>법적 고지</h4>
            <ul className="footer-links">
              <li><Link to="/privacy-policy">개인정보처리방침</Link></li>
              <li><Link to="/terms-of-service">서비스약관</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>연락처</h4>
            <div className="contact-info">
              <p>📧 contact@malph.app</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 malph. All rights reserved.</p>
          <p>Made with ❤️ and lots of ☕</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
