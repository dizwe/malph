import React, { useEffect } from 'react'
import './OnermLogLinksPage.css'

const OnermLogLinksPage: React.FC = () => {
  const APP_STORE_URL = 'https://apps.apple.com/app/id6755926206';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.malph.onerm_log';

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // iOS 리다이렉트
    if (/iphone|ipad|ipod/.test(userAgent)) {
      window.location.href = APP_STORE_URL;
    } 
    // 안드로이드 리다이렉트
    else if (/android/.test(userAgent)) {
      window.location.href = PLAY_STORE_URL;
    }
  }, []);

  return (
    <div className="onerm-log-links-page">
      <div className="links-container">
        <div className="links-header">
          <div className="app-icon">💪</div>
          <h1>oneRM Log</h1>
          <p>지금 바로 다운로드하고 운동 기록을 시작하세요!</p>
        </div>
        <div className="download-buttons-vertical">
          <a 
            href={APP_STORE_URL} 
            className="download-link ios" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <span className="icon">🍎</span>
            <div className="text">
              <span className="small">Download on the</span>
              <span className="large">App Store</span>
            </div>
          </a>
          <a 
            href={PLAY_STORE_URL} 
            className="download-link android" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <span className="icon">🤖</span>
            <div className="text">
              <span className="small">GET IT ON</span>
              <span className="large">Google Play</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default OnermLogLinksPage
