import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // 🚨 دلته مو لینکونه د Render آنلاین سرور ته بدل کړل
      const baseUrl = 'https://docterproject.onrender.com/api';
      const url = isLogin ? `${baseUrl}/auth/login` : `${baseUrl}/auth/register`;
      
      const res = await axios.post(url, form);
      
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        window.location.reload();
      } else {
        setMessage('✅ راجستر شو! د اډمین تایید ته انتظار وکړئ.');
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'خطا راغله!'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? '🔐 ننوتل (Login)' : '📝 نوی اکاونټ جوړول'}</h2>
        
        {message && <div className="bg-blue-100 text-blue-800 p-2 rounded mb-4 text-center">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold mb-1">نوم (Name)</label>
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border p-2 rounded w-full" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1">موبایل نمبر</label>
            <input required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="border p-2 rounded w-full" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">پاسورډ</label>
            <input required type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="border p-2 rounded w-full" dir="ltr" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
            {isLogin ? 'ننوتل' : 'راجستر کول'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'اکاونټ نلرئ؟ دلته راجستر شئ' : 'اکاونټ لرئ؟ دلته لاګین شئ'}
        </p>
      </div>
    </div>
  );
};

export default Auth;
