import React, { useEffect, useState } from 'react'
import './OnermLogPage.css'

const OnermLogPage: React.FC = () => {
  const [device, setDevice] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDevice('ios');
    } else if (/android/.test(userAgent)) {
      setDevice('android');
    }
  }, []);

  const handleDownload = () => {
    const APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_APP_ID'; // 실제 ID로 수정 필요
    const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME'; // 실제 패키지명으로 수정 필요

    if (device === 'ios') {
      window.location.href = APP_STORE_URL;
    } else if (device === 'android') {
      window.location.href = PLAY_STORE_URL;
    } else {
      alert('모바일 기기에서 접속하시면 앱을 설치하실 수 있습니다!');
    }
  };

  return (
    <div className="onerm-log-page">
      <div className="container">
        <div className="page-header">
          <div className="app-icon">💪</div>
          <h1>oneRM Log</h1>
          <p className="app-subtitle">운동하는 사람을 위한 1RM 기록 관리 앱</p>
        </div>

        <section className="app-description">
          <div className="description-content">
            <h2>앱 소개</h2>
            <div className="description-text">
              <p>
                <strong>onerm Log</strong>는 1RM(최대 1회 반복 무게) 기록을 기반으로 자신의 운동 능력을 계산하고, 성장 과정을 시각적으로 확인할 수 있는 앱입니다.
              </p>
              <p>
                다양한 운동 종목별로 1RM을 자동 계산해주고, 기록을 쉽고 맛깔나게 관리할 수 있도록 도와줍니다. 운동 목표 설정, 그래프, 기록 히스토리 등 운동하는 사람에게 꼭 필요한 기능만 담았습니다.
              </p>
              <p>
                자신의 운동 데이터를 한눈에 확인하고, 꾸준한 성장의 동기를 얻어보세요!
              </p>
              <h3>✨ 주요 기능</h3>
              <ul className="feature-list">
                <li>
                  <span className="feature-icon">📝</span>
                  <strong>1RM 자동 계산</strong> - 다양한 운동 종목별로 1RM을 자동으로 계산해줍니다.
                </li>
                <li>
                  <span className="feature-icon">📈</span>
                  <strong>성장 그래프</strong> - 기록한 데이터를 바탕으로 성장 과정을 시각적으로 확인할 수 있습니다.
                </li>
                <li>
                  <span className="feature-icon">🎯</span>
                  <strong>운동 목표 설정</strong> - 나만의 목표를 설정하고 달성 과정을 관리할 수 있습니다.
                </li>
                <li>
                  <span className="feature-icon">📅</span>
                  <strong>기록 히스토리</strong> - 운동 기록을 쉽고 맛깔나게 관리할 수 있습니다.
                </li>
                <li>
                  <span className="feature-icon">🔔</span>
                  <strong>알림 기능</strong> - 목표 달성 및 기록 업데이트 시 알림을 받을 수 있습니다.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="app-screenshots">
          <h2>앱 스크린샷</h2>
          <div className="screenshot-grid">
            <div className="screenshot-item">
              <div className="no-screenshot">앱 스크린샷은 출시 후 제공될 예정입니다.</div>
            </div>
          </div>
        </section>

        <section className="download-section">
          <div className="download-content">
              <h2>지금 바로 시작해보세요!</h2>
              <p>
                앱을 설치하고 자신의 성장을 기록하세요.
              </p>
              <div className="download-buttons">
                <button className="download-btn main-btn" onClick={handleDownload}>
                  {device === 'ios' ? 'App Store에서 다운로드' : 
                   device === 'android' ? 'Play Store에서 다운로드' : 
                   '앱 다운로드 하기'}
                </button>
              </div>
          </div>
        </section>

        <section className="contact-section">
          <div className="contact-content">
            <h2>문의 및 피드백</h2>
            <p>
              앱에 대한 문의사항이나 개선 아이디어가 있으시다면 언제든지 이메일로 연락해주세요!
            </p>
            <div className="contact-info">
              <a href="mailto:contact@malph.app" className="contact-email">
                📧 contact@malph.app
              </a>
            </div>
            <p className="contact-note">
              여러분의 소중한 의견을 기다리고 있습니다. 🙏
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default OnermLogPage
