import React, { useState, useEffect } from 'react';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // State for upload configuration flow matrices
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedSubDomain, setSelectedSubDomain] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Authentication states
  const [isSignup, setIsSignup] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });

  // Fetch Leaderboard metrics from backend server automatically
  useEffect(() => {
    fetch('http://localhost:5000/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(data))
      .catch(err => console.log("Leaderboard connectivity error:", err));
  }, [result]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    // Dynamically switch routes depending on if user is brand new or returning
    const endpoint = isSignup ? 'signup' : 'login';
    
    // Explicitly package only email and password to prevent schema mismatches
    const payload = {
      email: authForm.email,
      password: authForm.password
    };

    try {
      const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        // Save security web token securely to browser memory storage
        localStorage.setItem('token', data.token);
        
        // If your backend doesn't return a custom username/avatar field anymore, 
        // we substitute a friendly generic fallback avatar for the visual navbar panel.
        setUser(data.user || { username: authForm.email.split('@')[0], profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" });
        
        setShowAuthModal(false);
        alert(isSignup ? "🎉 Account initialized and registered successfully!" : "🔑 Welcome back! Access matrix verified.");
      } else {
        // Display the direct error response message returned straight from MongoDB/Express layers
        alert(data.message || `System Validation Failure (${response.status})`);
      }
    } catch (err) {
      console.error("Auth submit connection fault:", err);
      alert("⚠️ Cannot establish contact with Backend Gateway server. Verify port 5000 is running.");
    }
  };

  const handleFileAnalysisPipeline = async () => {
    if (!user) {
      alert("⚠️ Access Denied! Please Sign Up or Log In first to parse records.");
      setShowAuthModal(true);
      return;
    }
    if (!file) return alert("Please upload a resume file (.pdf/.jpeg/.png)");

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('domain', selectedDomain);
    formData.append('subDomain', selectedSubDomain);
    formData.append('branch', selectedBranch);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.message || "Analysis error occurred");
      }
    } catch (err) {
      console.error(err);
      alert("AI Processing execution pipeline dropped.");
    } finally {
      setAnalyzing(false);
    }
  };

  // ✅ NEW SECURED DOWN-STREAMING HANDLER: Inject Authorization headers directly into file download requests
  const handleSecurePDFDownload = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/download-pdf/${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download PDF");
      }

      // Convert response stream to blob binary and trigger dynamic window browser layout event saving
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `AI_Resume_Audit_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Secure download failed:", err);
      alert("⚠️ Download Verification Failed: " + err.message);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark-comfort-bg text-slate-100' : 'light-comfort-bg text-slate-800'}`}>
      
      {/* Navbar Layout Row */}
      <nav className={`p-4 flex justify-between items-center border-b ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/70'} backdrop-blur-md`}>
        <h1 className="text-xl font-bold tracking-wider text-emerald-400">LinuxAi2026 Engine</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            {darkMode ? '☀️ Light Mode Comfort' : '🌙 Dark Mode Comfort'}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <img src={user.profilePic} alt="avatar" className="w-8 h-8 rounded-full border-2 border-emerald-500" />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          ) : (
            <button onClick={() => { setIsSignup(true); setShowAuthModal(true); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all">
              Sign Up / Login
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Dynamic High-Score Leaderboard Segment */}
        <section className="text-center space-y-4">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">🔥 Top Matrix Performers (Leaderboard)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {leaderboard.length > 0 ? leaderboard.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex items-center gap-4 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <img src={item.profilePic} alt="" className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover" />
                <div className="text-left">
                  <p className="font-bold text-sm truncate">{item.username}</p>
                  <p className="text-xs text-slate-400 truncate">{item.domain}</p>
                  <span className="text-emerald-400 font-extrabold text-sm">{item.score}/100</span>
                </div>
              </div>
            )) : (
              <p className="col-span-3 text-xs text-slate-500 italic">No historical evaluations documented yet. Be the first!</p>
            )}
          </div>
        </section>

        {/* Dynamic Functional File Controls Platform Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Settings / Configuration Parameters Column Box */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
            <h3 className="text-md font-bold text-emerald-400 border-b border-dashed border-slate-700 pb-2">1. Sector Specifications</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-2 text-slate-400">Primary Domain Sector</label>
                <select onChange={(e) => { setSelectedDomain(e.target.value); setSelectedSubDomain(''); setSelectedBranch(''); }} className={`w-full p-2.5 rounded-lg text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                  <option value="">-- Let AI Intelligently Evaluate (Auto-Detect) --</option>
                  <option value="software">Software Engineering Field</option>
                  <option value="core">Core Engineering Domains</option>
                  <option value="consultancy">Consultancy & Human Resources</option>
                </select>
              </div>

              {selectedDomain === 'software' && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2 text-slate-400">Specialization Framework Track</label>
                  <select onChange={(e) => setSelectedSubDomain(e.target.value)} className={`w-full p-2.5 rounded-lg text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                    <option value="">Select Specialization...</option>
                    <option value="Full Stack Developer">Full Stack</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                  </select>
                </div>
              )}

              {selectedDomain === 'core' && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2 text-slate-400">Engineering Branch Allocation</label>
                  <select onChange={(e) => setSelectedBranch(e.target.value)} className={`w-full p-2.5 rounded-lg text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                    <option value="">Select Discipline...</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                  </select>
                </div>
              )}

              {selectedDomain === 'consultancy' && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2 text-slate-400">Department Alignment</label>
                  <select onChange={(e) => setSelectedSubDomain(e.target.value)} className={`w-full p-2.5 rounded-lg text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                    <option value="">Select Specialty...</option>
                    <option value="Management Consultant">Management Consultant</option>
                    <option value="HR / Human Resources">HR / Human Resources</option>
                    <option value="Business Strategy Analyst">Business Strategy Analyst</option>
                  </select>
                </div>
              )}

              {/* Drag/Drop Document Input Stream Node */}
              <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${darkMode ? 'border-slate-700 bg-slate-950/20 hover:border-emerald-500' : 'border-slate-300 bg-slate-50 hover:border-emerald-500'}`}>
                <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="file-uploader" />
                <label htmlFor="file-uploader" className="cursor-pointer block text-xs space-y-2 text-slate-400">
                  <span className="text-emerald-400 font-bold text-sm block">Upload Target Record</span>
                  <span>Supported format standards: PDF, IMG, JPEG (Max Size 10MB)</span>
                  {file && <span className="block font-semibold text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 mt-2">{file.name}</span>}
                </label>
              </div>

              <button onClick={handleFileAnalysisPipeline} disabled={analyzing} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50">
                {analyzing ? '⚙️ Synthesizing Analytics Vector...' : 'Execute AI Resume Audit'}
              </button>
            </div>
          </div>

          {/* Real-time Display Analysis Console Output Card */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-md font-bold text-emerald-400 border-b border-dashed border-slate-700 pb-2">2. Audit Metrics & Performance Analytics</h3>
            
            {analyzing && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-xs tracking-widest uppercase text-slate-400 animate-pulse">Analysing... Extracting Structure Vectors</p>
              </div>
            )}

            {!analyzing && !result && (
              <div className="text-center py-24 text-slate-500 text-sm space-y-2">
                <p>Awaiting structural streaming upload inputs...</p>
                <p className="text-xs text-slate-600">Ensure you have signed into your verification account node profile above.</p>
              </div>
            )}

            {!analyzing && result && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 gap-4">
                  <div>
                    <h4 className="text-xl font-extrabold text-white">{result.score} <span className="text-xs font-normal text-slate-400">/ 100 System Rating</span></h4>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">Target Layer Allocation: {result.domain}</p>
                  </div>
                  
                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.analysis, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `ATS-Report-${result.domain}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold text-slate-200 border border-slate-700">
                      💾 JSON File
                    </button>

                    {/* ✅ UPDATED ELEMENT (Line 170 Fix): Triggers token verification headers safely on tap */}
                    <button 
                      onClick={() => handleSecurePDFDownload(result._id)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-xs rounded font-bold text-white shadow border border-green-700 flex items-center justify-center text-center transition-colors cursor-pointer"
                    >
                      📄 Download PDF Report
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-4 h-64 overflow-y-auto pr-2 custom-scroll">
                  <div>
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">💡 Actionable Improvement Points:</h5>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                      {result.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">❌ Omitted Engineering Skills Matrix:</h5>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.analysis.missingSkills.map((sk, i) => <span key={i} className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">{sk}</span>)}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">🚀 Recommended Alternative Projects:</h5>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                      {result.analysis.projectIdeas?.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">🎯 Operational Recommendation Summary:</h5>
                    <p className="text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800 leading-relaxed">{result.analysis.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Portal Dialog Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                {isSignup ? 'Create Your Account' : 'Welcome Back Node'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* 1. Email Field Endpoint */}
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={authForm.email} 
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})} 
                  className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>

              {/* 2. Custom Security Password Field */}
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-slate-400">
                  {isSignup ? 'Create a Secure Password' : 'Enter Password'}
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={authForm.password} 
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})} 
                  className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500" 
                />
                {isSignup && (
                  <span className="text-[10px] text-slate-500 mt-1 block">💡 Feel free to create a new, unique password for this platform.</span>
                )}
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 font-bold rounded-lg hover:bg-emerald-500 text-sm text-white shadow-md transition-all mt-2">
                {isSignup ? 'Register & Get Started' : 'Log In Securely'}
              </button>
            </form>

            <p onClick={() => { setIsSignup(!isSignup); setAuthForm({ username: '', email: '', password: '' }); }} className="text-center text-xs text-slate-400 cursor-pointer hover:underline pt-2">
              {isSignup ? "Already have an account? Log In" : "First time visiting? Register / Sign Up Here"}
            </p>

          </div>
        </div>
      )}
    </div>
  );
}