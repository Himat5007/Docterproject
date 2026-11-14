import React from 'react';

const PatientForm = ({ patientData, setPatientData }) => {
  const handleChange = (e) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold border-b pb-2">Patients Information</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <input name="name" placeholder="Patient Name" value={patientData.name} onChange={handleChange} className="border p-2 rounded" />
        <input name="age" placeholder="Age" value={patientData.age} onChange={handleChange} className="border p-2 rounded" />
        <select name="gender" value={patientData.gender} onChange={handleChange} className="border p-2 rounded">
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <input name="address" placeholder="Address" value={patientData.address} onChange={handleChange} className="border p-2 rounded" />
      </div>

      <h2 className="text-lg font-semibold border-b pb-2 mt-4">Vitals (Diagnose)</h2>
      <div className="grid grid-cols-2 gap-2">
        <input name="bp" placeholder="BP (e.g. 120/80)" value={patientData.bp} onChange={handleChange} className="border p-2 rounded" />
        <input name="o2" placeholder="O2 (e.g. 98)" value={patientData.o2} onChange={handleChange} className="border p-2 rounded" />
        <input name="temp" placeholder="Temp (e.g. 38)" value={patientData.temp} onChange={handleChange} className="border p-2 rounded" />
        <input name="pr" placeholder="P.R (e.g. 85)" value={patientData.pr} onChange={handleChange} className="border p-2 rounded" />
        <input name="weight" placeholder="Weight (e.g. 70kg)" value={patientData.weight} onChange={handleChange} className="border p-2 rounded" />
      </div>

      <h2 className="text-lg font-semibold border-b pb-2 mt-4">Clinical Record</h2>
      <textarea 
        name="clinicalNotes" 
        rows="6" 
        value={patientData.clinicalNotes} 
        onChange={handleChange} 
        className="border p-2 rounded w-full" 
        placeholder="د ناروغۍ یادښتونه دلته ولیکئ..."
      ></textarea>


        {/* دا برخه اضافه کړئ */}
      <h2 className="text-lg font-semibold border-b pb-2 mt-2 text-red-600">Dx (تشخیص)</h2>
      <textarea 
        name="dx" 
        rows="2" 
        value={patientData.dx} 
        onChange={handleChange} 
        className="border p-2 rounded w-full border-red-300" 
        placeholder="د ناروغۍ تشخیص (Diagnosis) دلته ولیکئ..."
      ></textarea>
    </div>
  );
};

export default PatientForm;