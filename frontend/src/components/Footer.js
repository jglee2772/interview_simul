import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* [왼쪽] 로고 및 소개글 */}
        <div className="footer-left">
          <div className="footer-logo">Interview Master</div>
          <p className="footer-desc">
            AI 기반 면접 시뮬레이션으로<br />
            당신의 취업 성공을 지원합니다.
          </p>
        </div>

        {/* [오른쪽] 링크 및 저작권 */}
        <div className="footer-right">
            <div className="footer-company-name">(주)인심</div>
          
            <div className="footer-info-text">
                <p>대표 : 홍길동 &nbsp;|&nbsp; 소재지 : 인천 부평구 시장로 7 5층 &nbsp;|&nbsp; 상호 : (주)인심</p>
                <p>사업자 등록번호 : 123-45-67890 &nbsp;|&nbsp; 개인정보관리 책임자 : 윤이박강홍</p>
                <p className="contact-info">
                대표번호 : 02-1234-5786 &nbsp;|&nbsp; 이메일 : insim@inswim.com</p>
            </div>
          <p className="copyright">
            Copyright © 2025 Interview Master. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;