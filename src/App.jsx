import React, { useEffect, useState, useCallback, Suspense, lazy, useMemo } from "react";
import { useAuth } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { loginSchema, signupSchema, calculatePasswordStrength } from './utils/validation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { BarChart3, Check, CheckCircle2, Eye, EyeOff, Lock, Mail, SendHorizontal, ShieldCheck, Sparkles, Video, Users, ChevronRight, Star, TrendingUp, ArrowRight, Shield, ChevronLeft } from 'lucide-react';
import './App.css';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MeetingDetailPage = lazy(() => import('./pages/MeetingDetailPage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const PreJoin = lazy(() => import('./components/Meeting/PreJoin'));
const MeetingRoom = lazy(() => import('./components/Meeting/MeetingRoom'));


const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";



export default function App() {
  const { user, loading, error, login, loginWithToken, signup, logout, setError } = useAuth();
  
  const navigate = useNavigate();

  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    control: loginControl,
    formState: { errors: loginErrors },
    reset: resetLogin
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false }
  });

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    control: signupControl,
    formState: { errors: signupErrors },
    reset: resetSignup
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '', jobTitle: '', department: '', terms: false }
  });

  const watchedPassword = useWatch({ control: signupControl, name: 'password' });
  const loginEmailValue = useWatch({ control: loginControl, name: 'email' });
  const loginPasswordValue = useWatch({ control: loginControl, name: 'password' });
  const pwdStrength = useMemo(
    () => (watchedPassword ? calculatePasswordStrength(watchedPassword) : { score: 0, label: 'Weak', color: '#ef4444' }),
    [watchedPassword]
  );
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Inject auth fonts for login/signup screens
  useEffect(() => {
    if (!document.getElementById('auth-fonts')) {
      const fontLink = document.createElement("link");
      fontLink.id = "auth-fonts";
      fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@500;600;700;800&display=swap";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
  }, []);

  const go = useCallback((path) => {
    navigate(path);
  }, [navigate]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const errParam = urlParams.get('error');
    
    if (tokenParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
      loginWithToken(tokenParam).then(() => {
        go("/dashboard");
      });
    } else if (errParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setError("Google Authentication failed. Please try again.");
    }
  }, [loginWithToken, go, setError]);


  const onLoginSubmit = async (data) => {
    setLoginLoading(true);
    setLoginSuccess(false);
    setError(null);
    const result = await login(data.email, data.password, data.remember);
    if (result.success) {
      setLoginLoading(false);
      setLoginSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 420));
      resetLogin();
      go("/dashboard");
      return;
    }
    setLoginLoading(false);
  };

  const onSignupSubmit = async (data) => {
    setSignupLoading(true);
    setError(null);
    const result = await signup(data.name, data.email, data.password, data.jobTitle, data.department);
    if (result.success) {
      resetSignup();
      go("/dashboard");
    }
    setSignupLoading(false);
  };

  const tryGoogleAuth = async () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const routeFallback = (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
    </div>
  );

  return (
    <Suspense fallback={routeFallback}>
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" /> : (
          <AuthScreen
            mode="login"
            error={error}
            loginLoading={loginLoading}
            signupLoading={signupLoading}
            handleSubmitLogin={handleSubmitLogin}
            onLoginSubmit={onLoginSubmit}
            registerLogin={registerLogin}
            loginErrors={loginErrors}
            loginEmailValue={loginEmailValue}
            loginPasswordValue={loginPasswordValue}
            loginSuccess={loginSuccess}
            tryGoogleAuth={tryGoogleAuth}
            handleSubmitSignup={handleSubmitSignup}
            onSignupSubmit={onSignupSubmit}
            registerSignup={registerSignup}
            signupErrors={signupErrors}
            watchedPassword={watchedPassword}
            pwdStrength={pwdStrength}
            go={go}
          />
        )
      } />
      <Route path="/signup" element={
        user ? <Navigate to="/dashboard" /> : (
          <AuthScreen
            mode="signup"
            error={error}
            loginLoading={loginLoading}
            signupLoading={signupLoading}
            handleSubmitLogin={handleSubmitLogin}
            onLoginSubmit={onLoginSubmit}
            registerLogin={registerLogin}
            loginErrors={loginErrors}
            tryGoogleAuth={tryGoogleAuth}
            handleSubmitSignup={handleSubmitSignup}
            onSignupSubmit={onSignupSubmit}
            registerSignup={registerSignup}
            signupErrors={signupErrors}
            watchedPassword={watchedPassword}
            pwdStrength={pwdStrength}
            go={go}
          />
        )
      } />
      <Route path="/dashboard" element={
        user ? (
          <AppDataProvider>
            <Dashboard user={user} handleSignOut={() => { logout(); go("/login"); }} />
          </AppDataProvider>
        ) : <Navigate to="/login" />
      } />
      <Route path="/meetings/:id" element={
        user ? (
          <AppDataProvider>
            <MeetingDetailPage />
          </AppDataProvider>
        ) : <Navigate to="/login" />
      } />
      <Route path="/tasks/:id" element={
        user ? (
          <AppDataProvider>
            <TaskDetailPage />
          </AppDataProvider>
        ) : <Navigate to="/login" />
      } />
      <Route path="/join/:roomId" element={<PreJoin />} />
      <Route path="/room/:roomId" element={<MeetingRoom />} />
    </Routes>
    </Suspense>
  );
}

// Extract AuthScreen to keep it clean
const AuthScreen = ({ 
  mode, error, loginLoading, signupLoading, 
  handleSubmitLogin, onLoginSubmit, registerLogin, loginErrors, loginEmailValue, loginPasswordValue, loginSuccess, tryGoogleAuth,
  handleSubmitSignup, onSignupSubmit, registerSignup, signupErrors, watchedPassword, pwdStrength, go
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState("Ask your Copilot...");

  const emailValue = String(loginEmailValue || '').trim();
  const passwordValue = String(loginPasswordValue || '').trim();
  const isEmailValid = emailValue.length > 3 && !loginErrors?.email;
  const isPasswordValid = passwordValue.length >= 6 && !loginErrors?.password;

  useEffect(() => {
    const prompts = ["Ask your Copilot...", "Summarize my meetings...", "What tasks are due?"];
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timerId = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const phrase = prompts[phraseIndex];
      const delay = deleting ? 45 : 95;

      setCopilotPrompt(phrase.slice(0, charIndex));

      if (!deleting) {
        if (charIndex < phrase.length) {
          charIndex += 1;
          timerId = window.setTimeout(step, delay);
        } else {
          deleting = true;
          timerId = window.setTimeout(step, 1000);
        }
      } else if (charIndex > 0) {
        charIndex -= 1;
        timerId = window.setTimeout(step, delay);
      } else {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % prompts.length;
        timerId = window.setTimeout(step, 320);
      }
    };

    timerId = window.setTimeout(step, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  return (
    <div className="auth-centered-layout">
      {/* BACKGROUND EFFECTS */}
      <div className="auth-bg-blobs">
        <div className="auth-bg-blob auth-blob-blue" />
        <div className="auth-bg-blob auth-blob-purple" />
        <div className="auth-bg-blob auth-blob-cyan" />
      </div>

      <div className="auth-content-container">
        <div className="auth-form-wrapper">
          <div className="auth-form-header stagger-form-1">
            <h2 className="auth-form-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <div className="auth-title-underline" />
            <p className="auth-form-subtitle">
              {mode === 'login' ? 'Sign in to your Clarix workspace' : 'Join us to organize your Clarix workspace'}
            </p>
          </div>
          


          {error && (
            <div className="auth-error-banner stagger-form-3" role="alert">
              <span className="auth-error-mark">!</span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="auth-form">
                <div className="auth-field-group stagger-form-3">
                  <div className={`auth-input-shell auth-input-floating ${emailValue ? 'has-value' : ''} ${loginErrors.email ? 'is-invalid' : ''} ${isEmailValid ? 'is-valid' : ''}`}>
                    <span className="auth-input-icon"><Mail size={17} /></span>
                    <span className="auth-input-divider" />
                    <div className="auth-input-content">
                      <input type="email" {...registerLogin('email')} className="auth-input" />
                      <label>Email address</label>
                    </div>
                  </div>
                  {loginErrors.email && <p className="auth-field-error">{loginErrors.email.message}</p>}
                </div>

                <div className="auth-field-group stagger-form-4">
                  <div className={`auth-input-shell auth-input-floating ${passwordValue ? 'has-value' : ''} ${loginErrors.password ? 'is-invalid' : ''} ${isPasswordValid ? 'is-valid' : ''}`}>
                    <span className="auth-input-icon"><Lock size={17} /></span>
                    <span className="auth-input-divider" />
                    <div className="auth-input-content">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerLogin('password')}
                        className="auth-input"
                      />
                      <label>Password</label>
                    </div>
                    <button
                      type="button"
                      className="auth-toggle-pass"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  
                  {passwordValue && (
                    <div className="auth-login-pwd-strength">
                      <div className="auth-pwd-segments">
                        <div className={`auth-pwd-segment ${pwdStrength.score >= 1 ? pwdStrength.label.toLowerCase() : ''}`} />
                        <div className={`auth-pwd-segment ${pwdStrength.score >= 2 ? pwdStrength.label.toLowerCase() : ''}`} />
                        <div className={`auth-pwd-segment ${pwdStrength.score >= 3 ? pwdStrength.label.toLowerCase() : ''}`} />
                        <div className={`auth-pwd-segment ${pwdStrength.score >= 4 ? pwdStrength.label.toLowerCase() : ''}`} />
                      </div>
                      <span className={`auth-pwd-label ${pwdStrength.label.toLowerCase()}`}>{pwdStrength.label}</span>
                    </div>
                  )}

                  {loginErrors.password && <p className="auth-field-error">{loginErrors.password.message}</p>}
                </div>

                <div className="auth-meta-row stagger-form-5">
                  <label className="auth-remember-wrap">
                    <input type="checkbox" {...registerLogin('remember')} className="auth-check-input" />
                    <span className="auth-check-box"><Check size={12} /></span>
                    <span className="auth-remember-text">Remember me</span>
                  </label>
                  <a href="#" className="auth-forgot-link">Forgot password?</a>
                </div>

                <button type="submit" disabled={loginLoading || loginSuccess} className="auth-signin-btn stagger-form-6">
                  {loginLoading ? (
                    <span className="auth-btn-loader" />
                  ) : loginSuccess ? (
                    <CheckCircle2 size={18} className="auth-btn-success" />
                  ) : (
                    <>Sign In <ArrowRight size={15} className="auth-btn-arrow" /><div className="auth-btn-shimmer" /></>
                  )}
                </button>
              </form>

              <div className="auth-divider stagger-form-7">
                <span>OR CONTINUE WITH</span>
              </div>

              <button className="auth-google-btn stagger-form-8" onClick={tryGoogleAuth}>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <div className="auth-bottom-links stagger-form-9">
                <p className="auth-bottom-link">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => go('/signup')} className="auth-link-btn">Create one</button>
                </p>
                <button type="button" onClick={() => go('/dashboard')} className="auth-guest-link">Continue as guest</button>
              </div>
            </>
          ) : (
            <div className="auth-signup-wrap stagger-form-3">
              <div className="auth-form-divider" />
              <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="auth-form auth-signup-form">
                <div className="auth-signup-grid">
                  <input type="text" placeholder="Full Name" {...registerSignup('name')} className="auth-signup-input" />
                  <input type="email" placeholder="Email" {...registerSignup('email')} className="auth-signup-input" />
                  <input type="text" placeholder="Job Title" {...registerSignup('jobTitle')} className="auth-signup-input" />
                  <input type="text" placeholder="Department" {...registerSignup('department')} className="auth-signup-input" />
                  <input type="password" placeholder="Password" {...registerSignup('password')} className="auth-signup-input" />
                  <input type="password" placeholder="Confirm Password" {...registerSignup('confirm')} className="auth-signup-input" />
                </div>
                {watchedPassword && (
                  <div className="auth-login-pwd-strength">
                    <div className="auth-pwd-segments">
                      <div className={`auth-pwd-segment ${pwdStrength.score >= 1 ? pwdStrength.label.toLowerCase() : ''}`} />
                      <div className={`auth-pwd-segment ${pwdStrength.score >= 2 ? pwdStrength.label.toLowerCase() : ''}`} />
                      <div className={`auth-pwd-segment ${pwdStrength.score >= 3 ? pwdStrength.label.toLowerCase() : ''}`} />
                      <div className={`auth-pwd-segment ${pwdStrength.score >= 4 ? pwdStrength.label.toLowerCase() : ''}`} />
                    </div>
                    <span className={`auth-pwd-label ${pwdStrength.label.toLowerCase()}`}>{pwdStrength.label}</span>
                  </div>
                )}
                {(signupErrors.name || signupErrors.email || signupErrors.password || signupErrors.confirm || signupErrors.jobTitle || signupErrors.department) && (
                  <p className="auth-field-error">
                    {signupErrors.name?.message || signupErrors.email?.message || signupErrors.password?.message || signupErrors.confirm?.message || signupErrors.jobTitle?.message || signupErrors.department?.message}
                  </p>
                )}
                <button type="submit" className="auth-signin-btn" disabled={signupLoading}>
                  {signupLoading ? <span className="auth-btn-loader" /> : 'Create Account'}
                </button>
                <div className="auth-bottom-links">
                  <p className="auth-bottom-link">
                    Already have an account?{' '}
                    <button type="button" onClick={() => go('/login')} className="auth-link-btn">Sign in</button>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
