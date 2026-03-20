import React from 'react';
import { 
  Shield, Clock, Lock, CheckCircle, Activity, Users, ScanFace, 
  MonitorCheck, ShieldAlert, Cpu, Network, Server, FileCheck, 
  Lightbulb, Power, Video, ServerCrash 
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export default function LandingPage() {
  const features = [
    { title: "Zero-Latency Streaming", desc: "Optimized WebRTC protocols for seamless video proctoring without lagging your exam timer.", icon: <Video size={28} className="text-primary-600" /> },
    { title: "Anti-VM Protection", desc: "Advanced detection algorithms that block Virtual Machines, RDPs, and Screen-Sharing tools.", icon: <Cpu size={28} className="text-primary-600" /> },
    { title: "Dynamic Flagging System", desc: "Intelligent event logging that differentiates between an accidental glance and a potential violation.", icon: <Activity size={28} className="text-primary-600" /> },
    { title: "Shield-Grade Encryption", desc: "All exam data and video streams are encrypted with AES-256 bit protocols, ensuring that your privacy and exam integrity are never compromised.", icon: <Lock size={28} className="text-primary-600" /> },
    { title: "AI-Powered Vigilance", desc: "Our proprietary 'Eye-Sense' technology monitors gaze patterns and background movement to provide a fair testing ground for every candidate.", icon: <ScanFace size={28} className="text-primary-600" /> },
    { title: "Offline Resilience", desc: "Never lose progress. ProctoShield's 'Sync-Back' technology allows you to continue your exam during internet outages and syncs data once you're back online.", icon: <Server size={28} className="text-primary-600" /> }
  ];

  const workflowSteps = [
    { step: "01", title: "Biometric Handshake", desc: "A quick 3-second face scan to verify your identity against university records.", icon: <ScanFace className="text-primary-500" size={32} /> },
    { step: "02", title: "Environment Lockdown", desc: "ProctoShield temporarily disables background apps, notifications, and secondary displays.", icon: <ShieldAlert className="text-primary-500" size={32} /> },
    { step: "03", title: "Live Intelligent Proctoring", desc: "Our AI monitors your session in real-time to ensure a fair and distraction-free environment.", icon: <Activity className="text-primary-500" size={32} /> }
  ];

  const requirements = [
    { label: "Camera", desc: "720p HD Webcam required." },
    { label: "Internet", desc: "Minimum 1.5 Mbps stable connection." },
    { label: "Browser", desc: "ProctoShield Desktop Client (Latest Version)." },
    { label: "Background", desc: "High-contrast lighting recommended for AI accuracy." }
  ];

  const stats = [
    { label: "Exams Monitored", value: "2M+", icon: <Activity size={24} /> },
    { label: "Active Institutions", value: "500+", icon: <Users size={24} /> },
    { label: "System Uptime", value: "99.9%", icon: <CheckCircle size={24} /> }
  ];

  const readiness = [
    { label: "Integrity Check", text: "Verifying browser kernel integrity to ensure a secure, sandbox environment.", icon: <ShieldAlert size={18} /> },
    { label: "Peripheral Audit", text: "Scanning for unauthorized external displays, virtual drivers, or remote desktop protocols.", icon: <MonitorCheck size={18} /> },
    { label: "Environment Analysis", text: "Calibrating AI models for real-time facial recognition and gaze tracking.", icon: <ScanFace size={18} /> },
    { label: "Network Stability", text: "Optimizing data packets for low-latency live proctoring and encrypted local caching.", icon: <Network size={18} /> }
  ];

  const instructions = [
    { title: "Clear Workspace", desc: "Ensure your desk is free of books, phones, or unauthorized electronics.", icon: <FileCheck className="text-primary-500" size={24} /> },
    { title: "Verify Lighting", desc: "Sit in a well-lit area where your face is clearly visible to the camera.", icon: <Lightbulb className="text-primary-500" size={24} /> },
    { title: "Close Apps", desc: "Ensure communication tools (Discord, Slack, Zoom) are completely shut down.", icon: <ServerCrash className="text-primary-500" size={24} /> },
    { title: "Connect Power", desc: "Online proctoring is resource-heavy; keep your device plugged into a power source.", icon: <Power className="text-primary-500" size={24} /> }
  ];

  return (
    <div className="page-wrapper p-0 m-0 overflow-hidden relative bg-[#fafafa]">
      <Navbar />
      
      {/* Vercel-style Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] z-0 m-auto h-[400px] w-[600px] rounded-full bg-primary-500 opacity-[0.15] blur-[120px]"></div>

      {/* 1. Hero Section */}
      <main className="hero-section relative z-10 pt-28 pb-20">
        <div className="hero-content smooth-appear max-w-4xl mx-auto text-center px-4">
          <span className="inline-flex items-center gap-2 border border-primary-100 bg-primary-50/50 text-primary-700 font-semibold px-4 py-1.5 rounded-full text-xs tracking-wide uppercase mb-6 cursor-default shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span> Next Generation AI Proctoring
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0f172a] tracking-tight mb-6 leading-[1.1]">
            Secure Exams, <br className="hidden md:block" /> Intelligently Monitored.
          </h1>
          <p className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            ProctoShield provides a secure, reliable, and fair environment for academic and professional online examinations globally.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => window.location.href='/login'} className="bg-[#6366f1] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-[0_8px_24px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-all w-full sm:w-auto active:scale-[0.98] hover:scale-[1.03] active:scale-95 transition-transform duration-300">
              Start Free Trial
            </button>
            <button className="bg-transparent border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-bold text-base hover:bg-slate-50 hover:text-slate-900 transition-all w-full sm:w-auto active:scale-[0.98] hover:scale-[1.03] active:scale-95 transition-transform duration-300">
              Book a Demo
            </button>
          </div>
        </div>
      </main>

      {/* 2. Stats Section */}
      <section className="stats-section relative z-10 smooth-appear" style={{ animationDelay: '0.2s' }}>
        <div className="stats-grid">
          {stats.map((stat, idx) => (
             <div key={idx} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Security Pulse / System Readiness */}
      <section className="readiness-section relative z-10 smooth-appear" style={{ animationDelay: '0.3s' }}>
        <div className="text-center mb-12 relative z-10 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-3">
            <Activity className="text-primary-400" size={32} /> The Security Pulse
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Before you even click "Start", our engine verifies complete system readiness.</p>
        </div>
        <div className="readiness-grid">
          {readiness.map((item, idx) => (
            <div key={idx} className="readiness-card group cursor-default">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 group-hover:text-primary-300 transition-colors">
                  {item.icon} {item.label}
                </h4>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Active</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW: 3-Step Integrity Workflow */}
      <section className="py-24 bg-white relative z-10 smooth-appear">
        <div className="text-center mb-16 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">The 3-Step Integrity Workflow</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">A seamless, automated process to ensure complete academic fairness.</p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-0.5 bg-slate-100 z-0"></div>
          
          {workflowSteps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center relative z-10 group cursor-default hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-white border-2 border-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mb-6 shadow-sm group-hover:scale-[1.15] group-hover:-rotate-12 transition-transform duration-300">
                Step {step.step}
              </div>
              <div className="mb-4 bg-primary-50 p-4 rounded-2xl text-primary-600 group-hover:bg-primary-100 group-hover:scale-[1.15] group-hover:rotate-6 transition-all duration-300 shadow-sm border border-primary-100/50">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Deep-Dive Feature Cards */}
      <section className="features-section bg-[#fafafa] relative z-10 smooth-appear border-y border-slate-100 py-24">
        <div className="text-center mb-16 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-4 tracking-tight">Technical Deep-Dive</h2>
          <p className="text-[#64748b] max-w-2xl mx-auto text-lg">Industry-leading monitoring architecture built for scale.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-xl border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all cursor-default group hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary-100 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0f172a] mb-3">{feature.title}</h3>
              <p className="text-sm font-medium text-[#64748b] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Area: Pre-Flight, Trust, Requirements */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Instructions & Trust */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                <FileCheck className="text-primary-500" /> Candidate Pre-Flight Checklist
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-100 transition-colors">
                    <div className="text-primary-500">{inst.icon}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1 text-sm">{inst.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{inst.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-8 sm:p-10 shadow-[0_8px_24px_rgba(0,0,0,0.02)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <h2 className="text-xl font-bold text-emerald-900 mb-6 tracking-tight flex items-center gap-2">
                <Shield className="text-emerald-600" /> Privacy & Trust Protocol
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-[#0f172a] mb-1">Privacy First</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">We only record data during the active exam window. No data is accessed before you click "Start" or after you "Submit".</p>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0f172a] mb-1">Automated Data Purge</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">Video logs are stored securely and automatically purged after 30 days of result validation, ensuring strict privacy compliance.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: System Requirements Sidebar */}
          <div className="lg:col-span-4 h-full">
            <div className="bg-[#0f172a] rounded-xl p-8 text-white h-full relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.15)] flex flex-col">
              <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-primary-600 rounded-full filter blur-[60px] opacity-30"></div>
              <h3 className="text-xl font-bold mb-8 tracking-tight flex items-center gap-2 relative z-10 text-white">
                <Cpu className="text-primary-400" /> System Requirements
              </h3>
              <ul className="space-y-6 relative z-10 flex-grow">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex flex-col gap-1 border-b border-slate-800 pb-4 last:border-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.label}</span>
                    <span className="text-sm text-slate-200 font-medium">{req.desc}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                <button className="w-full primary-btn bg-white text-slate-900 hover:bg-slate-100 !shadow-none text-sm font-bold">
                  Run Diagnostics Tool
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer / Policy Snippet */}
      <footer className="footer-section bg-slate-50">
        <div className="footer-policy">
          <h5 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2"><Lock size={14} className="text-slate-400" /> Security Protocol</span>
            <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">v3.1.0</span>
          </h5>
          <p className="mt-3 text-slate-500">
            By logging in, you consent to real-time AI monitoring of your webcam, microphone, and screen. Any attempt to switch tabs, use shortcuts (Alt+Tab, Ctrl+C/V), or run virtual machines will result in an automatic session termination and an immediate report to the administrator.
          </p>
        </div>
        <p className="text-xs text-slate-400 font-medium pb-8 pl-6 text-left max-w-4xl mx-auto">© 2026 ProctoShield System Solutions. Built for academic integrity.</p>
      </footer>
    </div>
  );
}

