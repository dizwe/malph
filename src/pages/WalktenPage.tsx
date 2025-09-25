import React from 'react'
import './WalktenPage.css'
import image1 from '../assets/walkten/image1.jpeg'
import image2 from '../assets/walkten/image2.jpeg'
import image3 from '../assets/walkten/image3.jpeg'
import image4 from '../assets/walkten/image4.jpeg'

const WalktenPage: React.FC = () => {
  return (
    <div className="walkten-page">
      <div className="container">
        <div className="page-header">
          <div className="app-icon">🚶‍♂️</div>
          <h1>밥먹고십분걷기</h1>
          <p className="app-subtitle">식후에 십분 걷는 건강한 습관을 만들어보세요!</p>
        </div>

        <section className="app-description">
          <div className="description-content">
            <h2>앱 소개</h2>
            <div className="description-text">
              <p>
                <strong>밥먹고십분걷기</strong>는 식후 산책 습관을 만들어주는 간단하고 효과적인 앱입니다.
              </p>
              <p>
                식사 후 바로 누워있거나 앉아있는 습관을 개선하고, 혈당 관리와 건강한 생활 패턴을 만들 수 있도록 도와드립니다.
              </p>
              
              <h3>✨ 주요 기능</h3>
              <ul className="feature-list">
                <li>
                  <span className="feature-icon">📊</span>
                  <strong>매일 기록</strong> - 매일의 식후 산책 기록을 한눈에 확인할 수 있어요
                </li>
                <li>
                  <span className="feature-icon">🏆</span>
                  <strong>성취감</strong> - 꾸준히 걸으며 쌓이는 작은 성취감을 느껴보세요
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="app-screenshots">
          <h2>앱 스크린샷</h2>
          <div className="screenshot-grid">
            <div className="screenshot-item">
              <img src={image1} alt="밥먹고십분걷기 앱 스크린샷 1" />
            </div>
            <div className="screenshot-item">
              <img src={image2} alt="밥먹고십분걷기 앱 스크린샷 2" />
            </div>
            <div className="screenshot-item">
              <img src={image3} alt="밥먹고십분걷기 앱 스크린샷 3" />
            </div>
            <div className="screenshot-item">
              <img src={image4} alt="밥먹고십분걷기 앱 스크린샷 4" />
            </div>
          </div>
        </section>

        <section className="download-section">
          <div className="download-content">
              <h2>지금 다운로드하세요!</h2>
              <p>
                <a
                  href="https://apps.apple.com/kr/app/%EB%B0%A5%EB%A8%B9%EA%B3%A0%EC%8B%AD%EB%B6%84%EA%B1%B7%EA%B8%B0/id6747921969"
                  className="appstore-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/ko-kr?size=250x83&amp;releaseDate=1709683200"
                    alt="Download on the App Store"
                    style={{ height: '40px' }}
                  />
                </a>
              </p>
              <div className="development-status">
                <span className="status-badge released">App Store 출시 완료</span>
              </div>
          </div>
        </section>

        <section className="contact-section">
          <div className="contact-content">
            <h2>문의 및 피드백</h2>
            <p>
              앱에 대한 문의사항이나 개선 아이디어가 있으시다면
              <br />
              언제든지 이메일로 연락해주세요!
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

export default WalktenPage
