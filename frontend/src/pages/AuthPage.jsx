import { useState } from "react";

export default function AuthPage({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");
        if (!email || !password) {
        setError("Please fill in all fields.");
        return;
        }
        setIsLoading(true);
        await new Promise((res) => setTimeout(res, 1400));
        setIsLoading(false);
        if (email === "admin@lto.gov.ph" && password === "admin123") {
        onLogin();
        } else {
        setError("Invalid email or password. Please try again.");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, rgba(30,58,138,0.45) 0%, rgba(29,78,216,0.35) 50%, rgba(30,58,138,0.45) 100%), url('https://images.unsplash.com/photo-1768962635991-0fa9543b7640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>

        {/* Card */}
        <div style={{
            width: "100%",
            maxWidth: 420,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 25px 60px rgba(0,0,0,0.30)",
            overflow: "hidden",
        }}>

            {/* Top colored strip */}
            <div style={{ height: 6, background: "linear-gradient(90deg, #1e3a8a, #3b82f6, #1e3a8a)" }} />

            <div style={{ padding: "36px 36px 32px" }}>

            {/* Icon + Title */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
                <div style={{
                width: 72, height: 72,
                background: "#1e3a8a",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
                boxShadow: "0 8px 24px rgba(30,58,138,0.35)",
                }}>
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="4" width="18" height="24" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
                    <line x1="12" y1="11" x2="22" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="22" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="21" x2="18" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="28" cy="30" r="7" fill="#1e3a8a" stroke="white" strokeWidth="2" />
                    <circle cx="28" cy="30" r="2.5" fill="white" />
                    <line x1="28" y1="23.5" x2="28" y2="26.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="28" y1="33.5" x2="28" y2="36.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="21.5" y1="30" x2="24.5" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="31.5" y1="30" x2="34.5" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                </div>
                <h1 style={{
                margin: 0,
                fontSize: 22, fontWeight: 700,
                color: "#1e3a8a", textAlign: "center", lineHeight: 1.3,
                }}>
                LTO Information System
                </h1>
                <p style={{
                margin: "6px 0 0",
                fontSize: 13, color: "#6b7280", textAlign: "center",
                }}>
                Land Transportation Office – Republic of the Philippines
                </p>
            </div>

            {/* Error alert */}
            {error && (
                <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", marginBottom: 16,
                background: "#fef2f2", border: "1px solid #fca5a5",
                borderRadius: 8, color: "#dc2626", fontSize: 13,
                }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
                </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
                <label style={{
                display: "block", marginBottom: 6,
                fontSize: 13, fontWeight: 600, color: "#374151",
                }}>
                Email Address
                </label>
                <div style={{ position: "relative" }}>
                <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    pointerEvents: "none", display: "flex", color: "#9ca3af",
                }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                </span>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="admin@lto.gov.ph"
                    style={{
                    width: "100%", height: 46, boxSizing: "border-box",
                    paddingLeft: 40, paddingRight: 14,
                    border: "1.5px solid #d1d5db", borderRadius: 10,
                    background: "#f9fafb",
                    fontSize: 14, color: "#111827",
                    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                    fontFamily: "inherit",
                    }}
                    onFocus={e => {
                    e.target.style.borderColor = "#1e3a8a";
                    e.target.style.boxShadow = "0 0 0 3px rgba(30,58,138,0.10)";
                    e.target.style.background = "#fff";
                    }}
                    onBlur={e => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#f9fafb";
                    }}
                />
                </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
                <label style={{
                display: "block", marginBottom: 6,
                fontSize: 13, fontWeight: 600, color: "#374151",
                }}>
                Password
                </label>
                <div style={{ position: "relative" }}>
                <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    pointerEvents: "none", display: "flex", color: "#9ca3af",
                }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </span>
                <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    style={{
                    width: "100%", height: 46, boxSizing: "border-box",
                    paddingLeft: 40, paddingRight: 44,
                    border: "1.5px solid #d1d5db", borderRadius: 10,
                    background: "#f9fafb",
                    fontSize: 14, color: "#111827",
                    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                    fontFamily: "inherit",
                    }}
                    onFocus={e => {
                    e.target.style.borderColor = "#1e3a8a";
                    e.target.style.boxShadow = "0 0 0 3px rgba(30,58,138,0.10)";
                    e.target.style.background = "#fff";
                    }}
                    onBlur={e => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#f9fafb";
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#9ca3af", display: "flex", padding: 2,
                    transition: "color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1e3a8a"}
                    onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
                    aria-label="Toggle password visibility"
                >
                    {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                    </svg>
                    ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    )}
                </button>
                </div>
            </div>

            {/* Remember me + Forgot password */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20,
            }}>
                <label style={{
                display: "flex", alignItems: "center", gap: 8,
                cursor: "pointer", userSelect: "none",
                }}>
                <div
                    onClick={() => setRememberMe(v => !v)}
                    style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${rememberMe ? "#1e3a8a" : "#d1d5db"}`,
                    background: rememberMe ? "#1e3a8a" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", cursor: "pointer",
                    }}
                >
                    {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    )}
                </div>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Remember me</span>
                </label>
                <button
                type="button"
                style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#1e3a8a", fontSize: 13, fontWeight: 600,
                    padding: 0, fontFamily: "inherit",
                }}
                >
                Forgot password?
                </button>
            </div>

            {/* Login button */}
            <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                width: "100%", height: 48,
                background: isLoading ? "#3b5ba9" : "#1e3a8a",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(30,58,138,0.30)",
                transition: "background 0.15s, transform 0.1s",
                fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#1d3461"; }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = "#1e3a8a"; }}
            >
                {isLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    style={{ animation: "lto-spin 0.8s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                ) : (
                <>
                    Login to Dashboard
                    <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </>
                )}
            </button>

            {/* Divider */}
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                margin: "20px 0 0",
            }}>
                <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Authorized Personnel Only
                </span>
                <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>
            </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: "0 0 4px" }}>
            © 2026 Land Transportation Office. All rights reserved.
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0 }}>
            Republic of the Philippines
            </p>
        </div>

        {/* Spinner keyframe */}
        <style>{`
            @keyframes lto-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        </div>
    );
}