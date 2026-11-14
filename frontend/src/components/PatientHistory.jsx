import React, { useState, useEffect } from 'react';

const PatientHistory = ({ handleHistoryPrint, setHistoryPrintData, api }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // 🚨 د axios پر ځای api (چې ټوکن پکې دی) کارول شوی دی
        const res = await api.get('/patients');
        setPatients(res.data);
      } catch (err) {
        console.error('د مریضانو لیست نه شو راوړل شو', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [api]);

  const todayStr = new Date().toLocaleDateString();
  const todayCount = patients.filter(p => p.date && new Date(p.date).toLocaleDateString() === todayStr).length;

  const filteredPatients = patients.filter(p => {
    const pDate = p.date ? new Date(p.date) : new Date();
    const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;

    let inDateRange = true;
    if (startDate && pDateStr < startDate) inDateRange = false;
    if (endDate && pDateStr > endDate) inDateRange = false;

    const patientInfo = p.patientData ? p.patientData : p;
    const safeName = patientInfo.name ? String(patientInfo.name).toLowerCase() : '';
    const safeId = p.id ? String(p.id).toLowerCase() : '';
    const search = String(searchTerm).toLowerCase();

    return inDateRange && (safeName.includes(search) || safeId.includes(search));
  });

  const handleRePrint = (record) => {
    setHistoryPrintData({
      patientData: { ...record.patientData, id: record.id },
      medicines: record.medicines
    });
    setTimeout(() => { handleHistoryPrint(); }, 200);
  };

  const clearFilters = () => { setSearchTerm(''); setStartDate(''); setEndDate(''); };

  return (
    <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-800">📊 د مریضانو تاریخچه</h2>
        <div className="bg-white px-6 py-2 rounded-lg shadow-sm border border-blue-200 text-center">
          <span className="text-sm text-gray-500 block font-semibold">نن ورځ کتل شوي مریضان</span>
          <span className="font-bold text-green-600 text-3xl">{todayCount}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold mb-1 text-gray-700">🔍 لټون (نوم یا ID)</label>
          <input type="text" placeholder="د نوم یا ID ولیکئ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700">📅 له تاریخ</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700">📅 تر تاریخ</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={clearFilters} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 h-[42px] font-bold shadow-sm transition">✖️ فلټرونه پاک کړئ</button>
      </div>

      <div className="mb-2 text-gray-600 font-semibold text-sm">
        د ټاکل شوي فلټر له مخې مریضان: <span className="text-blue-600 font-bold text-lg">{filteredPatients.length}</span> کسه
      </div>

      {loading ? <p className="text-center text-gray-500 py-10 font-bold">د معلوماتو راوړل کیږي...</p> : (
        <div className="overflow-auto max-h-[500px] border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 sticky top-0 shadow-sm">
              <tr>
                <th className="border-b p-3 text-gray-700">د نسخې ID</th>
                <th className="border-b p-3 text-gray-700">د مریض نوم</th>
                <th className="border-b p-3 text-gray-700">عمر</th>
                <th className="border-b p-3 text-gray-700">تاریخ</th>
                <th className="border-b p-3 text-gray-700">تشخیص (Dx)</th>
                <th className="border-b p-3 text-gray-700 text-center">عمل</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-red-600 font-bold bg-red-50">❌ هغه څه چې تاسو یې لټول کول ونه موندل شول!</td></tr>
              ) : (
                filteredPatients.map((record) => (
                  <tr key={record.id} className="hover:bg-blue-50 transition">
                    <td className="border-b p-3 font-mono text-xs text-gray-500">{record.id}</td>
                    <td className="border-b p-3 font-bold text-gray-800">{record.patientData?.name}</td>
                    <td className="border-b p-3 text-gray-600">{record.patientData?.age}</td>
                    <td className="border-b p-3 text-sm text-gray-600">{new Date(record.date).toLocaleDateString('en-GB')}</td>
                    <td className="border-b p-3 text-sm text-red-600 font-semibold">{record.patientData?.dx || '-'}</td>
                    <td className="border-b p-3 text-center">
                      <button onClick={() => handleRePrint(record)} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-200 transition">🖨️ پرینټ کړئ</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;