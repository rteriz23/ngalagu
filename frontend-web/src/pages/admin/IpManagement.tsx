import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface IpRecord {
  id: number;
  ip_address: string;
  status: string;
  reason: string;
  created_at: string;
}

export const IpManagement: React.FC = () => {
  const { token, user } = useAuthStore();
  const [ips, setIps] = useState<IpRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/ips`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setIps(res.data.data);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal memuat daftar IP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, [token]);

  const handleUpdateStatus = async (ip: string, newStatus: string) => {
    try {
      await axios.post(`${API_BASE}/admin/ips`, { ip_address: ip, status: newStatus, reason: `Manual status change to ${newStatus}` }, { headers: { Authorization: `Bearer ${token}` } });
      fetchIps();
    } catch (e) {
      alert('Gagal memperbarui status IP');
    }
  };

  const handleDelete = async (ip: string) => {
    if (window.confirm(`Hapus aturan untuk IP ${ip}?`)) {
      try {
        await axios.delete(`${API_BASE}/admin/ips?ip=${ip}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchIps();
      } catch (e) {
        alert('Gagal menghapus IP');
      }
    }
  };

  if (user?.id !== 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <h1 className="text-2xl text-red-500 font-bold">403 FORBIDDEN - AKSES DITOLAK</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="text-red-500 w-8 h-8" />
              Sistem Keamanan & WAF (Ngalagu)
            </h1>
            <p className="text-slate-400 mt-2">Kelola alamat IP yang diblokir atau di-whitelist.</p>
          </div>
          <button onClick={fetchIps} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="p-4 font-semibold text-slate-300">IP Address</th>
                <th className="p-4 font-semibold text-slate-300">Status</th>
                <th className="p-4 font-semibold text-slate-300">Alasan / Reason</th>
                <th className="p-4 font-semibold text-slate-300">Tanggal</th>
                <th className="p-4 font-semibold text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ips.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-mono text-slate-300">{row.ip_address}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${row.status === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm max-w-xs truncate" title={row.reason}>{row.reason}</td>
                  <td className="p-4 text-slate-400 text-sm">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="p-4 flex gap-2">
                    {row.status === 'blocked' ? (
                      <button onClick={() => handleUpdateStatus(row.ip_address, 'whitelist')} className="p-2 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20" title="Pindah ke Whitelist">
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateStatus(row.ip_address, 'blocked')} className="p-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20" title="Pindah ke Blacklist">
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(row.ip_address)} className="p-2 bg-slate-800 text-slate-400 rounded-md hover:text-red-400 hover:bg-slate-700" title="Hapus Aturan">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {ips.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data IP di sistem WAF.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
