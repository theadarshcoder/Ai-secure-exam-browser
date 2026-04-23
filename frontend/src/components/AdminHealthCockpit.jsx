import React, { useEffect, useState } from 'react';
import socketService from '../services/socket';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const AdminHealthCockpit = ({ examId, currentUserId }) => {
    const [healthStats, setHealthStats] = useState({ liveStudents: 0, cpuLoad: 0, memoryUsage: 0, activeErrors: 0 });
    const [alerts, setAlerts] = useState([]);
    const [extendingTime, setExtendingTime] = useState(false);

    useEffect(() => {
        // Ensure we join the exam context
        const socket = socketService.connect();
        if (socket && examId) {
            socket.emit('join_exam', { userId: currentUserId, examId, role: 'admin' });
        }

        const handleServerHealth = (data) => {
            if (data.examId === examId) setHealthStats(data); // Filter for this exam only
        };

        const handleSystemAlert = (newAlert) => {
            if (newAlert.examId !== examId) return; // Filter cross-exam alerts

            setAlerts(prev => {
                // 🛑 ALERT DEDUPLICATION: Remove older alert of the same type
                const filtered = prev.filter(a => a.type !== newAlert.type);
                return [newAlert, ...filtered].slice(0, 5);
            });
        };

        if (socket) {
            socket.on('server_health', handleServerHealth);
            socket.on('system_alert', handleSystemAlert);
        }

        return () => {
            if (socket) {
                socket.off('server_health', handleServerHealth);
                socket.off('system_alert', handleSystemAlert);
            }
        };
    }, [examId, currentUserId]);

    const handleExtendTime = async () => {
        setExtendingTime(true);
        try {
            await api.post('/admin/extend-time', { examId, extraMinutes: 5 });
            toast.success('Added 5 minutes to exam!');
            setAlerts(prev => prev.filter(a => a.type !== 'SERVER_OVERLOAD')); // Clear alert on action
        } catch (error) {
            toast.error('Failed to extend exam time');
            console.error(error);
        }
        setExtendingTime(false);
    };

    // 🎨 SEVERITY MAPPING LOGIC
    const getAlertStyle = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 border-red-300 text-red-800';
            case 'warning': return 'bg-orange-50 border-orange-300 text-orange-800';
            default: return 'bg-blue-50 border-blue-300 text-blue-800'; // info
        }
    };

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Health Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Students</p>
                    <p className="text-2xl font-bold text-slate-900">{healthStats.liveStudents}</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">CPU Load</p>
                    <p className="text-2xl font-bold text-slate-900">{healthStats.cpuLoad}%</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Memory</p>
                    <p className="text-2xl font-bold text-slate-900">{healthStats.memoryUsage}%</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Errors/Min</p>
                    <p className="text-2xl font-bold text-slate-900">{healthStats.activeErrors}</p>
                </div>
            </div>
            
            {/* Alerts & Actions */}
            <div className={`p-5 rounded-2xl shadow-sm border-2 transition-all duration-300 ${
                alerts.some(a => a.severity === 'critical') ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-white'
            }`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">System Alerts</h3>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${alerts.length > 0 ? 'bg-red-400' : 'bg-green-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${alerts.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-4 pr-2 custom-scrollbar">
                    {alerts.length === 0 ? (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                            <span>✅</span>
                            <p className="text-xs font-medium text-green-700">System is stable</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div key={alert.id} className={`text-xs p-3 rounded-lg border flex items-center gap-3 shadow-sm ${getAlertStyle(alert.severity)}`}>
                                <span className="text-lg">{alert.severity === 'critical' ? '🛑' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                                <span className="font-medium leading-relaxed">{alert.message}</span>
                            </div>
                        ))
                    )}
                </div>

                <button 
                    onClick={handleExtendTime}
                    disabled={extendingTime}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 text-xs uppercase tracking-widest"
                >
                    {extendingTime ? 'Processing...' : '⚡ Extend Exam Time (5 Mins)'}
                </button>
            </div>
        </div>
    );
};

export default AdminHealthCockpit;
