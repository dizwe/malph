import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lottie from 'lottie-react'
import splashIcon from '../assets/lottie/splash_icon.json'
import shareTextLogo from '../assets/share_text_logo.svg'
import './OnermLogLinksPage.css'

const OnermLogLinksPage: React.FC = () => {
  const location = useLocation();
  const APP_STORE_URL = 'https://apps.apple.com/app/id6755926206';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.malph.onerm_log';

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
    
    if (isMobile) {
      // 현재 URL의 쿼리 파라미터와 경로 추출
      // 예: /links/onerm_log/invite?code=DH3257 -> invite?code=DH3257
      const pathSegments = location.pathname.split('/links/onerm_log/').filter(Boolean);
      const subPath = pathSegments.length > 0 ? pathSegments[0] : '';
      const queryString = location.search;
      
      const deepLink = `onermlog://${subPath}${queryString}`;
      
      // 1. 딥링크 시도
      window.location.href = deepLink;

      // 2. 딥링크 실패 시 스토어 이동 (약간의 지연 후 실행)
      const timer = setTimeout(() => {
        if (/iphone|ipad|ipod/.test(userAgent)) {
          window.location.href = APP_STORE_URL;
        } else if (/android/.test(userAgent)) {
          window.location.href = PLAY_STORE_URL;
        }
      }, 1500); // 1.5초 대기

      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className="onerm-log-links-page">
      <div className="links-container">
        <div className="links-header">
          <div className="app-icon">
            <Lottie 
              animationData={splashIcon} 
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="sub-text">잠시만 기다려주세요<br />마켓으로 이동중!</div>
        </div>
        <div className="download-buttons-vertical">
          <a 
            href={APP_STORE_URL} 
            className="download-link ios" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {/* <span className="icon">🍎</span> */}
            <div className="text">
              <span className="large">앱스토어</span>
            </div>
          </a>
          <a 
            href={PLAY_STORE_URL} 
            className="download-link android" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {/* <span className="icon">🤖</span> */}
            <div className="text">
              <span className="large">플레이스토어</span>
            </div>
          </a>
        </div>
        <img src={shareTextLogo} alt="1RM LOG" className="logo-image" />
      </div>
    </div>
  )
}

export default OnermLogLinksPage
