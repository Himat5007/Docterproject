import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import PatientForm from './components/PatientForm';
import MedicineManager from './components/MedicineManager';
import PrintPreview from './components/PrintPreview';
import Settings from './components/Settings';
import MedicineRegistration from './components/MedicineRegistration';
import PatientHistory from './components/PatientHistory';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminToken = localStorage.getItem('adminToken');

  // د اپلیکیشن اصلي حالتونه
  const [currentPage, setCurrentPage] = useState('prescription');
  const [showSettings, setShowSettings] = useState(false);
  const [printMode, setPrintMode] = useState('blank');
  const [settings, setSettings] = useState({ headerUrl: '', footerUrl: '' });
  
  // د مریض معلومات
  const [patientData, setPatientData] = useState({ name: '', age: '', gender: '', address: '', bp: '', o2: '', temp: '', pr: '', weight: '', clinicalNotes: '', dx: '' });
  const [medicines, setMedicines] = useState([]);
  const [registeredMeds, setRegisteredMeds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // د API اصلي شی (ټوکن پکې دی)
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // د پرینټ سیسټم
  const printRef = useRef();
  const handlePrint = useReactToPrint({ 
    contentRef: printRef,
    onAfterPrint: () => {
      setPatientData({ name: '', age: '', gender: '', address: '', bp: '', o2: '', temp: '', pr: '', weight: '', clinicalNotes: '', dx: '' });
      setMedicines([]);
    }
  });

  const [historyPrintData, setHistoryPrintData] = useState({ patientData: null, medicines: [] });
  const historyPrintRef = useRef();
  const handleHistoryPrint = useReactToPrint({ contentRef: historyPrintRef });

  // د معلوماتو راوړل
  const refreshMeds = async () => {
    try {
      const res = await api.get('/medicines');
      setRegisteredMeds(res.data);
    } catch (err) { 
      if(err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  useEffect(() => { 
    if (token) {
      refreshMeds(); 
      api.get('/settings').then(res => setSettings(res.data)).catch(() => {});
    }
  }, [token]);

  const logout = () => {
    localStorage.clear();
    setToken(null);
  };

  const returnToAdmin = () => {
    localStorage.setItem('token', adminToken);
    localStorage.setItem('user', localStorage.getItem('adminUser'));
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.reload();
  };

  const saveAndPrint = async () => {
    if (!patientData.name) { alert('د مریض نوم ولیکئ!'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api.post('/patients', { patientData, medicines });
      handlePrint(); 
    } catch (error) { alert('خطا راغله!'); } finally { setIsSaving(false); }
  };

  if (!token) {
    return <LoginPage setToken={setToken} />;
  }

  // === که اډمین وي ===
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="flex justify-between items-center mb-6 bg-white p-4 shadow-sm rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg text-2xl">👑</div>
            <h1 className="text-2xl font-bold text-gray-800">د اډمین کنټرول پینل</h1>
          </div>
          <button onClick={logout} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition">🚪 وتل (Logout)</button>
        </div>
        <AdminDashboard token={token} />
      </div>
    );
  }

  // === که ډاکټر وي (د ډاکټر ډشبورډ) ===
  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* سور بانر: که اډمین د بل چا په اکاونټ کې وي */}
      {adminToken && (
        <div className="bg-red-600 text-white text-center p-3 font-bold flex justify-center items-center gap-4 shadow-md">
          <span>⚠️ تاسو اوس د ډاکټر ({user.name}) په اکاونټ کې یاست (د سمون لپاره).</span>
          <button onClick={returnToAdmin} className="bg-white text-red-600 px-4 py-1 rounded-lg hover:bg-gray-100 font-bold transition shadow-sm">
            🔙 بیرته اډمین پینل ته
          </button>
        </div>
      )}

      {/* د اپلیکیشن پورتنۍ برخه (Header) */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🏥</span>
              <h1 className="text-xl font-bold text-slate-800">د ډاکټر سیسټم</h1>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">👤 {user.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <nav className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setCurrentPage('prescription')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'prescription' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>📝 نسخه</button>
                <button onClick={() => setCurrentPage('history')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>📚 تاریخچه</button>
                <button onClick={() => setCurrentPage('medicines')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === 'medicines' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>💊 درمل</button>
              </nav>
              <div className="h-8 w-px bg-gray-300 mx-2"></div>
              <button onClick={logout} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold transition">🚪 وتل</button>
            </div>
          </div>
        </div>
      </header>

      {/* د نسخې پورتنۍ تڼۍ */}
      {currentPage === 'prescription' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex justify-end gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition">⚙️ تنظیمات</button>
            <select onChange={(e) => setPrintMode(e.target.value)} className="border border-gray-300 p-2 rounded-lg bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500">
              <option value="blank">په سپینه کاغذ چاپ</option>
              <option value="preprinted">په مخکې چاپ شوي کاغذ چاپ</option>
            </select>
            <button onClick={saveAndPrint} disabled={isSaving} className={`text-white px-5 py-2 rounded-lg font-bold shadow-sm transition ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSaving ? '... خوندي کیږي' : '🖨️ چاپ او خوندي کول'}
            </button>
          </div>
        </div>
      )}

      {/* اصلي منځپانګه */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showSettings && currentPage === 'prescription' && (
          <div className="mb-6"><Settings settings={settings} setSettings={setSettings} api={api} /></div>
        )}

        {currentPage === 'prescription' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white p-6 shadow-sm rounded-xl border border-gray-200">
              <PatientForm patientData={patientData} setPatientData={setPatientData} />
            </div>
            <div className="lg:col-span-8 bg-white p-6 shadow-sm rounded-xl border border-gray-200">
              <MedicineManager medicines={medicines} setMedicines={setMedicines} registeredMeds={registeredMeds} />
            </div>
          </div>
        )}

        {currentPage === 'history' && (
          <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-200">
            <PatientHistory handleHistoryPrint={handleHistoryPrint} setHistoryPrintData={setHistoryPrintData} api={api} />
          </div>
        )}

        {currentPage === 'medicines' && (
          <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-200">
            <MedicineRegistration registeredMeds={registeredMeds} refreshMeds={refreshMeds} api={api} />
          </div>
        )}
      </main>

      {/* پټ پرینټرونه */}
      <div style={{ display: 'none' }}>
        <PrintPreview ref={printRef} patientData={patientData} medicines={medicines} printMode={printMode} settings={settings} />
      </div>
      {historyPrintData.patientData && (
        <div style={{ display: 'none' }}>
          <PrintPreview ref={historyPrintRef} patientData={historyPrintData.patientData} medicines={historyPrintData.medicines} printMode={printMode} settings={settings} />
        </div>
      )}
    </div>
  );
}

export default App;