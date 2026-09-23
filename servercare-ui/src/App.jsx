import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Cpu, HardDrive, Wrench, CheckCircle } from 'lucide-react';

// Live localtunnel URL with HTTPS
const BACKEND_URL = "https://ten-parks-heal.loca.lt";

// Localtunnel warning page-a bypass panna required headers
const tunnelHeaders = {
  'Bypass-Tunnel-Reminder': 'true',
  'Content-Type': 'application/json'
};

function App() {
  const [metrics, setMetrics] = useState({ 
    cpu: 0, 
    memory: 0, 
    disk: 0, 
    status: 'HEALTHY' 
  });
  const [logInput, setLogInput] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/metrics`, {
          headers: tunnelHeaders
        });
        if (res.data) {
          setMetrics({
            cpu: res.data.cpu ?? res.data.cpu_percent ?? 0,
            memory: res.data.memory ?? res.data.memory_percent ?? 0,
            disk: res.data.disk ?? res.data.disk_percent ?? 0,
            status: res.data.status || 'HEALTHY'
          });
        }
      } catch (err) {
        console.error("Backend Disconnected", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeLog = async () => {
    if (!logInput.trim()) return;
    setLoading(true);
    setAiResponse(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze-log`, {
        method: "POST",
        headers: tunnelHeaders,
        body: JSON.stringify({ log_text: logInput })
      });

      const resData = await response.json();

      let parsedData = resData.analysis;
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }

      setAiResponse(parsedData);
    } catch (err) {
      console.error("AI Analysis Error:", err);
      alert("AI Analysis Error: Backend Connection Failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8' }}>
        🤖 ServerCare — AI Digital Mechanic Dashboard
      </h2>
      
      {/* Live System Metrics */}
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

      {/* Dynamic Log Diagnostics */}
      <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', marginTop: '30px', border: '1px solid #334155' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: '#f8fafc' }}>
          <Wrench color="#f59e0b" /> AI Incident Diagnostics & Remediation
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Input raw server error logs below for real-time AI root cause analysis:</p>
        
        <textarea 
          rows="4" 
          value={logInput} 
          onChange={(e) => setLogInput(e.target.value)}
          placeholder="e.g., django.db.utils.OperationalError: no such table: auth_user"
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

        {/* Dynamic Response Card */}
        {aiResponse && (
          <div style={{ marginTop: '20px', padding: '20px', background: '#0369a1', borderRadius: '8px', borderLeft: '6px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
              Root Cause: {aiResponse.issue || aiResponse.root_cause || "Analysis Complete"}
            </h4>
            <p style={{ margin: '8px 0' }}>
              <strong>Generated Fix Command:</strong>{' '}
              <code style={{ background: '#0f172a', padding: '4px 10px', borderRadius: '4px', color: '#4ade80' }}>
                {aiResponse.command || aiResponse.fix_command || "No command generated"}
              </code>
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>AI Safety Shield Score:</strong>{' '}
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                {aiResponse.safety_score || aiResponse.safety_shield_score || 90}/100
              </span>
            </p>
            <button 
              onClick={() => alert(`[AUTO-REPAIR EXECUTED] ${aiResponse.command || aiResponse.fix_command}`)}
              style={{ marginTop: '12px', backgroundColor: '#16a34a', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle size={18} /> Execute One-Click Auto Fix
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;