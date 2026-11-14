import React, { useState } from 'react';

const MedicineRegistration = ({ registeredMeds, refreshMeds, api }) => {
  const [form, setForm] = useState({ name: '', mg: '', type: 'Tab' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const resetForm = () => {
    setForm({ name: '', mg: '', type: 'Tab' });
    setEditingId(null); setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mg || !form.type) { setMessage({ text: 'ټول معلومات ډک کړئ!', type: 'error' }); return; }
    
    try {
      if (editingId) {
        // 🚨 دلته api کارول کیږي
        await api.put(`/medicines/${editingId}`, form);
        setMessage({ text: '✅ درمل په بریالیتوب سره تازه (Update) شو!', type: 'success' });
      } else {
        // 🚨 دلته api کارول کیږي
        await api.post('/medicines', form);
        setMessage({ text: '✅ نوی درمل راجستر شو!', type: 'success' });
      }
      resetForm(); 
      refreshMeds();
    } catch (err) { 
      setMessage({ text: err.response?.data?.message || 'خطا راغله!', type: 'error' }); 
    }
  };

  const handleEdit = (med) => {
    setForm({ name: med.name, mg: med.mg, type: med.type });
    setEditingId(med.id); 
    setMessage({ text: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ایا غواړئ دا درمل پاک کړئ؟')) return;
    try {
      // 🚨 دلته api کارول کیږي
      await api.delete(`/medicines/${id}`);
      if (editingId === id) resetForm();
      refreshMeds();
    } catch (err) {
      alert('د پاکولو په وخت کې خطا راغله!');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">💊 د درملو راجستر کول</h2>
      
      <form onSubmit={handleSubmit} className={`flex flex-wrap gap-3 items-end mb-6 p-4 rounded-xl border transition-all ${editingId ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1 font-semibold text-gray-700">Med Name</label>
          <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-sm mb-1 font-semibold text-gray-700">Mg</label>
          <input value={form.mg} onChange={(e) => setForm({...form, mg: e.target.value})} className="border p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-sm mb-1 font-semibold text-gray-700">Type</label>
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="border p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="Tab">Tab</option><option value="Cap">Cap</option><option value="Syrup">Syrup</option><option value="Serum">Serum</option><option value="Injection">Injection</option>
          </select>
        </div>
        <button type="submit" className={`text-white px-6 py-2 rounded-lg font-bold shadow-sm transition ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {editingId ? '💾 Update' : '➕ راجستر'}
        </button>
        {editingId && <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-400 transition">✖️ لغوه</button>}
      </form>

      {message.text && <div className={`p-3 rounded-lg mb-4 font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{message.text}</div>}
      
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b p-3 text-gray-700">#</th><th className="border-b p-3 text-gray-700">Name</th><th className="border-b p-3 text-gray-700">Mg</th><th className="border-b p-3 text-gray-700">Type</th><th className="border-b p-3 text-gray-700 text-center">عمل</th>
            </tr>
          </thead>
          <tbody>
            {registeredMeds.map((med, i) => (
              <tr key={med.id} className={`hover:bg-blue-50 transition ${editingId === med.id ? 'bg-yellow-50' : ''}`}>
                <td className="border-b p-3 text-gray-500">{i + 1}</td>
                <td className="border-b p-3 font-bold text-gray-800">{med.name}</td>
                <td className="border-b p-3 text-gray-600">{med.mg}</td>
                <td className="border-b p-3 text-gray-600">{med.type}</td>
                <td className="border-b p-3">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleEdit(med)} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-yellow-200 transition">✏️ Edit</button>
                    <button onClick={() => handleDelete(med.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-red-200 transition">🗑️ پاکول</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicineRegistration;