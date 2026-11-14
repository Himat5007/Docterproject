import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState(''); 
  const adminInfo = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '' });
  const [editUser, setEditUser] = useState(null);

  // 🚨 دلته مو localhost د Render لینک سره بدل کړ
  const api = axios.create({
    baseURL: 'https://docterproject.onrender.com/api/admin',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.phone || !newUser.password) return showMsg('ټول معلومات ډک کړئ!', 'error');
    try {
      await api.post('/create-user', newUser);
      showMsg('✅ نوی کارونکی په بریالیتوب سره جوړ شو!');
      setNewUser({ name: '', phone: '', password: '' });
      fetchUsers();
    } catch (err) {
      showMsg(`❌ ${err.response?.data?.message || 'خطا راغله!'}`, 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser.name || !editUser.phone) return showMsg('نوم او نمبر باید وي!', 'error');
    try {
      await api.put(`/users/${editUser.id}`, {
        name: editUser.name,
        phone: editUser.phone,
        password: editUser.password || undefined
      });
      showMsg('✅ معلومات په بریالیتوب سره تازه شول!');
      setEditUser(null);
      fetchUsers();
      
      if (editUser.id === adminInfo.id) {
        adminInfo.name = editUser.name;
        localStorage.setItem('user', JSON.stringify(adminInfo));
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      showMsg(`❌ ${err.response?.data?.message || 'خطا راغله!'}`, 'error');
    }
  };

  const approveUser = async (id) => {
    await api.put(`/approve/${id}`);
    fetchUsers();
    showMsg('✅ کارونکی تایید شو!');
  };

  const loginAsUser = async (user) => {
    if (user.role === 'admin') return;
    if (!window.confirm(`ایا تاسو غواړئ د ډاکټر (${user.name}) په اکاونټ کې داخل شئ؟`)) return;

    try {
      // 🚨 دلته مو هم localhost د Render لینک سره بدل کړ
      const res = await axios.post(`https://docterproject.onrender.com/api/admin/impersonate/${user.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', localStorage.getItem('user'));
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.reload();
    } catch (err) { alert('خطا راغله!'); }
  };

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(search) || 
      String(u.phone).toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      
      {message.text && (
        <div className={`p-4 rounded-xl text-center font-bold shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 border-b pb-2 text-blue-800">➕ نوی ډاکټر راجستر کړئ</h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <input required placeholder="د ډاکټر نوم" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="border p-2 rounded-lg w-full bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" />
            <input required placeholder="موبایل نمبر / یوزرنیم" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="border p-2 rounded-lg w-full bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            <input required type="password" placeholder="پاسورډ" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="border p-2 rounded-lg w-full bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full font-bold hover:bg-blue-700 transition">جوړول (Create User)</button>
          </form>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl shadow-sm border border-purple-200">
          <h3 className="text-lg font-bold mb-4 border-b border-purple-200 pb-2 text-purple-800">👑 خپل (اډمین) معلومات بدل کړئ</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.adminName.value;
            const phone = e.target.adminPhone.value;
            const pass = e.target.adminPass.value;
            handleUpdateUser({ preventDefault: () => {} }, { id: adminInfo.id, name, phone, password: pass });
          }} className="space-y-3">
            <input name="adminName" defaultValue={adminInfo.name} placeholder="ستاسو نوم" className="border border-purple-200 p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-purple-500" required />
            <input name="adminPhone" defaultValue={adminInfo.phone || '0000'} placeholder="ستاسو یوزرنیم (نمبر)" className="border border-purple-200 p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" required />
            <input name="adminPass" type="password" placeholder="نوی پاسورډ (که نه غواړئ بدل شي، خالي یې پرېږدئ)" className="border border-purple-200 p-2 rounded-lg w-full bg-white outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg w-full font-bold hover:bg-purple-700 transition">زما معلومات تازه کړئ</button>
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📋 د سیسټم کارونکي
              <span className="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full">
                ټول: {users.length}
              </span>
              <span className="bg-green-100 text-green-800 text-sm py-1 px-3 rounded-full">
                فعال: {users.filter(u => u.status === 'approved').length}
              </span>
            </h3>
          </div>
          
          <div className="w-full md:w-72 relative">
            <input 
              type="text" 
              placeholder="د نوم یا نمبر له مخې لټون..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 p-2.5 pl-10 pr-4 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>
        </div>
        
        {editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h4 className="text-lg font-bold mb-4 text-blue-800">✏️ د ({editUser.name}) معلومات سم کړئ</h4>
              <form onSubmit={handleUpdateUser} className="space-y-3">
                <input required placeholder="نوم" value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} className="border p-2 rounded-lg w-full bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" />
                <input required placeholder="یوزرنیم (نمبر)" value={editUser.phone} onChange={e => setEditUser({...editUser, phone: e.target.value})} className="border p-2 rounded-lg w-full bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                <input type="password" placeholder="نوی پاسورډ (اختیاري)" value={editUser.password || ''} onChange={e => setEditUser({...editUser, password: e.target.value})} className="border p-2 rounded-lg w-full bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1 font-bold hover:bg-green-700 transition">💾 خوندي کړئ</button>
                  <button type="button" onClick={() => setEditUser(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex-1 font-bold hover:bg-gray-400 transition">✖️ لغوه</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border-b p-3">نوم</th>
                <th className="border-b p-3">یوزرنیم / نمبر</th>
                <th className="border-b p-3">حالت</th>
                <th className="border-b p-3 text-center">عملونه</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-red-500 font-bold bg-red-50">
                    ❌ هیڅ کارونکی ونه موندل شو!
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50 transition">
                    <td className="border-b p-3 font-bold text-gray-800">{u.name} {u.role === 'admin' && '👑'}</td>
                    <td className="border-b p-3 font-mono text-sm text-gray-600" dir="ltr">{u.phone}</td>
                    <td className="border-b p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.status === 'approved' ? 'فعال' : 'انتظار'}
                      </span>
                    </td>
                    <td className="border-b p-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {u.status !== 'approved' && u.role !== 'admin' && (
                          <button onClick={() => approveUser(u.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700 transition">✅ تایید</button>
                        )}
                        {u.status === 'approved' && u.role !== 'admin' && (
                          <button onClick={() => loginAsUser(u)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition">🔑 داخلیدل</button>
                        )}
                        <button onClick={() => setEditUser({ ...u, password: '' })} className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-yellow-600 transition">✏️ Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
