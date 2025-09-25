import React from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="main-title">
              일상에서 영감을 받아,
              <br />
              <span className="highlight">둘이서</span> 앱을 만듭니다! ✨
            </h1>
            <p className="subtitle">
              <b>malph</b>는 디자인과 기획을 맡은 <b>malcolm</b>, 개발을 맡은 <b>ralph</b>가
              <br />
              일상에서 도움이 될만한 아이디어를 찾아 직접 앱으로 만들어가는 작은 회사입니다.
            </p>
            <div className="cta-buttons">
              <button className="cta-primary" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}>프로젝트 보기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="about">
        <div className="container">
          <h2>About malph</h2>
          <div className="about-content">
            <div className="about-text">
                <h3>🧑‍🤝‍🧑 둘이서 만드는 앱</h3>
              <p>
                디자인과 기획은 malcolm, 개발은 ralph가 맡아
                <br />
                일상에서 직접 겪는 불편함이나 필요를 앱으로 해결합니다.
              </p>
                <h3>💡 일상에서 영감 얻기</h3>
              <p>
                "이런 게 있으면 더 편리하지 않을까?"라는 생각에서 시작해
                <br />
                직접 써보고 싶은 앱을 만듭니다.
              </p>
              <h3>💬 소통하며 성장하기</h3>
              <p>
                사용자와 소통하며, 피드백을 반영해
                <br />
                더 나은 경험을 만들어갑니다.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat">
                <div className="stat-number">👨‍💻 + 🎨</div>
                <div className="stat-label">malcolm & ralph</div>
              </div>
              <div className="stat">
                <div className="stat-number">contact@malph.app</div>
                <div className="stat-label">이메일 문의</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="projects">
        <div className="container">
          <h2>malph의 앱</h2>
          <div className="project-intro">
            <p>
              일상에서 직접 필요하다고 느낀 것들을 앱으로 만들어갑니다.
            </p>
          </div>
          <div className="project-grid">
            <Link to="/onerm_log" className="project-card featured" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="project-icon">🏋️</div>
              <h3>onerm Log</h3>
              <p>
                <b>onerm Log</b>는 1RM(최대 1회 반복 무게) 기록을 기반으로
                <br />
                자신의 운동 능력을 계산하고, 성장 과정을 시각적으로 확인할 수 있는 앱입니다.
                <br />
                다양한 운동 종목별로 1RM을 자동 계산해주고,
                <br />
                기록을 쉽고 맛깔나게 관리할 수 있도록 도와줍니다.
                <br />
                운동 목표 설정, 그래프, 기록 히스토리 등
                <br />
                운동하는 사람에게 꼭 필요한 기능만 담았습니다.
              </p>
              <div className="project-tags">
                <span className="tag">운동</span>
                <span className="tag">기록</span>
                <span className="tag">React Native</span>
              </div>
            </Link>
            <div className="project-card coming-soon">
              <div className="project-icon">💡</div>
              <h3>다음 아이디어</h3>
              <p>
                새로운 일상 속 불편함을 발견하면,
                <br />
                또 하나의 앱이 탄생할지도 몰라요!
              </p>
              <div className="project-status">
                <span className="status-badge thinking">구상중</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact">
        <div className="container">
          <div className="contact-content">
            <h2>함께 만들어요! 🤝</h2>
            <p>
              좋은 아이디어가 있거나, 협업을 원하신다면
              <br />
              언제든지 이메일로 연락해주세요!
            </p>
            <div className="contact-methods">
              <a href="mailto:contact@malph.app" className="contact-btn">
                📧 contact@malph.app
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
