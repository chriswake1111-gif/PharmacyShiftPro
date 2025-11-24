
import React, { useState } from 'react';
import { X, MousePointer, MousePointer2, Save, AlertCircle, Clock, RotateCcw, FileJson, Upload, Maximize2, GraduationCap, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PAGES = [
  {
    title: "基本流程",
    icon: <Clock className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            開始使用
          </h3>
          <ul className="space-y-3 text-sm text-gray-600 list-disc pl-5">
            <li><strong>選擇分店：</strong>上方下拉選單可切換不同分店，資料各自獨立。</li>
            <li><strong>設定日期：</strong>點擊日期欄位選擇排班區間（預設為當月）。</li>
            <li><strong>建立資料：</strong>初次使用請先至「管理員工」建立名單，與「管理班別」設定常用班別（如 A班、P班）。</li>
          </ul>
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-blue-800 text-xs leading-relaxed flex gap-2 items-start">
            <span className="text-lg">💡</span>
            <span>每個分店的員工名單是分開儲存的，切換分店後記得確認員工資料是否正確。</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "排班操作",
    icon: <MousePointer className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {/* Click */}
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-3 rounded-xl text-gray-600 shrink-0">
               <MousePointer size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-base">單次點擊 (左鍵)</h4>
              <p className="text-sm text-gray-600 mb-2">點擊格子開啟「班別選單」，選擇 A班、P班或休假。</p>
              <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block border border-gray-200">
                💡 點選選單內的 <RotateCcw size={10} className="inline"/> <strong>回復預設</strong> 可清除該格修改，還原為存檔狀態。
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Double Click */}
          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-xl text-red-600 shrink-0">
               <MousePointer2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-base">雙次點擊 (左鍵雙擊)</h4>
              <p className="text-sm text-gray-600 mb-2">針對已排好班的格子，雙擊可開啟進階選單：</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4 mb-2">
                <li>設定 <strong>加班時數 (+1~4)</strong></li>
                <li>標記 <strong>上課 (1300-1700)</strong></li>
              </ul>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-bold border border-indigo-100 flex items-center gap-1">
                    <GraduationCap size={12} /> 上課不計入工時
                 </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "介面功能",
    icon: <Maximize2 className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            工具列介紹
          </h3>
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Maximize2 size={20} /></div>
                <div>
                   <h4 className="font-bold text-gray-900 text-sm">放大檢視模式</h4>
                   <p className="text-xs text-gray-500">點擊右上角的放大按鈕，可隱藏上方選單與統計表，讓排班表格佔滿整個螢幕，適合專注排班時使用。</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg text-red-600"><RotateCcw size={20} /></div>
                <div>
                   <h4 className="font-bold text-gray-900 text-sm">區間回復預設</h4>
                   <p className="text-xs text-gray-500">位於班別說明列右側的紅色按鈕。可將目前顯示區間內的所有排班，<strong>一次性還原</strong>到上次存檔的狀態。</p>
                </div>
             </div>

             <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                   <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                   </span>
                </div>
                <div>
                   <h4 className="font-bold text-gray-900 text-sm">未儲存提醒</h4>
                   <p className="text-xs text-gray-500">當格子出現橘色呼吸燈，或右上角儲存按鈕在閃爍時，代表資料尚未寫入。請務必手動點擊儲存。</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "備份與還原",
    icon: <FileJson className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                跨裝置存取
             </h3>
             <div className="grid grid-cols-1 gap-4">
               <div className="bg-gray-50 p-4 rounded-xl flex gap-4 items-center border border-gray-200">
                  <div className="bg-white p-3 rounded-lg shadow-sm h-fit text-brand-600"><FileJson size={24} /></div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900">備份專案 (下載)</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      點擊 <FileJson size={14} className="inline"/> 圖示，將目前的員工、班別與排班記錄打包成 <code>.json</code> 檔下載。建議每週備份一次。
                    </p>
                  </div>
               </div>
               <div className="bg-gray-50 p-4 rounded-xl flex gap-4 items-center border border-gray-200">
                  <div className="bg-white p-3 rounded-lg shadow-sm h-fit text-brand-600"><Upload size={24} /></div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900">還原專案 (匯入)</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      點擊 <Upload size={14} className="inline"/> 圖示匯入備份檔。
                      <span className="block mt-1 text-red-500 font-bold text-xs">⚠️ 這將會覆蓋目前瀏覽器上的所有資料，請謹慎使用！</span>
                    </p>
                  </div>
               </div>
             </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3 items-start">
           <AlertCircle className="text-yellow-600 shrink-0" size={20} />
           <div className="text-xs text-yellow-800 leading-relaxed">
              <strong className="block mb-1 text-sm">重要提醒</strong>
              本系統資料儲存於您的瀏覽器中。若清除快取或更換電腦，資料將會消失。請善用「備份專案」功能保存資料。Excel 匯出檔僅供列印，無法用於還原系統資料。
           </div>
        </div>
      </div>
    )
  }
];

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const nextPage = () => {
    if (currentPage < PAGES.length - 1) setCurrentPage(curr => curr + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(curr => curr - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center backdrop-blur-md p-4 transition-all">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up ring-1 ring-white/20">
        
        {/* Header */}
        <div className="bg-brand-600 px-6 py-4 flex justify-between items-center shrink-0 text-white shadow-md">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📖 使用說明
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
           {PAGES[currentPage].content}
        </div>

        {/* Footer / Navigation */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
           
           {/* Left Button */}
           <button 
             onClick={prevPage}
             disabled={currentPage === 0}
             className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
               ${currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-brand-600'}
             `}
           >
             <ChevronLeft size={18} /> 上一頁
           </button>

           {/* Dots Indicator */}
           <div className="flex gap-2">
              {PAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 
                    ${idx === currentPage ? 'bg-brand-600 w-6' : 'bg-gray-300 hover:bg-brand-300'}
                  `}
                />
              ))}
           </div>

           {/* Right Button */}
           {currentPage < PAGES.length - 1 ? (
             <button 
               onClick={nextPage}
               className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-brand-600 transition-colors"
             >
               下一頁 <ChevronRight size={18} />
             </button>
           ) : (
             <button 
               onClick={onClose}
               className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all transform hover:scale-105"
             >
               <CheckCircle size={16} /> 完成
             </button>
           )}

        </div>
      </div>
    </div>
  );
};
