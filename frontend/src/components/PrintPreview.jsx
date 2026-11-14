import React, { forwardRef } from 'react';

const PrintPreview = forwardRef(({ patientData, medicines, printMode, settings }, ref) => {
  return (
    <div 
      ref={ref} 
      className="p-8 bg-white text-black" 
      style={{ 
        fontFamily: "'Times New Roman', Times, serif", 
        fontSize: '14px', // بنسټیز سایز 14px کړل شو
        lineHeight: '1.5' 
      }} 
      dir="ltr"
    >
      <style>
        {`
          @media print {
            @page { size: A4; margin: 10mm; }
            body { 
                margin-top:90px;
                padding: 0; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              font-family: 'Times New Roman', Times, serif !important; 
            }
            /* دلته مو زور کوونکی قانون لرې کړ، اوس هر څه خپل طبیعی سایز لري */
            .blank-header { position: fixed; top: 0; width: 100%; height: 30mm; }
            .blank-footer { position: fixed; bottom: 0; width: 100%; height: 30mm; }
            .preprinted-space-top { height: 60mm; }
            .preprinted-space-bottom { height: 35mm; }
          }
        `}
      </style>

      {printMode === 'blank' && (
        <>
          {settings.headerUrl && <img src={settings.headerUrl} alt="Header" className="blank-header object-contain" />}
          {settings.footerUrl && <img src={settings.footerUrl} alt="Footer" className="blank-footer object-contain" />}
        </>
      )}

      <div className={printMode === 'preprinted' ? 'preprinted-space-top' : 'mt-20'}>

        {/* ۱. د ناروغ معلومات */}
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 px-2">
          <div className="flex gap-2 w-1/4">
            <span className="font-bold italic">Name:</span>
            <span className="font-bold uppercase">{patientData.name}</span>
          </div>
          <div className="flex gap-2 w-1/6">
            <span className="font-bold italic">Gender:</span>
            <span className="font-bold">{patientData.gender}</span>
          </div>
          <div className="flex gap-2 w-1/6">
            <span className="font-bold italic">Age:</span>
            <span className="font-bold">{patientData.age}</span>
          </div>
          <div className="flex gap-2 w-1/4">
            <span className="font-bold italic">ID:</span>
            <span className="font-bold">{patientData.id || '---'}</span>
          </div>
          <div className="flex gap-2 w-1/4 justify-end">
            <span className="font-bold italic">Date:</span>
            <span className="font-bold">{new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        {/* منځپانګه */}
        <div className="flex min-h-[650px]">
          
          {/* کیڼ اړخ */}
          <div className="w-1/3 pr-4 border-r-2 border-black flex flex-col">
            <div className="space-y-3 font-bold px-6 mb-2">
              <div className="flex justify-between"><span className="italic">BP:</span> <span>{patientData.bp || '...........'}</span></div>
              <div className="flex justify-between"><span className="italic">PO2:</span> <span>{patientData.o2 || '...........'}</span></div>
              <div className="flex justify-between"><span className="italic">Temp:</span> <span>{patientData.temp || '...........'}</span></div>
              <div className="flex justify-between"><span className="italic">P.R:</span> <span>{patientData.pr || '...........'}</span></div>
              <div className="flex justify-between"><span className="italic">Weight:</span> <span>{patientData.weight || '...........'}</span></div>
            </div>
            
            <hr className="border-black w-full mb-4" />
            
            <div className="px-6 flex-1">
              <h3 className="font-bold italic mb-2">Clinical Recode:</h3>
              {/* دلته مو کلینیکي یادښتونو ته 12px سایز ورکړ ترڅو ښه ځای ونیسي */}
              <p className="whitespace-pre-wrap font-bold" style={{ fontSize: '12px' }}>
                {patientData.clinicalNotes}
              </p>
            </div>
            
            <div className="px-6 mt-auto pb-4">
              <h3 className="font-bold italic mb-1">Dx:</h3>
              <p className="whitespace-pre-wrap font-bold" style={{ fontSize: '12px' }}>
                {patientData.dx || '................................'}
              </p>
            </div>
          </div>

          {/* ښي اړخ */}
          <div className="w-2/3 pl-6 pt-2">
            {medicines.length === 0 ? (
              <p className="text-gray-400 p-4 text-center">هیڅ درمل نه دي اضافه شوي</p>
            ) : (
              <div className="space-y-4">
                {medicines.map((med) => (
                  // دلته مو د درملو نوم 14px (بنسټیز) پاتې شو ترڅو ښه لوستل شي
                  <div key={med.id} className="flex w-full items-start font-bold border-b border-gray-200 pb-2">
                    <div className="w-24 pt-1">{med.type}</div>
                    <div className="flex-1 flex flex-col pl-6 pr-2">
                      <div>{med.name}</div>
                      {/* دلته مو د استعمال طریقه (Dose) 12px کړه */}
                      {med.dose && (
                        <div className="mt-1 text-gray-800 text-left w-full" style={{ fontSize: '12px' }} dir="rtl">
                          {med.dose}
                        </div>
                      )}
                    </div>
                    <div className="w-24 text-center pt-1">{med.mg}</div>
                    <div className="w-16 text-center pt-1">{med.qty}</div>
                  </div>


                ))}

                  <div className="w-16 text-center pt-1" id="line">Signture:         ________________________</div>
              </div>
            )}
          </div>
        </div>

      </div>
      
      {printMode === 'preprinted' && <div className="preprinted-space-bottom"></div>}
    </div>
  );
});

export default PrintPreview;