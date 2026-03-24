import React, { useState, useRef } from 'react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const passRef = useRef(null);

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
          --btn-black: #111827;
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

        .btn-submit {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: var(--radius-button);
          background: var(--btn-black);
          color: #ffffff;
          font-family: var(--font);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .google-btn {
          width: 100%;
          padding: 14px;
          background: #ffffff;
          border: 1.5px solid var(--input-border);
          border-radius: var(--radius-button);
          font-family: var(--font);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-heading);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 16px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .google-btn:hover {
          border-color: #D1D5DB;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .bottom-link {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .bottom-link a {
          color: var(--primary);
          font-weight: 600;
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
                  <path d="M12 2v20" /><path d="m4.93 19.07 14.14-14.14" /><path d="M2 12h20" /><path d="m4.93 4.93 14.14 14.14" />
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
              <p className="welcome-sub">
                Don't have an account? <a href="#">Create a new account now,</a> it's FREE! Takes less than a minute.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
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
              </div>

              <button type="submit" className="btn-submit">
                Login Now
              </button>
            </form>

            <button type="button" className="google-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Login with Google
            </button>

            <p className="bottom-link">
              Forgot password? <a href="#">Click here.</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
