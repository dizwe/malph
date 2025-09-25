import React from 'react'
import './PolicyPage.css'

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-header">
          <h1>개인정보처리방침</h1>
          <p className="last-updated">최종 업데이트: 2025년 8월 3일</p>
        </div>
        
        <div className="policy-content">
          <section className="policy-section">
            <h2>1. 개인정보 수집 및 이용목적</h2>
            <p>
              malph("회사" 또는 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다:
            </p>
            <ul>
              <li>서비스 제공 및 계약의 이행</li>
              <li>회원 관리 및 본인확인</li>
              <li>고객 문의 및 불만 처리</li>
              <li>서비스 개선 및 새로운 서비스 개발</li>
              <li>마케팅 및 광고에의 활용</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>2. 수집하는 개인정보의 항목</h2>
            <div className="info-table">
              <h3>필수 수집 정보</h3>
              <ul>
                <li>이메일 주소</li>
                <li>서비스 이용 기록</li>
                <li>접속 로그, 쿠키, 접속 IP 정보</li>
              </ul>
              
              <h3>선택 수집 정보</h3>
              <ul>
                {/* <li>닉네임</li>
                <li>프로필 사진</li>
                <li>관심사 및 선호도</li> */}
              </ul>
            </div>
          </section>

          <section className="policy-section">
            <h2>3. 개인정보의 처리 및 보유기간</h2>
            <p>
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 
              수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul>
              <li>회원 탈퇴시까지 (단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간)</li>
              <li>부정 이용 방지를 위한 정보: 1년</li>
              <li>서비스 이용 기록: 3개월</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 
              다만, 아래의 경우에는 예외로 합니다:
            </p>
            <ul>
              <li>정보주체가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. 개인정보처리의 위탁</h2>
            <p>
              회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
            </p>
            <div className="delegation-table">
              <table>
                <thead>
                  <tr>
                    <th>위탁받는 자</th>
                    <th>위탁하는 업무의 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Cloud Platform</td>
                    <td>클라우드 인프라 운영</td>
                  </tr>
                  <tr>
                    <td>Google Analytics</td>
                    <td>웹사이트 방문자 분석</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="policy-section">
            <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
            <p>
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
            </p>
            <ul>
              <li>개인정보 처리현황 통지 요구</li>
              <li>개인정보 처리정지 요구</li>
              <li>개인정보 수정·삭제 요구</li>
              <li>개인정보 처리현황 통지 요구</li>
            </ul>
            <p>
              권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 
              모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
            </p>
          </section>

          <section className="policy-section">
            <h2>7. 개인정보의 안전성 확보조치</h2>
            <p>
              회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:
            </p>
            <ul>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보에 대한 접근 제한</li>
              <li>개인정보를 저장하는 데이터베이스 시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제</li>
              <li>해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>8. 개인정보보호책임자</h2>
            <div className="contact-info">
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 
                정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.
              </p>
              <div className="responsible-person">
                <h4>개인정보보호책임자</h4>
                <ul>
                  <li>이메일: contact@malph.app</li>
                  <li>연락처: 문의 양식을 통해 연락 바랍니다</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>9. 개인정보처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 
              추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 
              통하여 고지할 것입니다.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. 개인정보의 열람청구</h2>
            <p>
              정보주체는 개인정보보호법 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다. 
              회사는 정보주체의 개인정보 열람청구가 신속하게 처리되도록 노력하겠습니다.
            </p>
            <div className="contact-department">
              <h4>개인정보 열람청구 접수·처리 부서</h4>
              <ul>
                <li>부서명: 개발팀</li>
                  <li>이메일: contact@malph.app</li>
              </ul>
            </div>
          </section>

          <div className="policy-footer">
            <p>
              개인정보보호와 관련하여 궁금한 사항이 있으시면 언제든지 연락해 주시기 바랍니다.
            </p>
            <div className="contact-buttons">
              <a href="mailto:contact@malph.app" className="contact-btn">
                📧 문의하기
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
