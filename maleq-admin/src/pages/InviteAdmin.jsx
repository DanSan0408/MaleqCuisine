import { useState } from 'react';
import axios from 'axios';

export default function InviteAdmin({ onCancel }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post('http://localhost:5000/api/admin/invite', 
                { email, password },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("New Admin invited successfully!");
            if (onCancel) onCancel(true);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to invite admin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md card-elevated p-8 animate-fade-in-up">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Team Expansion</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Invite Admin</h2>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
                <div>
                    <label className="label">New Admin Email</label>
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
                    <label className="label">Set Temporary Password</label>
                    <input 
                        type="password" 
                        placeholder="Choose password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="input"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <button 
                            type="button" 
                            onClick={() => onCancel(false)}
                            className="btn-base flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 justify-center"
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-base flex-1 bg-orange-500 text-white hover:bg-orange-600 justify-center disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Invitation'}
                    </button>
                </div>
            </form>
        </div>
    );
}