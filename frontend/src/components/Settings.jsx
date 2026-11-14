import React, { useState, useEffect } from 'react';

const Settings = ({ settings, setSettings, api }) => {
  const [header, setHeader] = useState(null);
  const [footer, setFooter] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 🚨 دلته api کارول کیږي
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (error) { 
        console.error("د تنظیماتو راوړلو کې ستونزه:", error); 
      }
    };
    fetchSettings();
  }, [setSettings, api]);

  const handleUpload = async () => {
    if (!header && !footer) {
      setMessage('مهرباني وکړئ لومړی د عکس فایل انتخاب کړئ!');
      return;
    }

    setIsUploading(true);
    setMessage('');

    const formData = new FormData();
    if (header) formData.append('header', header);
    if (footer) formData.append('footer', footer);

    try {
      // 🚨 دلته api کارول کیږي
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000 
      });
      
      setSettings({ ...res.data });
      setMessage('✅ عکسونه په بریالیتوب سره تازه (Update) شول!');
      setHeader(null);
      setFooter(null);
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        setMessage('❌ سرور ځواب نه ورکوي! مهرباني وکړئ وګورئ چې Backend روان دی.');
      } else {
        setMessage('❌ د عکس اپلوډ په وخت کې خطا راغله!');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-200 mb-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">⚙️ د چاپ تنظیمات (Header & Footer)</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg font-bold text-center border ${message.includes('✅') ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* د سرلیک عکس */}
        <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
          <label className="block text-sm font-bold mb-3 text-gray-700">اوسنی سرلیک (Header)</label>
          {settings.headerUrl ? (
            <div className="mb-3">
              <img src={settings.headerUrl} alt="Header" className="h-24 object-contain bg-white border border-gray-300 rounded w-full" />
              <p className="text-xs text-green-600 mt-2 font-semibold">✔️ عکس اپلوډ شوی دی</p>
            </div>
          ) : (
            <p className="text-red-500 text-sm mb-3 font-semibold">❌ هیڅ سرلیک نه دی اپلوډ شوی.</p>
          )}
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setHeader(e.target.files[0])} 
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition" 
          />
        </div>

        {/* د فوټر عکس */}
        <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
          <label className="block text-sm font-bold mb-3 text-gray-700">اوسنی فوټر (Footer)</label>
          {settings.footerUrl ? (
            <div className="mb-3">
              <img src={settings.footerUrl} alt="Footer" className="h-24 object-contain bg-white border border-gray-300 rounded w-full" />
              <p className="text-xs text-green-600 mt-2 font-semibold">✔️ عکس اپلوډ شوی دی</p>
            </div>
          ) : (
            <p className="text-red-500 text-sm mb-3 font-semibold">❌ هیڅ فوټر نه دی اپلوډ شوی.</p>
          )}
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFooter(e.target.files[0])} 
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition" 
          />
        </div>
      </div>

      <button 
        onClick={handleUpload} 
        disabled={isUploading}
        className={`px-8 py-2.5 rounded-lg mt-6 text-white font-bold shadow-sm transition ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isUploading ? '... اپلوډ کیږي' : '💾 خوندي کړئ / تازه کړئ'}
      </button>
    </div>
  );
};

export default Settings;