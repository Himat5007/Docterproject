import React, { useState } from 'react';

const MedicineManager = ({ medicines, setMedicines, registeredMeds }) => {
  const [newMed, setNewMed] = useState({ name: '', mg: '', type: '', qty: '', dose: '' });
  const [matched, setMatched] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleNameChange = (e) => {
    const value = e.target.value;
    const found = registeredMeds.find(
      (m) => m.name.toLowerCase() === value.toLowerCase()
    );

    if (found) {
      setNewMed({ ...newMed, name: found.name, mg: found.mg, type: found.type });
      setMatched(true);
    } else {
      setNewMed({ ...newMed, name: value, mg: '', type: '' }); // که نوی نوم ولیکل شي، Mg او Type خالي شي
      setMatched(false);
    }
  };

  const resetForm = () => {
    setNewMed({ name: '', mg: '', type: '', qty: '', dose: '' });
    setEditingId(null); setMatched(false);
  };

  const addOrUpdateMedicine = () => {
    if (!newMed.name) { alert('مهرباني وکړئ د درملو نوم ولیکئ!'); return; }
    
    // که درمل راجستر شوی نه وي، اجازه مه ورکوئ چې اضافه شي
    if (!newMed.mg || !newMed.type) {
      alert('مهرباني وکړئ یوازې هغه درمل وټاکئ چې سیسټم کې راجستر شوي دي!'); 
      return;
    }

    if (editingId) {
      setMedicines(medicines.map(m => (m.id === editingId ? { ...newMed, id: editingId } : m)));
    } else {
      setMedicines([...medicines, { id: Date.now(), ...newMed }]);
    }
    resetForm();
  };

  const handleEdit = (med) => {
    setNewMed({ name: med.name, mg: med.mg, type: med.type, qty: med.qty, dose: med.dose });
    setEditingId(med.id);
    setMatched(true); // د Edit پر مهال یې هم readOnly پاتې کیږي
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold border-b pb-2">Medicines Info (نسخه)</h2>
      
      <div className={`flex flex-wrap gap-2 items-end p-3 rounded border ${editingId ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50'}`}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs mb-1 font-semibold">Med Name</label>
          <input 
            list="registered-med-list" 
            placeholder="د درملو نوم ولیکئ یا انتخاب کړئ..." 
            value={newMed.name} 
            onChange={handleNameChange} 
            className="border p-2 rounded w-full" 
          />
          
          <datalist id="registered-med-list">
            {registeredMeds.map(m => (
              <option key={m.id} value={m.name}>
                {`[ ${m.type} ] - ${m.mg}`}
              </option>
            ))}
          </datalist>
          
        </div>

        {/* 🚨 Mg: اوس یوازې لوستل کیږي (Read Only) 🚨 */}
        <div className="w-24">
          <label className="block text-xs mb-1 font-semibold">Mg</label>
          <input 
            value={newMed.mg} 
            readOnly 
            className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed font-bold text-gray-700" 
          />
        </div>
        
        {/* 🚨 Type: اوس یوازې لوستل کیږي (Read Only) 🚨 */}
        <div className="w-24">
          <label className="block text-xs mb-1 font-semibold">Type</label>
          <input 
            value={newMed.type} 
            readOnly 
            className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed font-bold text-gray-700" 
          />
        </div>
        
        <div className="w-20">
          <label className="block text-xs mb-1 font-semibold">QTY</label>
          <input value={newMed.qty} onChange={(e) => setNewMed({...newMed, qty: e.target.value})} className="border p-2 rounded w-full" />
        </div>
        
        <div className="w-32">
          <label className="block text-xs mb-1 font-semibold">Dose</label>
          <input value={newMed.dose} onChange={(e) => setNewMed({...newMed, dose: e.target.value})} className="border p-2 rounded w-full" dir="rtl" />
        </div>
        
        <button onClick={addOrUpdateMedicine} className={`text-white px-4 py-2 rounded font-bold ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {editingId ? '💾 تازه کړئ' : 'Add'}
        </button>
        
        {editingId && <button onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded font-bold">✖️ لغوه</button>}
      </div>

      <table className="w-full text-left border-collapse mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">#</th>
            <th className="border p-2">Med Name</th>
            <th className="border p-2">Mg</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">QTY</th>
            <th className="border p-2">Dose</th>
            <th className="border p-2 text-center">عمل</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((med, index) => (
            <tr key={med.id} className={`hover:bg-blue-50 ${editingId === med.id ? 'bg-yellow-100' : ''}`}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2 font-bold">{med.name}</td>
              <td className="border p-2">{med.mg}</td>
              <td className="border p-2">{med.type}</td>
              <td className="border p-2">{med.qty}</td>
              <td className="border p-2" dir="rtl">{med.dose}</td>
              <td className="border p-2">
                <div className="flex gap-2 justify-center">
                  <button onClick={() => handleEdit(med)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600">✏️ Edit</button>
                  <button onClick={() => setMedicines(medicines.filter(m => m.id !== med.id))} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineManager;