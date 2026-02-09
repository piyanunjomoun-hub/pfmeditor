import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  LayoutDashboard,
  BookOpen,
  Settings,
  Search,
  TrendingUp,
  ExternalLink,
  Heart,
  Bookmark,
  Share2,
  Eye,
  MessageCircle,
  Trash2,
  Video,
  Layers,
  Clock,
  User,
  ChevronDown,
  X
} from 'lucide-react';
import {
  PRODUCTS as INITIAL_PRODUCTS,
  INITIAL_KPI_STATS
} from './constants';
import { Product } from './types';
import { fetchProducts, deleteProductFromSheet } from './sheetService';

// --- Components ---

const Sidebar = () => (
  <div className="w-16 bg-[#1a1c20] border-r border-gray-800 flex flex-col items-center py-6 gap-8 fixed h-full z-20">
    <div className="w-8 h-8 bg-cyan-500 rounded-lg mb-4 flex items-center justify-center shadow-lg shadow-cyan-500/20">
      <div className="w-4 h-4 bg-white rounded-full"></div>
    </div>
    <div className="flex flex-col gap-6">
      <div className="p-2.5 rounded-xl cursor-default bg-cyan-900/40 text-cyan-400"><LayoutDashboard size={20} /></div>
      <div className="p-2.5 text-gray-500 hover:text-white cursor-pointer"><BookOpen size={20} /></div>
    </div>
    <div className="mt-auto mb-4"><div className="p-2.5 text-gray-500 hover:text-white cursor-pointer"><Settings size={20} /></div></div>
  </div>
);

const TopBar = ({ title }: { title: string }) => (
  <div className="h-14 bg-[#0d0f12] border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-10 ml-16 backdrop-blur-md">
    <div className="flex items-center gap-4">
      <span className="text-gray-400 text-sm font-medium tracking-wide">{title}</span>
      <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full text-[10px] font-bold text-green-400 border border-green-500/10">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        <span>LIVE SYSTEM</span>
      </div>
    </div>
  </div>
);

const MainKPICard = () => {
  const metrics = [
    { label: 'View', icon: Eye, data: INITIAL_KPI_STATS.engagement.view },
    { label: 'Like', icon: Heart, data: INITIAL_KPI_STATS.engagement.like },
    { label: 'Bookmark', icon: Bookmark, data: INITIAL_KPI_STATS.engagement.bookmark },
    { label: 'Comment', icon: MessageCircle, data: INITIAL_KPI_STATS.engagement.comment },
    { label: 'Shared', icon: Share2, data: INITIAL_KPI_STATS.engagement.shared },
  ];
  return (
    <div className="rounded-2xl p-8 relative overflow-hidden flex flex-col gap-8 h-full" style={{ background: 'linear-gradient(-40deg, #f4259f, #0f7ce2)', boxShadow: '0 0 30px 2px rgba(0, 252, 255, 0.15)' }}>
      <div className="flex flex-col items-center gap-2 mt-4 relative z-10">
        <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em]">Total Dashboard View</span>
        <h1 className="text-8xl font-black tracking-tighter text-white drop-shadow-2xl tabular-nums">{INITIAL_KPI_STATS.totalViews}</h1>
      </div>
      <div className="w-full h-px bg-white/10 mt-4 relative z-10"></div>
      <div className="grid grid-cols-5 gap-4 relative z-10">
        {metrics.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all group text-center border border-transparent hover:border-white/5">
            <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors"><item.icon size={12} /><span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span></div>
            <span className="text-2xl font-black text-white">{item.data.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PFMChart = ({ products, onDeleteProduct }: { products: Product[], onDeleteProduct: (id: number) => void }) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [mainProductFilter, setMainProductFilter] = useState<string | null>(null);
  const [isMainFilterOpen, setIsMainFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    let list = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMain = !mainProductFilter || p.mainProduct === mainProductFilter;
      return matchesSearch && matchesMain;
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [products, searchQuery, mainProductFilter]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-[#1a1c20]/40 rounded-2xl flex flex-col border border-gray-800/30 shadow-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-6 flex flex-wrap justify-between items-center gap-4 border-b border-gray-800 bg-[#16181b]/50">
        <div className="flex items-center gap-3">
          <BarChart3 size={18} className="text-cyan-400" />
          <h3 className="text-base font-black text-gray-100 uppercase tracking-widest">PFM Chart</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setIsMainFilterOpen(!isMainFilterOpen)} className={`flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl text-xs font-bold border ${mainProductFilter ? 'border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'border-gray-700 text-gray-400'}`}>
              <Layers size={14} /> {mainProductFilter || 'Main Brand'} <ChevronDown size={14} />
            </button>
            {isMainFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1c20] border border-gray-800 rounded-xl z-50 py-2 shadow-2xl overflow-hidden">
                {['JDENT', 'Jarvit', 'Julaherb'].map(c => <div key={c} onClick={() => { setMainProductFilter(c as any); setIsMainFilterOpen(false); }} className="px-4 py-2 text-xs font-bold hover:bg-white/5 cursor-pointer text-gray-300 hover:text-white transition-colors">{c}</div>)}
                <div onClick={() => { setMainProductFilter(null); setIsMainFilterOpen(false); }} className="px-4 py-2 text-xs font-bold hover:bg-white/5 cursor-pointer border-t border-gray-800 text-gray-500 mt-1">Clear Selection</div>
              </div>
            )}
          </div>
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search content..." className="bg-gray-800 text-xs py-2 pl-9 pr-4 rounded-xl border border-gray-700 w-48 focus:border-cyan-500 outline-none transition-all" /></div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-400 border-collapse">
          <thead className="bg-[#16181b] text-[10px] text-gray-500 uppercase font-black tracking-widest">
            <tr>
              <th className="px-4 py-4 text-center">No.</th>
              <th className="px-6 py-4">Content Information</th>
              <th className="px-4 py-4 text-center">DU.</th>
              <th className="px-4 py-4 text-center">AVG.W</th>
              <th className="px-4 py-4 text-center">RE. %</th>
              <th className="px-4 py-4 text-center">VIEWS</th>
              <th className="px-4 py-4 text-center">LIKE</th>
              <th className="px-4 py-4 text-center">BM.</th>
              <th className="px-4 py-4 text-center">CM.</th>
              <th className="px-4 py-4 text-center">SH.</th>
              <th className="px-4 py-4 text-center">PFM.</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((p, i) => (
              <React.Fragment key={p.id}>
                <tr className={`border-t border-gray-800/50 hover:bg-white/[0.03] cursor-pointer group transition-colors ${expandedRows[p.id] ? 'bg-cyan-500/[0.02]' : ''}`} onClick={() => toggleRow(p.id)}>
                  <td className="px-4 py-4 text-center font-bold text-gray-600 group-hover:text-gray-400">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 w-10 h-14 rounded overflow-hidden border border-white/5 shadow-lg transition-transform group-hover:scale-105">
                        <img src={p.thumbnail} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-gray-200 group-hover:text-cyan-400 transition-colors truncate max-w-[150px]">{p.name}</div>
                        <div className="text-[9px] text-gray-600 flex items-center gap-1 mt-0.5"><Clock size={10} /> {new Date(p.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center tabular-nums">{p.du}</td>
                  <td className="px-4 py-4 text-center tabular-nums">{p.avgW}</td>
                  <td className="px-4 py-4 text-center tabular-nums font-bold text-gray-300">{p.re}</td>
                  <td className="px-4 py-4 text-center tabular-nums font-black text-white">{p.vw}</td>
                  <td className="px-4 py-4 text-center tabular-nums">{p.lk}</td>
                  <td className="px-4 py-4 text-center tabular-nums">{p.bm}</td>
                  <td className="px-4 py-4 text-center tabular-nums">{p.cm}</td>
                  <td className="px-4 py-4 text-center tabular-nums">{p.sh}</td>
                  <td className="px-4 py-4 text-center"><span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded font-black text-[10px] border border-cyan-500/20">{p.pfm}</span></td>
                </tr>
                {expandedRows[p.id] && (
                  <tr className="bg-cyan-500/[0.04] border-t border-cyan-500/10 animate-in fade-in slide-in-from-top-1">
                    <td colSpan={11} className="px-6 py-5">
                      <div className="flex items-center gap-10 pl-10">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase text-gray-500 font-black">Cost Per Mille (CPM)</span>
                          <div className="text-cyan-400 font-bold bg-cyan-900/20 px-4 py-1.5 rounded-lg border border-cyan-500/10">฿{p.cpm}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase text-gray-500 font-black">Cost Per Engagement (CPE)</span>
                          <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-900/20 px-4 py-1.5 rounded-lg border border-emerald-500/10">
                            <TrendingUp size={14} /> ฿{p.cpe}
                          </div>
                        </div>
                        {p.permalink && (
                          <div className="ml-auto">
                            <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#fe2c55]/10 text-white px-5 py-2.5 rounded-xl border border-[#fe2c55]/20 hover:bg-[#fe2c55]/20 transition-all font-black text-[10px] uppercase tracking-widest" onClick={(e) => e.stopPropagation()}>
                              <Video size={14} className="text-[#fe2c55]" /> Watch Video <ExternalLink size={12} className="opacity-60" />
                            </a>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this record?')) onDeleteProduct(p.id); }}
                          className="ml-4 p-2 text-gray-600 hover:text-red-500 transition-colors bg-red-500/5 rounded-lg border border-red-500/10"
                          title="Delete content"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchProducts();
    // If no data returned (empty sheet or error), fallback to initial if desired, OR just empty.
    // Here we prefer empty or whatever is in sheet to avoid confusion.
    setProducts(data.length > 0 ? data : INITIAL_PRODUCTS);
    setIsLoading(false);
  };

  const deleteProduct = async (id: number) => {
    // Optimistic update
    const previousProducts = products;
    setProducts(products.filter(p => p.id !== id));

    const success = await deleteProductFromSheet(id);
    if (!success) {
      alert("Failed to delete from Cloud. Reverting.");
      setProducts(previousProducts);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0d0f12] text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title="Real-time Analytics" />
        <main className="ml-16 p-8 flex-1 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 shadow-2xl"><MainKPICard /></div>
              <div className="bg-[#1a1c20] rounded-2xl border border-gray-800 p-8 flex flex-col items-center justify-center text-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-inner group-hover:scale-105 transition-transform duration-500"><User size={48} className="text-cyan-400" /></div>
                <div className="relative z-10">
                  <div className="font-black uppercase text-white tracking-[0.2em] text-lg">Administrator Panel</div>
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-2 opacity-60">Professional E-Commerce V2.0</div>
                </div>
              </div>
            </div>
            <PFMChart products={products} onDeleteProduct={deleteProduct} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
