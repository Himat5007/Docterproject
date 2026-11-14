import React, { useState } from 'react';
import axios from 'axios';

export default function LoginPage({ setToken }) {
  const [isLogin, setIsLogin] = useState(true); // 🚨 نوی سټیټ: د لاګین او راجستر ترمنځ د بدلون لپاره
  const [name, setName] = useState(''); // 🚨 نوی سټیټ: د راجستر لپاره نوم
  const [username, setUsername] = useState(''); // دلته یوزرنیم یا موبایل نمبر راځي
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Admin');
  
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // === د لاګین منطق ===
        const res = await axios.post('https://docterproject-backend.onrender.com/api/auth/login', { 
          username, 
          password,
          department
        });
        
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        window.location.reload();
      } else {
        // === د راجستر منطق ===
        await axios.post('http://localhost:5000/api/auth/register', { 
          name: name, 
          phone: username, // د راجستر پر مهال یوزرنیم د موبایل نمبر په توګه کار کیږي
          password 
        });
        
        setSuccessMsg('✅ په بریالیتوب سره راجستر شو! د اډمین د تایید وروسته به وتوانئ ننوځئ.');
        setName('');
        setUsername('');
        setPassword('');
        setIsLogin(true); // بیرته لاګین ته ځو
      }
    } catch (err) {
      setError(err.response?.data?.message || 'د معلوماتو لیږلو په وخت کې خطا راغله!');
    } finally {
      setBusy(false);
    }
  }

  // د لاګین او راجستر ترمنځ د بدلون فعالیت
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMsg(null);
    setName('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        
        {/* ═══ کیڼ اړخ: د انستیتیوت عکس ═══ */}
        <div className="auth-left">
          <div className="logo-area">
            <span className="logo-text">MFH</span>
          </div>

          <a href="/" className="back-btn">
            Back to website <span>→</span>
          </a>

          <div className="bg-image"></div>

          <div className="left-content">
            <h2>Doctor Application <br/>By Mohammad Farooq Himatzai</h2>
            <div className="slider-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot active"></span>
            </div>
          </div>
        </div>

        {/* ═══ ښي اړخ: د ننوتلو / راجستر فورم ═══ */}
        <div className="auth-right">
          <div className="form-container">
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <img 
                src="/logo.png" 
                alt="Institute Logo" 
                style={{ width: '45px', height: '45px', objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: '4px' }} 
              />
              <h1 className="form-title" style={{ margin: 0 }}>
                {isLogin ? 'Login' : 'Register'} (Himatzai)
              </h1>
            </div>
            
            <p className="form-subtitle" style={{ marginLeft: '57px' }}>
              {isLogin ? 'Welcome back! Please enter your details.' : 'Create a new account to get started.'}
            </p>

            {/* د خطا پیغام */}
            {error && (
              <div style={{ background: '#ef4444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* د بریالیتوب پیغام */}
            {successMsg && (
              <div style={{ background: '#10b981', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>
                {successMsg}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              
              {/* د نوم بکس (یوازې د راجستر پر مهال ښکاري) */}
              {!isLogin && (
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name" 
                    className="auth-input full-width" 
                    required
                  />
                </div>
              )}

              {/* یوزرنیم / موبایل نمبر */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                  {isLogin ? 'Username / Phone' : 'Username / Phone'}
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isLogin ? "Enter your username or phone" : "Enter your phone number"} 
                  className="auth-input full-width" 
                  required
                />
              </div>

              {/* پاسورډ */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Password</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" 
                    className="auth-input full-width" 
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* څانګه / Department (یوازې د لاګین پر مهال ښکاري) */}
              {isLogin && (
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Department</label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    className="auth-input full-width"
                    style={{ cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="Admin" style={{ background: '#1a1a24' }}>Admin Panel (مدیریت)</option>
                    <option value="Doctor" style={{ background: '#1a1a24' }}>Doctor Panel (ډاکټر)</option>
                  </select>
                </div>
              )}

              {/* ننوتل / راجستر تڼۍ */}
              <button type="submit" disabled={busy} className="submit-btn">
                {busy ? 'Please wait…' : (isLogin ? 'Sign In' : 'Register')}
              </button>

            </form>

            {/* 🚨 د لاګین او راجستر ترمنځ د بدلون تڼۍ */}
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span 
                onClick={toggleMode} 
                style={{ color: '#8b5cf6', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isLogin ? 'Register here' : 'Login here'}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* ═══ د ډیزاین لپاره CSS ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .auth-wrapper {
          font-family: 'Poppins', Tahoma, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 20px;
          box-sizing: border-box;
          direction: ltr;
        }

        .auth-container {
          display: flex;
          width: 100%;
          max-width: 1000px;
          height: 600px;
          background-color: #1a1a24;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }

        .auth-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          color: white;
          background-color: #1a1a24;
        }

        .bg-image {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url('/login_Image.PNG');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }

        .auth-left::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(26, 26, 36, 0.6); 
          z-index: 1;
        }

        .logo-area, .back-btn, .left-content {
          position: relative;
          z-index: 2;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .back-btn {
          position: absolute;
          top: 40px;
          right: 40px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.3s;
        }

        .back-btn:hover { background: rgba(255, 255, 255, 0.2); }

        .left-content h2 {
          font-size: 28px;
          font-weight: 500;
          line-height: 1.3;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .slider-dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 30px;
          height: 3px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .dot.active {
          background: white;
          width: 40px;
        }

        .auth-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .form-container {
          width: 100%;
          max-width: 380px;
        }

        .form-title {
          color: white;
          font-size: 28px;
          font-weight: 500;
        }

        .form-subtitle {
          color: #9ca3af;
          font-size: 13px;
          margin-bottom: 30px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-input {
          width: 100%;
          padding: 14px 16px;
          background-color: #2a2a35;
          border: 1px solid #3f3f4a;
          border-radius: 8px;
          color: white;
          font-family: 'Poppins', Tahoma, sans-serif;
          font-size: 13px;
          outline: none;
          transition: 0.3s;
          box-sizing: border-box;
        }

        .auth-input::placeholder { color: #6b7280; }

        .auth-input:focus {
          border-color: #8b5cf6;
          background-color: #2e2e3a;
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .eye-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          display: flex;
        }

        .submit-btn {
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 15px;
          transition: 0.3s;
        }

        .submit-btn:hover {
          opacity: 0.9;
        }
        
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
            height: auto;
          }
          .auth-left {
            padding: 30px;
            min-height: 250px;
          }
          .back-btn {
            top: 20px;
            right: 20px;
            padding: 6px 12px;
          }
          .left-content h2 {
            font-size: 20px;
          }
          .auth-right {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
