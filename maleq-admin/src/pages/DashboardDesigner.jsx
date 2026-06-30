import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to construct full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`; // Relative path needs API base
  return path; // Return as-is if not an uploads path
};

export default function DashboardDesigner({ initialTab = 'slideshow' }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'featured' ? 'slideshow' : initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Slideshow State
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [slideshowForm, setSlideshowForm] = useState({ image_file: null, image_preview: '', alt_text: '' });

  // Featured Items State
  const [featuredItems, setFeaturedItems] = useState([]);
  const [availableMenuItems, setAvailableMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');

  // Company Story State (Home Page)
  const [companyStory, setCompanyStory] = useState(null);
  const [storyForm, setStoryForm] = useState({ title: '', description: '', layout: 'background', image_file: null, image_preview: '' });

  // Full Company Story State (Dedicated Page)
  const [fullStories, setFullStories] = useState([]);
  const [fullStoryForm, setFullStoryForm] = useState({ title: '', description: '', layout: 'background', image_file: null, image_preview: '' });

  const token = localStorage.getItem('accessToken');

  // Load all dashboard configuration on mount
  useEffect(() => {
    loadAllConfig();
    loadAvailableMenuItems();
  }, []);

  // Update active tab if initialTab prop changes
  useEffect(() => {
    if (initialTab && initialTab !== 'featured') {
      setActiveTab(initialTab);
    } else if (initialTab === 'featured') {
      setActiveTab('slideshow');
    }
  }, [initialTab]);

  const loadAllConfig = async () => {
    try {
      setLoading(true);
      const [slideshowRes, featuredRes, storyRes, fullStoryRes] = await Promise.all([
        axios.get(`${API_BASE}/api/dashboard/slideshow`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/dashboard/featured`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/dashboard/story`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/dashboard/story?type=full`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSlideshowImages(slideshowRes.data.images || []);
      setFeaturedItems(featuredRes.data.items || []);
      if (storyRes.data.story) {
        setCompanyStory(storyRes.data.story);
        setStoryForm({
          title: storyRes.data.story.title || '',
          description: storyRes.data.story.description || '',
          layout: storyRes.data.story.layout || 'background',
          image_file: null,
          image_preview: storyRes.data.story.image_url || ''
        });
      }
      if (fullStoryRes.data.story) {
        setFullStories(
          Array.isArray(fullStoryRes.data.story) 
            ? fullStoryRes.data.story 
            : [fullStoryRes.data.story]
        );
      }
      setError('');
    } catch (err) {
      // Suppress error messages gracefully - just log them
      console.error('Dashboard configuration not yet available', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMenuItems = async () => {
    try {
      // Try the admin menu API first (protected)
      const res = await axios.get(`${API_BASE}/api/admin/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Both endpoints return { success: true, items }
      setAvailableMenuItems(res.data.items || []);
    } catch (err) {
      // Fallback to public menu endpoint
      try {
        const res = await axios.get(`${API_BASE}/api/orders/menu`);
        setAvailableMenuItems(res.data.items || []);
      } catch (error) {
        console.error('Failed to load menu items:', error);
        setAvailableMenuItems([]);
      }
    }
  };

  // ==================== FILE HANDLING ====================

  const handleSlideshowImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlideshowForm({
          ...slideshowForm,
          image_file: file,
          image_preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStoryImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryForm({
          ...storyForm,
          image_file: file,
          image_preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFullStoryImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFullStoryForm({
          ...fullStoryForm,
          image_file: file,
          image_preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ==================== SLIDESHOW MANAGEMENT ====================

  const handleAddSlideshowImage = async (e) => {
    e.preventDefault();
    if (!slideshowForm.image_file) {
      setError('Please select an image');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', slideshowForm.image_file);
      formData.append('alt_text', slideshowForm.alt_text);

      await axios.post(`${API_BASE}/api/dashboard/slideshow`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Slideshow image added successfully');
      setSlideshowForm({ image_file: null, image_preview: '', alt_text: '' });
      setTimeout(() => setSuccess(''), 5000);
      loadAllConfig();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add slideshow image';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlideshowImage = async (id) => {
    if (confirm('Delete this slideshow image?')) {
      try {
        setLoading(true);
        await axios.delete(`${API_BASE}/api/dashboard/slideshow/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Slideshow image deleted');
        loadAllConfig();
      } catch (err) {
        setError('Failed to delete slideshow image');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateSlideshowPosition = async (id, position) => {
    try {
      await axios.put(
        `${API_BASE}/api/dashboard/slideshow/${id}`,
        { position },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadAllConfig();
    } catch (err) {
      setError('Failed to update slideshow position');
    }
  };

  // ==================== FEATURED ITEMS MANAGEMENT ====================

  const handleAddFeaturedItem = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem) {
      setError('Please select a menu item');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Check if already featured
    if (featuredItems.some(item => item.menu_item_id === parseInt(selectedMenuItem))) {
      setError('This item is already featured');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (featuredItems.length >= 5) {
      setError('Maximum 5 featured items allowed');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/dashboard/featured`,
        { menu_item_id: parseInt(selectedMenuItem) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Item added to featured');
      setSelectedMenuItem('');
      setTimeout(() => setSuccess(''), 5000);
      loadAllConfig();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add featured item';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeaturedItem = async (id) => {
    if (confirm('Remove this featured item?')) {
      try {
        await axios.delete(`${API_BASE}/api/dashboard/featured/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Item removed from featured');
        setTimeout(() => setSuccess(''), 5000);
        loadAllConfig();
      } catch (err) {
        setError('Failed to remove featured item');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // ==================== COMPANY STORY MANAGEMENT ====================

  const handleUpdateCompanyStory = async (e) => {
    e.preventDefault();
    if (!storyForm.title.trim() || !storyForm.description.trim()) {
      setError('Title and description are required');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', storyForm.title);
      formData.append('description', storyForm.description);
      formData.append('layout', storyForm.layout);
      if (storyForm.image_file) {
        formData.append('image', storyForm.image_file);
      }

      await axios.put(`${API_BASE}/api/dashboard/story`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Home page story saved successfully');
      setTimeout(() => setSuccess(''), 5000);
      loadAllConfig();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save home page story';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFullStory = async (e) => {
    e.preventDefault();
    if (!fullStoryForm.title.trim() || !fullStoryForm.description.trim()) {
      setError('Title and description are required');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', fullStoryForm.title);
      formData.append('description', fullStoryForm.description);
      formData.append('type', 'full');
      formData.append('layout', fullStoryForm.layout);
      if (fullStoryForm.image_file) {
        formData.append('image', fullStoryForm.image_file);
      }

      await axios.put(`${API_BASE}/api/dashboard/story`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Full story section added successfully');
      setTimeout(() => setSuccess(''), 5000);
      setFullStoryForm({ title: '', description: '', layout: 'background', image_file: null, image_preview: '' });
      loadAllConfig();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add full story section';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFullStory = async (id) => {
    if (!confirm('Delete this story section?')) return;
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/api/dashboard/story`, { action: 'delete', id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Story section deleted');
      setTimeout(() => setSuccess(''), 5000);
      loadAllConfig();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete story section');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Get available menu items for dropdown (excluding already featured)
  const getAvailableMenuItems = () => {
    const featuredIds = featuredItems.map(item => item.menu_item_id);
    return availableMenuItems.filter(item => !featuredIds.includes(item.id));
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Dashboard Designer</h2>
          <p className="text-sm font-medium text-slate-600">Customize the customer dashboard with pre-configured sections</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 mt-4 flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('slideshow')}
            className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
              activeTab === 'slideshow'
                ? 'border-b-2 border-orange-500 text-amber-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📸 Slideshow
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
              activeTab === 'story'
                ? 'border-b-2 border-orange-500 text-amber-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📖 Company Story
          </button>
          <button
            onClick={() => setActiveTab('full_story')}
            className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
              activeTab === 'full_story'
                ? 'border-b-2 border-orange-500 text-amber-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📚 Full Story Page
          </button>
        </div>

        {/* Content */}
        <div className="overflow-hidden bg-transparent">
          {/* SLIDESHOW TAB */}
          {activeTab === 'slideshow' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900">Slideshow Images</h3>
              <p className="text-sm text-slate-600 font-medium">Add promotional images to display in a slideshow on the customer dashboard</p>

              {/* Add Image Form */}
              <form onSubmit={handleAddSlideshowImage} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div>
                  <label className="label">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlideshowImageChange}
                    className="input bg-white"
                  />
                  <p className="mt-2 text-xs text-slate-500 font-medium">
                    Recommended size: 1920x1080 (16:9). This matches the slideshow best and reduces unwanted cropping.
                    Admins can set Fit or Fill in dashboard preview, and customers will see that same saved mode.
                  </p>
                  {slideshowForm.image_preview && (
                    <img
                      src={getImageUrl(slideshowForm.image_preview)}
                      alt="Preview"
                      className="mt-3 h-32 w-auto rounded-xl shadow-sm"
                    />
                  )}
                </div>
                <div>
                  <label className="label">Alt Text</label>
                  <input
                    type="text"
                    placeholder="Brief description of the image"
                    value={slideshowForm.alt_text}
                    onChange={(e) => setSlideshowForm({ ...slideshowForm, alt_text: e.target.value })}
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !slideshowForm.image_file}
                  className="btn-base bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Add Image'}
                </button>
              </form>

              {/* Images List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Current Slideshow Images ({slideshowImages.length})</h3>
                {slideshowImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                      <span className="text-2xl text-amber-500">📸</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No images yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 bg-white rounded-3xl border border-slate-200 p-2">
                    {slideshowImages.map((image) => (
                      <div key={image.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{image.alt_text || 'Untitled'}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-xs md:max-w-md mt-0.5">{image.image_url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={image.position}
                            onChange={(e) => handleUpdateSlideshowPosition(image.id, parseInt(e.target.value))}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 bg-white"
                          >
                            {Array.from({ length: slideshowImages.length }).map((_, i) => (
                              <option key={i} value={i}>Position {i + 1}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteSlideshowImage(image.id)}
                            className="btn-base px-3 py-1.5 text-xs border border-red-200 bg-white text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* COMPANY STORY TAB */}
          {activeTab === 'story' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900">Home Page Story</h3>
              <p className="text-sm font-medium text-slate-600">Customize the short company story section shown on the customer dashboard</p>

              <form onSubmit={handleUpdateCompanyStory} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    value={storyForm.title}
                    onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                    className="input bg-white"
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={storyForm.description}
                    onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                    rows={6}
                    className="input bg-white resize-y"
                    placeholder="Tell your company's story..."
                  />
                </div>
                <div>
                  <label className="label mb-2">Design Layout</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="home_layout"
                        value="background"
                        checked={storyForm.layout === 'background'}
                        onChange={(e) => setStoryForm({ ...storyForm, layout: e.target.value })}
                        className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Background Image</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="home_layout"
                        value="side"
                        checked={storyForm.layout === 'side'}
                        onChange={(e) => setStoryForm({ ...storyForm, layout: e.target.value })}
                        className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Side Image</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStoryImageChange}
                    className="input bg-white"
                  />
                  {storyForm.image_preview && (
                    <img
                      src={getImageUrl(storyForm.image_preview)}
                      alt="Story preview"
                      className="mt-3 h-48 w-full rounded-2xl object-cover shadow-sm"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-base bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Company Story'}
                </button>
              </form>

              {companyStory && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Current Story Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Title</p>
                      <p className="font-bold text-slate-900">{companyStory.title}</p>
                    </div>
                    {companyStory.description && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</p>
                        <p className="text-sm font-medium text-slate-700 line-clamp-3">{companyStory.description}</p>
                      </div>
                    )}
                    {companyStory.image_url && (
                      <img src={getImageUrl(companyStory.image_url)} alt={companyStory.title} className="h-32 w-32 rounded object-cover" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FULL COMPANY STORY TAB */}
          {activeTab === 'full_story' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900">Full Story Page Sections</h3>
              <p className="text-sm font-medium text-slate-600">Add multiple full-screen story sections to create an immersive "Our Story" page.</p>

              <form onSubmit={handleAddFullStory} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h4 className="text-lg font-bold text-slate-900 mb-2">Add New Section</h4>
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    value={fullStoryForm.title}
                    onChange={(e) => setFullStoryForm({ ...fullStoryForm, title: e.target.value })}
                    className="input bg-white"
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={fullStoryForm.description}
                    onChange={(e) => setFullStoryForm({ ...fullStoryForm, description: e.target.value })}
                    rows={6}
                    className="input bg-white resize-y"
                    placeholder="Tell your company's full history and vision..."
                  />
                </div>
                <div>
                  <label className="label mb-2">Design Layout</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="layout"
                        value="background"
                        checked={fullStoryForm.layout === 'background'}
                        onChange={(e) => setFullStoryForm({ ...fullStoryForm, layout: e.target.value })}
                        className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Background Image</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="layout"
                        value="side"
                        checked={fullStoryForm.layout === 'side'}
                        onChange={(e) => setFullStoryForm({ ...fullStoryForm, layout: e.target.value })}
                        className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Side Image</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFullStoryImageChange}
                    className="input bg-white"
                  />
                  {fullStoryForm.image_preview && (
                    <img
                      src={getImageUrl(fullStoryForm.image_preview)}
                      alt="Story preview"
                      className="mt-3 h-48 w-full rounded-2xl object-cover shadow-sm"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-base bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Story Section'}
                </button>
              </form>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Current Story Sections ({fullStories.length})</h3>
                {fullStories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                      <span className="text-2xl text-amber-500">📚</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No story sections</p>
                  </div>
                ) : (
                  <div className="space-y-3 bg-white rounded-3xl border border-slate-200 p-2">
                    {fullStories.map(story => (
                      <div key={story.id} className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-amber-50/50">
                    {story.image_url && (
                          <img src={getImageUrl(story.image_url)} alt={story.title} className="h-24 w-36 rounded-xl object-cover shadow-sm shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{story.title}</p>
                          <p className="text-sm font-medium text-slate-600 mt-1 line-clamp-2">{story.description}</p>
                          <span className="mt-2 inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Layout: {story.layout === 'side' ? 'Side Image' : 'Background Image'}
                      </span>
                    </div>
                        <button type="button" onClick={() => handleDeleteFullStory(story.id)} className="btn-base h-fit px-3 py-1.5 text-xs border border-red-200 bg-white text-red-600 hover:bg-red-50 shrink-0">Delete</button>
                  </div>
                ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}