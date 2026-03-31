import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [msg, setMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setMsg('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data?.user?.identities?.length === 0) {
          setErrorMsg("此信箱可能已被註冊過。");
        } else {
          setMsg('註冊成功！若您有開啟 Email 驗證，請至信箱點擊驗證連結，否則可直接登入。');
        }
      }
    }
    setLoading(false);
  };

  const inputStyle = {
    background: "#1a1a22", border: "1px solid #333", borderRadius: 6,
    padding: "10px 12px", color: "#eee", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box"
  };

  const btnStyle = {
    width: "100%", padding: "12px 0", background: "#7c6ff5", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
    marginTop: 10, transition: "opacity 0.2s"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Noto Sans TC', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
      `}</style>
      <div style={{ width: "100%", maxWidth: 360, background: "#16161e", padding: "32px 28px", borderRadius: 16, border: "1px solid #1e1e28" }}>
        
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <h2 style={{ color: "#eee", margin: "0 0 6px", fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            {isLogin ? "歡迎回來" : "建立新帳號"}
          </h2>
          <p style={{ color: "#777", fontSize: 13, margin: 0 }}>
            {isLogin ? "登入以管理你的專屬訂閱清單" : "註冊並開始追蹤你的訂閱花費"}
          </p>
        </div>
        
        {errorMsg && <div style={{ background: "#4a2030", color: "#ff6b8a", padding: "10px 12px", borderRadius: 6, fontSize: 13, marginBottom: 16 }}>{errorMsg}</div>}
        {msg && <div style={{ background: "#204a30", color: "#6bff8a", padding: "10px 12px", borderRadius: 6, fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>{msg}</div>}

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>電子郵件</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="example@email.com" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>密碼</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder={isLogin ? "請輸入密碼" : "設定一組新密碼（至少 6 碼）"} minLength={6} />
          </div>
          
          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
            {loading ? "處理中..." : (isLogin ? "登入" : "註冊")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #1e1e28" }}>
          <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setMsg(''); }} style={{ background: "none", border: "none", color: "#a99ff8", cursor: "pointer", fontSize: 13 }}>
            {isLogin ? "還沒有帳號？立即註冊" : "已經有帳號了？點此登入"}
          </button>
        </div>
      </div>
    </div>
  );
}
