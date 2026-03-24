import React, { useState, useRef } from 'react';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const confirmPassRef = useRef(null);

  return (
    <>
      <style>{`
        :root {
          --primary: #2B35E8;
          --primary-glow: rgba(43,53,232,0.12);
          --text-heading: #111827;
          --text-body: #111827;
          --text-muted: #6B7280;
          --text-placeholder: #9CA3AF;
          --bg-left-start: #2B35E8;
          --bg-left-end: #1E1FC4;
          --bg-right: #FFFFFF;
          --input-bg: #FFFFFF;
          --input-border: #E5E7EB;
          --input-focus-border: #2B35E8;
          --radius-input: 8px;
          --radius-button: 8px;
          --font: 'Google Sans', sans-serif;
          --font-display: 'Google Sans Display', sans-serif;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          height: 100%;
          font-family: var(--font);
          background: var(--bg-left-start);
        }

        .auth-container {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          height: 100vh;
          overflow: hidden;
        }

        /* --- Left Panel --- */
        .auth-left {
          background: linear-gradient(135deg, var(--bg-left-start) 0%, var(--bg-left-end) 100%);
          padding: 48px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .diag-lines {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .diag-line {
          position: absolute;
          height: 1px;
          width: 160%;
          background: rgba(255, 255, 255, 0.07);
          transform: rotate(-30deg);
          left: -30%;
        }

        .left-content {
          position: relative;
          z-index: 1;
        }

        .hero-block {
          max-width: 420px;
        }

        /* Left Panel icon, headline, subtitle */
        .hero-icon {
          color: #ffffff;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeUp 0.55s 0.1s ease forwards;
        }

        .hero-h1 {
          font-family: var(--font-display);
          font-size: 52px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
          opacity: 0;
          animation: fadeUp 0.55s 0.25s ease forwards;
        }

        .hero-sub {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.75);
          margin-top: 16px;
          max-width: 340px;
          opacity: 0;
          animation: fadeUp 0.55s 0.4s ease forwards;
        }

        /* --- Right Panel --- */
        .auth-right {
          background: var(--bg-right);
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          position: relative;
          z-index: 5;
        }

        .auth-right-inner {
          position: relative;
          max-width: 380px;
          margin: 0 auto;
          width: 100%;
          opacity: 0;
          animation: slideInRight 0.6s 0.2s ease forwards;
        }

        .right-brand {
          position: absolute;
          top: 60px;
          left: 60px;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--text-heading);
          z-index: 10;
        }

        .form-header {
          margin-bottom: 24px;
        }

        .welcome-title {
          font-family: var(--font-display);
          font-size: 30px;
          font-weight: 700;
          color: var(--text-heading);
          margin-bottom: 6px;
        }

        .welcome-sub {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .welcome-sub a {
          color: var(--primary);
          text-decoration: underline;
        }

        .input-group {
          margin-bottom: 16px;
          position: relative;
        }

        .auth-field {
          width: 100%;
          padding: 13px 16px;
          background: var(--input-bg);
          border: 1.5px solid var(--input-border);
          border-radius: var(--radius-input);
          font-family: var(--font);
          font-size: 14px;
          color: var(--text-heading);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .auth-field::placeholder {
          color: var(--text-placeholder);
        }

        .auth-field:focus {
          border-color: var(--input-focus-border);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-placeholder);
          padding: 4px;
        }

        /* Signup Specific Button */
        .btn-submit {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: var(--radius-button);
          background: var(--primary);
          color: #ffffff;
          font-family: var(--font);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 4px 12px rgba(43,53,232,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(43,53,232,0.4);
        }

        .bottom-link {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .bottom-link a {
          color: var(--primary);
          text-decoration: underline;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 860px) {
          .auth-container {
            grid-template-columns: 1fr;
          }
          .auth-left {
            display: none;
          }
          .auth-right {
            padding: 40px 28px;
          }
          .auth-right-inner {
            max-width: 440px;
            margin: 0 auto;
          }
          .right-brand {
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div className="auth-container">
        
        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="diag-lines">
            <div className="diag-line" style={{ top: '-10%' }} />
            <div className="diag-line" style={{ top: '15%' }} />
            <div className="diag-line" style={{ top: '40%' }} />
            <div className="diag-line" style={{ top: '65%' }} />
            <div className="diag-line" style={{ top: '90%' }} />
          </div>
          
          <div className="left-content">
            <div className="hero-block">
              <div className="hero-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"/><path d="m4.93 19.07 14.14-14.14"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/>
                </svg>
              </div>
              <h1 className="hero-h1">
                Hello<br />
                Clarix 👋
              </h1>
              <p className="hero-sub">
                Clarix brings AI powered meeting intelligence, seamless collaboration, and smart task tracking into one elegant workspace.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (MOBILE BRAND SHOWN HERE TOO) */}
        <div className="right-brand">Clarix</div>
        
        <div className="auth-right">
          <div className="auth-right-inner">
            <div className="form-header">
              <h2 className="welcome-title">Create Your Account</h2>
              <p className="welcome-sub">
                Already have an account? <a href="#">Sign in here.</a>
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="input-group">
                <input
                  ref={nameRef}
                  type="text"
                  className="auth-field"
                  placeholder="Full name"
                />
              </div>
              
              <div className="input-group">
                <input
                  ref={emailRef}
                  type="email"
                  className="auth-field"
                  placeholder="Email address"
                />
              </div>

              <div className="input-group">
                <input
                  ref={passRef}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-field"
                  placeholder="Password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

              <div className="input-group">
                <input
                  ref={confirmPassRef}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-field"
                  placeholder="Confirm password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

              <button type="submit" className="btn-submit">
                Create Account
              </button>
            </form>

            <p className="bottom-link">
              By creating an account you agree to our <br/>
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
