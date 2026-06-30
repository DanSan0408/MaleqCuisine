import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function AddAdmin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post('http://localhost:5000/api/superadmin/add-admin', 
                { email, password },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Admin added successfully!");
            navigate('/superadmin/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || "Failed to add admin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_34%,_#ffffff_72%)] px-4 py-10 flex flex-col items-center justify-center text-slate-900">
            <div className="w-full max-w-md card-elevated p-8 animate-fade-in-up">
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Superadmin Action</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Add New Admin</h2>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                        <label className="label">Admin Email</label>
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Temporary Password</label>
                        <input 
                            type="password" 
                            placeholder="Set password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="input"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-base w-full justify-center bg-orange-500 text-white hover:bg-orange-600 py-3 text-base mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Admin'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                    <Link 
                        to="/superadmin/dashboard" 
                        className="text-sm font-bold text-amber-700 hover:text-amber-800"
                    >
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}