import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Cpu, HardDrive, Wrench, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, disk: 0, status: 'HEALTHY' });
  const [history, setHistory] = useState([]);
  const [logInput, setLogInput] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Poll live metrics every 3 seconds & append to chart history
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/metrics');
        const data = res.data;
        setMetrics(data);
        setErrorStatus(null);

        const timeString = new Date().toLocaleTimeString().split(' ')[0];
        setHistory((prev) => [
          ...prev.slice(-14), // Keep last 15 data points
          { time: timeString, cpu: data.cpu, memory: data.memory }
        ]);
      } catch (err) {
        console.error("Backend Disconnected", err);
        setErrorStatus("Backend Disconnected (Run python main.py in D:\\ServerCare)");
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeLog = async () => {
    if (!logInput) return;
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/analyze-log', {
        log_text: logInput
      });
      const rawAnalysis = res.data.analysis;
      const parsedData = typeof rawAnalysis === 'string' ? JSON.parse(rawAnalysis) : rawAnalysis;
      setAiResponse(parsedData);
    } catch (err) {
      alert("AI Analysis Error: Check Backend Terminal & Gemini API Key.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8' }}>
        🤖 ServerCare — AI Digital Mechanic Dashboard
      </h2>

      {errorStatus && (
        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ <strong>Connection Error:</strong> {errorStatus}
        </div>
      )}
      
      {/* Metric Cards */}
      <div style={{ display: 'flex', gap: '20px', margin: '25px 0' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', flex: 1, borderTop: '4px solid #3b82f6' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><Cpu/> CPU Load</h3>
          <h1 style={{ fontSize: '38px', margin: '10px 0' }}>{metrics.cpu}%</h1>
        </div>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', flex: 1, borderTop: '4px solid #a855f7' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><Activity/> Memory Utilization</h3>
          <h1 style={{ fontSize: '38px', margin: '10px 0' }}>{metrics.memory}%</h1>
        </div>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', flex: 1, borderTop: '4px solid #10b981' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}><HardDrive/> Disk Usage</h3>
          <h1 style={{ fontSize: '38px', margin: '10px 0' }}>{metrics.disk}%</h1>
        </div>
      </div>

      {/* Live Recharts Graph */}
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h3 style={{ color: '#38bdf8', marginTop: 0 }}>📈 Live Telemetry History (CPU & Memory)</h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis domain={[0, 100]} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="CPU %" />
              <Area type="monotone" dataKey="memory" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} name="Memory %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Incident Diagnostics */}
      <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#f8fafc' }}>
          <Wrench color="#f59e0b"/> AI Incident Diagnostics & Remediation
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Input raw server error logs below for real-time AI root cause analysis:</p>
        
        <textarea 
          rows="4" 
          value={logInput} 
          onChange={(e) => setLogInput(e.target.value)}
          placeholder="e.g., [ERROR] Nginx failed to start: Port 80 is already in use by PID 4120"
          style={{ width: '98%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#38bdf8', border: '1px solid #475569', fontSize: '14px', fontFamily: 'monospace' }}
        />
        <br />
        <button 
          onClick={handleAnalyzeLog} 
          disabled={loading}
          style={{ marginTop: '15px', padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? "AI Mechanic Analyzing..." : "Run AI Diagnostics"}
        </button>

        {aiResponse && (
          <div style={{ marginTop: '20px', padding: '20px', background: '#0369a1', borderRadius: '8px', borderLeft: '6px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Root Cause: {aiResponse.issue}</h4>
            <p style={{ margin: '8px 0' }}>
              <strong>Generated Fix Command:</strong> <code style={{ background: '#0f172a', padding: '4px 10px', borderRadius: '4px', color: '#4ade80' }}>{aiResponse.command}</code>
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>AI Safety Shield Score:</strong> <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{aiResponse.safety_score}/100</span>
            </p>
            <button 
              onClick={() => alert(`[AUTO-REPAIR EXECUTED] ${aiResponse.command}`)}
              style={{ marginTop: '12px', backgroundColor: '#16a34a', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle size={18}/> Execute One-Click Auto Fix
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;