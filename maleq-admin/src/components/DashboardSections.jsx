import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { OrderContext } from '../context/OrderContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to construct full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`; // Relative path needs API base
  return path; // Return as-is if not an uploads path
};

// Slideshow component
function Slideshow({ images, editable = false, initialMode = 'fill', onModeChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageMode, setImageMode] = useState(initialMode);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3500); // Change image every 2.5 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    setImageMode(initialMode === 'fit' ? 'fit' : 'fill');
  }, [initialMode]);

  if (images.length === 0) return null;

  return (
    <section className="overflow-hidden bg-slate-900 w-full">
      <div className="relative h-[50vh] sm:h-[60vh] lg:h-[75vh] w-full">
        {/* Images */}
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={getImageUrl(image.image_url)}
              alt={image.alt_text}
              className={`h-full w-full ${imageMode === 'fit' ? 'object-contain' : 'object-cover'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
          </div>
        ))}

        {/* Fit / Fill toggle (admin only) */}
        {editable && (
          <div className="absolute right-4 top-4 z-10 flex overflow-hidden rounded-full border border-white/40 bg-black/30 backdrop-blur">
            <button
              type="button"
              onClick={() => {
                setImageMode('fit');
                onModeChange?.('fit');
              }}
              className={`px-3 py-1 text-xs font-semibold transition ${imageMode === 'fit' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'}`}
              aria-label="Show slideshow image in fit mode"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => {
                setImageMode('fill');
                onModeChange?.('fill');
              }}
              className={`px-3 py-1 text-xs font-semibold transition ${imageMode === 'fill' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'}`}
              aria-label="Show slideshow image in fill mode"
            >
              Fill
            </button>
          </div>
        )}

        {/* Dot navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-8 bg-[#FEEC48] shadow-[0_0_8px_rgba(254,236,72,0.6)]' : 'w-2.5 bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Order Method Selection component
function OrderMethodSelector() {
  const navigate = useNavigate();
  const { setOrderType, setCurrentStep } = useContext(OrderContext);

  const handleSelectType = (type) => {
    setOrderType(type);
    setCurrentStep('order');
    navigate('/customer/order');
  };

  return (
    <section className="py-20 lg:py-32 w-full px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto text-center animate-fade-in-up stagger-2 relative">
      {/* Decorative background blurs for bright airy feel */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#FFE77A]/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF9633]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="flex flex-col items-center justify-center mb-16 w-full relative z-10">
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-[#DE4F02] mb-3">Order Online</p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight drop-shadow-sm">Choose Your Experience</h2>
        <div className="w-24 h-1.5 bg-gradient-to-r from-[#FEEC48] via-[#FF9633] to-[#F57600] mx-auto rounded-full mt-6 shadow-sm"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-2 relative z-10">
        {/* Delivery Card */}
        <button
          onClick={() => handleSelectType('delivery')}
          className="relative flex flex-col items-center justify-between p-8 md:p-10 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(245,118,0,0.06)] transition-all duration-500 hover:shadow-[0_24px_64px_rgba(245,118,0,0.15)] hover:-translate-y-2 hover:border-[#F57600]/20 text-center group h-full overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#F57600]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFE77A] to-[#FEEC48] text-[#DE4F02] group-hover:from-[#F57600] group-hover:to-[#DE4F02] group-hover:text-white transition-all duration-500 mb-8 shadow-sm group-hover:shadow-lg group-hover:scale-110">
            <span className="text-4xl drop-shadow-sm">🚚</span>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between items-center w-full">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-[#DE4F02] transition-colors duration-300">Delivery</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors duration-300">
                Get hot, fresh meals delivered straight to your doorstep. Fast and reliable service.
              </p>
            </div>
            <span className="btn-base bg-white text-[#F57600] border-2 border-[#FFE77A]/50 group-hover:bg-gradient-to-r group-hover:from-[#F57600] group-hover:to-[#DE4F02] group-hover:border-transparent group-hover:text-white w-full transition-all duration-500 py-4 text-base font-bold rounded-full shadow-sm text-center transform group-hover:scale-105">
              Select Delivery
            </span>
          </div>
        </button>

        {/* Pickup Card */}
        <button
          onClick={() => handleSelectType('pickup')}
          className="relative flex flex-col items-center justify-between p-8 md:p-10 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(245,118,0,0.06)] transition-all duration-500 hover:shadow-[0_24px_64px_rgba(245,118,0,0.15)] hover:-translate-y-2 hover:border-[#F57600]/20 text-center group h-full overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FF9633]/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFE77A] to-[#FEEC48] text-[#DE4F02] group-hover:from-[#FF9633] group-hover:to-[#F57600] group-hover:text-white transition-all duration-500 mb-8 shadow-sm group-hover:shadow-lg group-hover:scale-110">
            <span className="text-4xl drop-shadow-sm">🏪</span>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between items-center w-full">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-[#F57600] transition-colors duration-300">Pickup</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors duration-300">
                Skip the line. Order ahead and pick up your meal at your nearest branch location.
              </p>
            </div>
            <span className="btn-base bg-white text-[#F57600] border-2 border-[#FFE77A]/50 group-hover:bg-gradient-to-r group-hover:from-[#FF9633] group-hover:to-[#F57600] group-hover:border-transparent group-hover:text-white w-full transition-all duration-500 py-4 text-base font-bold rounded-full shadow-sm text-center transform group-hover:scale-105">
              Select Pickup
            </span>
          </div>
        </button>

        {/* Dine In Card */}
        <button
          onClick={() => handleSelectType('dine_in')}
          className="relative flex flex-col items-center justify-between p-8 md:p-10 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(245,118,0,0.06)] transition-all duration-500 hover:shadow-[0_24px_64px_rgba(245,118,0,0.15)] hover:-translate-y-2 hover:border-[#DE4F02]/20 text-center group h-full overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#DE4F02]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFE77A] to-[#FEEC48] text-[#DE4F02] group-hover:from-[#F57600] group-hover:to-[#DE4F02] group-hover:text-white transition-all duration-500 mb-8 shadow-sm group-hover:shadow-lg group-hover:scale-110">
            <span className="text-4xl drop-shadow-sm">🍽️</span>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between items-center w-full">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-[#DE4F02] transition-colors duration-300">Dine In</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors duration-300">
                Reserve your table and order from your table inside our restaurant for fine dining.
              </p>
            </div>
            <span className="btn-base bg-white text-[#DE4F02] border-2 border-[#FFE77A]/50 group-hover:bg-gradient-to-r group-hover:from-[#F57600] group-hover:to-[#DE4F02] group-hover:border-transparent group-hover:text-white w-full transition-all duration-500 py-4 text-base font-bold rounded-full shadow-sm text-center transform group-hover:scale-105">
              Select Dine In
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}

// Company Story component
function CompanyStory({ story, onEdit }) {
  if (!story && !onEdit) return null;

  if (story?.layout === 'side') {
    return (
      <section className="relative flex flex-col lg:flex-row w-full bg-white text-slate-900 overflow-hidden border-y border-slate-100 group">
        {onEdit && (
          <div className="absolute right-6 top-6 z-20">
            <button
              onClick={onEdit}
              className="btn-base border border-[#F57600]/30 bg-white/80 backdrop-blur text-[#DE4F02] transition hover:border-[#F57600] hover:bg-[#FFE77A]/50"
            >
              ✏️ Edit
            </button>
          </div>
        )}
        
        <div className="relative min-h-[300px] w-full lg:h-auto lg:w-1/2 overflow-hidden">
          {story.image_url && (
            <img 
              src={getImageUrl(story.image_url)} 
              alt={story.title || "Company Story"} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          )}
        </div>

        <div className={`flex w-full flex-col justify-center p-8 sm:p-12 lg:p-20 ${story.image_url ? 'lg:w-1/2 items-start text-left' : 'items-center text-center'}`}>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#DE4F02] mb-3">Discover Maleq Cuisine</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-800 mb-6 drop-shadow-sm">
            {story.title || 'Our Story'}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#FEEC48] to-[#F57600] mb-8 rounded-full"></div>
          <p className="text-lg text-slate-500 leading-relaxed whitespace-pre-line mb-10 font-medium">
            {story.description}
          </p>
          <div>
            <Link to="/customer/story" className="btn-base py-4 px-10 text-base font-black bg-white text-[#F57600] border-2 border-[#FFE77A] hover:bg-gradient-to-r hover:from-[#FF9633] hover:to-[#F57600] hover:border-transparent hover:text-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-full hover:-translate-y-1 hover:scale-105 inline-block">
              Read Full Story
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-[500px] flex items-center justify-center bg-slate-950 text-white py-24 px-6 overflow-hidden border-y border-slate-800">
      {/* Background Image with Dark Overlay */}
      {story?.image_url && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: `url(${getImageUrl(story.image_url)})` }}
          />
          <div className="absolute inset-0 bg-black/70" />
        </>
      )}

      {/* Edit Button (Admin) */}
      {onEdit && (
        <div className="absolute right-6 top-6 z-20">
          <button
            onClick={onEdit}
            className="btn-base border border-white/70 bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
          >
            ✏️ Edit
          </button>
        </div>
      )}
      
      {/* Foreground Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#FEEC48]">Discover Maleq Cuisine</p>
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg">
          {story?.title || 'Our Story'}
        </h2>
        
        {/* Decorative underline */}
        <div className="w-24 h-1.5 bg-gradient-to-r from-[#FEEC48] via-[#FF9633] to-[#F57600] mx-auto rounded-full shadow-sm"></div>
        
        <p className="text-lg md:text-xl text-slate-200 leading-relaxed whitespace-pre-line drop-shadow-sm font-medium mt-8">
          {story?.description}
        </p>

        {/* Link to the Full Story Page */}
        <div className="pt-10">
          <Link 
            to="/customer/story" 
            className="btn-base py-4 px-10 text-base font-black bg-gradient-to-r from-[#FF9633] to-[#F57600] text-white hover:from-[#F57600] hover:to-[#DE4F02] shadow-md hover:shadow-xl transition-all duration-300 rounded-full hover:-translate-y-1 hover:scale-105 inline-block"
          >
            Read Full Story
          </Link>
        </div>
      </div>
    </section>
  );
}

// Main Dashboard Sections Component
export default function DashboardSections({ 
  editable = false, 
  onEditSlideshow, 
  onEditStory 
}) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardConfig();
  }, []);

  const loadDashboardConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/dashboard/config`);
      setConfig(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard config:', err);
      setError('');
      // Don't show error to customer, just fail silently
    } finally {
      setLoading(false);
    }
  };

  const saveSlideshowMode = async (mode) => {
    if (!editable) return;

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(
        `${API_BASE}/api/dashboard/slideshow-mode`,
        { mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfig((prev) => (prev ? { ...prev, slideshowMode: mode } : prev));
    } catch (err) {
      console.error('Failed to save slideshow mode:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Slideshow Section */}
      {(config.slideshow?.length > 0 || editable) && (
        <div className="w-full">
          {editable && config.slideshow?.length > 0 && (
            <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-10 mt-6 max-w-7xl mx-auto">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Promotional Slideshow</h3>
              <button
                onClick={onEditSlideshow}
                className="btn-base border border-amber-300 bg-amber-50 text-amber-800 transition hover:border-amber-500 hover:bg-amber-100"
              >
                ✏️ Edit
              </button>
            </div>
          )}
          <Slideshow
            images={config.slideshow || []}
            editable={editable}
            initialMode={config.slideshowMode || 'fill'}
            onModeChange={saveSlideshowMode}
          />
        </div>
      )}

      {/* Order Method Selection Section */}
      <OrderMethodSelector />

      {/* Company Story Section */}
      <CompanyStory 
        story={config.story} 
        onEdit={editable ? onEditStory : null}
      />
    </div>
  );
}
