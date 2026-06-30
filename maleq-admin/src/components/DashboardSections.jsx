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
            <div className="absolute inset-0 bg-black/20" />
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
                className={`h-2 w-2 rounded-full transition ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
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
    <section className="py-16 lg:py-24 w-full px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto text-center animate-fade-in-up stagger-2">
      <div className="flex flex-col items-center justify-center mb-12 w-full">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 mb-2">Order Online</p>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">How would you like to order today?</h2>
        <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full mt-4"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-2">
        {/* Delivery Card */}
        <button
          onClick={() => handleSelectType('delivery')}
          className="flex flex-col items-center justify-between p-8 rounded-3xl border-2 border-slate-100 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-[0_24px_50px_rgba(249,115,22,0.12)] hover:-translate-y-1 text-center group h-full"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 mb-6 shrink-0 shadow-sm">
            <span className="text-3xl">🚚</span>
          </div>
          <div className="flex flex-col h-full justify-between items-center w-full">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delivery</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Get hot, fresh meals delivered straight to your doorstep. Fast and reliable service.
              </p>
            </div>
            <span className="btn-base bg-orange-500 text-white hover:bg-orange-600 w-full group-hover:bg-orange-600 transition-colors duration-300 py-3 font-bold rounded-2xl shadow-sm text-center">
              Select Delivery
            </span>
          </div>
        </button>

        {/* Pickup Card */}
        <button
          onClick={() => handleSelectType('pickup')}
          className="flex flex-col items-center justify-between p-8 rounded-3xl border-2 border-slate-100 bg-white transition-all duration-300 hover:border-amber-500 hover:shadow-[0_24px_50px_rgba(245,158,11,0.12)] hover:-translate-y-1 text-center group h-full"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 mb-6 shrink-0 shadow-sm">
            <span className="text-3xl">🏪</span>
          </div>
          <div className="flex flex-col h-full justify-between items-center w-full">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Pickup</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Skip the line. Order ahead and pick up your meal at your nearest branch location.
              </p>
            </div>
            <span className="btn-base bg-amber-500 text-white hover:bg-amber-600 w-full group-hover:bg-amber-600 transition-colors duration-300 py-3 font-bold rounded-2xl shadow-sm text-center">
              Select Pickup
            </span>
          </div>
        </button>

        {/* Dine In Card */}
        <button
          onClick={() => handleSelectType('dine_in')}
          className="flex flex-col items-center justify-between p-8 rounded-3xl border-2 border-slate-100 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-[0_24px_50px_rgba(249,115,22,0.12)] hover:-translate-y-1 text-center group h-full"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 mb-6 shrink-0 shadow-sm">
            <span className="text-3xl">🍽️</span>
          </div>
          <div className="flex flex-col h-full justify-between items-center w-full">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Dine In</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Reserve your table and order from your table inside our restaurant for fine dining.
              </p>
            </div>
            <span className="btn-base bg-orange-500 text-white hover:bg-orange-600 w-full group-hover:bg-orange-600 transition-colors duration-300 py-3 font-bold rounded-2xl shadow-sm text-center">
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
      <section className="relative flex flex-col lg:flex-row w-full bg-white text-slate-900 overflow-hidden border-y border-slate-200 group">
        {onEdit && (
          <div className="absolute right-6 top-6 z-20">
            <button
              onClick={onEdit}
              className="btn-base border border-amber-300 bg-amber-50 text-amber-800 transition hover:border-amber-500 hover:bg-amber-100"
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
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 mb-2">Discover Maleq Cuisine</p>
          <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
            {story.title || 'Our Story'}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line mb-8 font-medium">
            {story.description}
          </p>
          <div>
            <Link to="/customer/story" className="btn-base py-3 px-8 text-base bg-slate-900 text-white hover:bg-amber-700">
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
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">Discover Maleq Cuisine</p>
        <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
          {story?.title || 'Our Story'}
        </h2>
        
        {/* Decorative underline */}
        <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
        
        <p className="text-lg md:text-xl text-slate-200 leading-relaxed whitespace-pre-line drop-shadow-sm font-medium">
          {story?.description}
        </p>

        {/* Link to the Full Story Page */}
        <div className="pt-8">
          <Link 
            to="/customer/story" 
            className="btn-base py-3 px-8 text-base bg-orange-500 text-white hover:bg-orange-600"
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
