import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from './contexts/AuthContext';
import { loginSchema, signupSchema, calculatePasswordStrength } from './utils/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PreJoin from './components/Meeting/PreJoin';
import MeetingRoom from './components/Meeting/MeetingRoom';


const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";



export default function App() {
  const { user, loading, error, login, loginWithToken, signup, logout, setError } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const navigate = useNavigate();
  const location = useLocation();

  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLogin
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false }
  });

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    watch: watchSignup,
    formState: { errors: signupErrors },
    reset: resetSignup
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '', jobTitle: '', department: '', terms: false }
  });

  const watchedPassword = watchSignup('password');
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: 'Weak', color: '#ef4444' });

  useEffect(() => {
    if (watchedPassword) {
      setPwdStrength(calculatePasswordStrength(watchedPassword));
    } else {
      setPwdStrength({ score: 0, label: 'Weak', color: '#ef4444' });
    }
  }, [watchedPassword]);

  useEffect(() => {
    if (location.pathname === "/signup") setMode("signup");
    if (location.pathname === "/login" || location.pathname === "/") setMode("login");
  }, [location.pathname]);


  // Inject Google Sans for Auth screens
  useEffect(() => {
    if (!document.getElementById('google-sans-auth')) {
      const fontLink = document.createElement("link");
      fontLink.id = "google-sans-auth";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&display=swap";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    setMounted(true);
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
    setError(null);
    const result = await login(data.email, data.password, data.remember);
    if (result.success) {
      resetLogin();
      go("/dashboard");
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
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to="/dashboard" /> : (
          <AuthScreen 
            mode={mode} 
            setMode={setMode} 
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
      <Route path="/login" element={<Navigate to="/" />} />
      <Route path="/signup" element={<Navigate to="/" />} />
      <Route path="/dashboard" element={
        user ? <Dashboard user={user} handleSignOut={() => { logout(); go("/"); }} /> : <Navigate to="/" />
      } />
      <Route path="/join/:roomId" element={<PreJoin />} />
      <Route path="/room/:roomId" element={<MeetingRoom />} />
    </Routes>
  );
}

// Extract AuthScreen to keep it clean
const AuthScreen = ({ 
  mode, setMode, error, loginLoading, signupLoading, 
  handleSubmitLogin, onLoginSubmit, registerLogin, loginErrors, tryGoogleAuth,
  handleSubmitSignup, onSignupSubmit, registerSignup, signupErrors, watchedPassword, pwdStrength, go
}) => {
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };
  const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
         style={{ background: "linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)", fontFamily: "'Google Sans', sans-serif" }}>
      
      {/* Background Decor */}
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-20" />
      <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 70, ease: 'linear' }}
        className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
      
      {/* Global Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
             className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3">
             <span className="font-bold">⚠</span>
             <span className="text-[13px] font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[440px] px-6"
      >
        <div className="backdrop-blur-xl bg-white/80 border border-white/50 rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5">
          
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-blue-600 to-indigo-600">
              <span className="text-white text-xl font-bold">S</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div key="login" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back</h1>
                  <p className="text-[13px] text-slate-500 mt-2">Sign in to your intelligent workspace.</p>
                </div>

                <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                  <div>
                    <input type="email" placeholder="Email address" {...registerLogin('email')}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${loginErrors.email ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                    {loginErrors.email && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {loginErrors.email.message}</p>}
                  </div>
                  
                  <div>
                    <input type="password" placeholder="Password" {...registerLogin('password')}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${loginErrors.password ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                    {loginErrors.password && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {loginErrors.password.message}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-1 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" {...registerLogin('remember')} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-[12px] text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                    </label>
                    <a href="#" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                  </div>

                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={loginLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl text-[13px] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center">
                    {loginLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign In"}
                  </motion.button>
                </form>

                <div className="mt-6 flex items-center gap-4">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">or continue with</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={tryGoogleAuth}
                  className="w-full mt-6 bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-xl text-[13px] shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </motion.button>

                <p className="text-center mt-8 text-[13px] text-slate-500">
                  Don't have an account? <button onClick={() => go("/signup")} className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">Create one</button>
                </p>
              </motion.div>
            ) : (
              <motion.div key="signup" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create account</h1>
                  <p className="text-[13px] text-slate-500 mt-2">Join us to organize your intelligent workspace.</p>
                </div>

                <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
                  <div>
                    <input type="text" placeholder="Full Name" {...registerSignup('name')}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${signupErrors.name ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                    {signupErrors.name && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {signupErrors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input type="text" placeholder="Job Title" {...registerSignup('jobTitle')}
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${signupErrors.jobTitle ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                      {signupErrors.jobTitle && <p className="text-red-500 text-[11px] mt-1.5 ml-1">⚠ {signupErrors.jobTitle.message}</p>}
                    </div>
                    <div>
                      <input type="text" placeholder="Department" {...registerSignup('department')}
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${signupErrors.department ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                      {signupErrors.department && <p className="text-red-500 text-[11px] mt-1.5 ml-1">⚠ {signupErrors.department.message}</p>}
                    </div>
                  </div>

                  <div>
                    <input type="email" placeholder="Email address" {...registerSignup('email')}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${signupErrors.email ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                    {signupErrors.email && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {signupErrors.email.message}</p>}
                  </div>
                  
                  <div>
                    <input type="password" placeholder="Password" {...registerSignup('password')}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${signupErrors.password ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                    {signupErrors.password && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {signupErrors.password.message}</p>}
                    {watchedPassword && (
                      <div className="mt-2.5 px-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                            className="h-full rounded-full transition-colors duration-300" style={{ backgroundColor: pwdStrength.color }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium text-right" style={{ color: pwdStrength.color }}>
                          {pwdStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <input type="password" placeholder="Confirm Password" {...registerSignup('confirm')}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${signupErrors.confirm ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} />
                    {signupErrors.confirm && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {signupErrors.confirm.message}</p>}
                  </div>

                  <div className="pt-1 pb-2">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input type="checkbox" {...registerSignup('terms')} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-[12px] text-slate-500 leading-snug group-hover:text-slate-700 transition-colors">
                        I agree to the <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">Privacy Policy</a>
                      </span>
                    </label>
                    {signupErrors.terms && <p className="text-red-500 text-[11px] mt-1.5 ml-1 flex items-center gap-1">⚠ {signupErrors.terms.message}</p>}
                  </div>

                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={signupLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl text-[13px] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center">
                    {signupLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Account"}
                  </motion.button>
                </form>

                <p className="text-center mt-8 text-[13px] text-slate-500">
                  Already have an account? <button onClick={() => go("/login")} className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">Sign in</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}