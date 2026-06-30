import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`;
  return path;
};

export default function CompanyStoryPage() {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/dashboard/config`);
        // Ensure it's an array for safe iteration
        setStory(Array.isArray(res.data.fullStory) ? res.data.fullStory : [res.data.fullStory].filter(Boolean));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStory();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] text-slate-900">
      <div className="flex min-h-screen w-full flex-col">
        <Header pageTitle="Our Story" />
        <main className="w-full flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : story && story.length > 0 ? (
            <div>
            {story.map((s, idx) => (
              s.layout === 'side' ? (
                    <section key={s.id} className={`relative flex flex-col lg:flex-row w-full bg-white text-slate-900 overflow-hidden border-b border-slate-200 group animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                      <div className={`relative min-h-[400px] w-full lg:h-auto lg:w-1/2 overflow-hidden ${idx % 2 !== 0 ? 'lg:order-last' : ''}`}>
                    {s.image_url ? (
                      <img 
                        src={getImageUrl(s.image_url)} 
                        alt={s.title || "Company Story"} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">No Image</div>
                    )}
                  </div>
                      <div className={`flex w-full flex-col justify-center p-8 sm:p-12 lg:p-20 ${s.image_url ? 'lg:w-1/2 items-start text-left' : 'items-center text-center'}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 mb-2">Chapter {idx + 1}</p>
                    <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
                      {s.title}
                    </h2>
                    <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-medium">
                      {s.description?.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                    <section key={s.id} className={`relative w-full min-h-[500px] flex items-center justify-center bg-slate-950 text-white py-20 px-6 overflow-hidden border-b border-slate-800 animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                  {s.image_url && (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
                        style={{ backgroundImage: `url(${getImageUrl(s.image_url)})` }}
                      />
                      <div className="absolute inset-0 bg-black/70" />
                    </>
                  )}
                  
                  <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">Chapter {idx + 1}</p>
                    <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                      {s.title}
                    </h2>
                    
                    <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
                    
                    <div className="space-y-6 text-lg md:text-xl text-slate-200 leading-relaxed font-medium drop-shadow-sm">
                      {s.description?.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </section>
              )
                ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                  <span className="text-2xl text-amber-500">📖</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Our Story Coming Soon</p>
                <p className="mt-1 text-sm text-slate-500">We are currently crafting our story sections. Please check back later!</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}