import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { login } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAuthCopy } from './authCopy';
import SocialLoginButtons from './SocialLoginButtons';
import './Auth.css';

const Login = () => {
  const { language } = useLanguage(); const c = getAuthCopy(language);
  const navigate = useNavigate(); const [params] = useSearchParams();
  const [formData,setFormData] = useState({email:'',password:''}); const [showPassword,setShowPassword] = useState(false); const [error,setError] = useState(params.get('oauth_error') || ''); const [loading,setLoading] = useState(false);
  const handleSubmit = async event => { event.preventDefault(); setError(''); setLoading(true); try { await login(formData); navigate('/dashboard'); } catch (reason) { setError(reason?.errors?.email ? c.loginFailed : reason?.message || c.loginFailed); } finally { setLoading(false); } };
  return <div className="auth-page"><section className="auth-shell">
    <aside className="auth-visual auth-login-visual" aria-label="AgroNet"><div className="auth-visual-shade"/><div className="auth-visual-brand"><Leaf size={21}/> AgroNet</div><div className="auth-visual-content"><span className="auth-eyebrow">{c.loginEyebrow}</span><h1>{c.loginHero}</h1><p>{c.loginHeroCopy}</p><div className="auth-trust-row"><span><ShieldCheck size={18}/> {c.verified}</span><span><LockKeyhole size={18}/> {c.secure}</span></div></div></aside>
    <div className="auth-panel"><div className="auth-form-wrap"><header className="auth-heading"><span className="auth-kicker">{c.welcome}</span><h2>{c.loginTitle}</h2><p>{c.loginSubtitle}</p></header>
      {params.get('registered')&&<div className="auth-alert success" role="status">{c.registered}</div>}{error&&<div className="auth-alert error" role="alert">{error}</div>}
      <SocialLoginButtons mode="login"/>
      <form className="auth-form" onSubmit={handleSubmit}><label className="auth-field" htmlFor="login-email"><span>{c.email}</span><div className="auth-input-wrap"><Mail size={19}/><input id="login-email" type="email" autoComplete="email" value={formData.email} onChange={event=>setFormData({...formData,email:event.target.value})} placeholder="vous@exemple.com" required/></div></label>
        <label className="auth-field" htmlFor="login-password"><span>{c.password}</span><div className="auth-input-wrap"><LockKeyhole size={19}/><input id="login-password" type={showPassword?'text':'password'} autoComplete="current-password" value={formData.password} onChange={event=>setFormData({...formData,password:event.target.value})} placeholder={c.passwordPh} required/><button type="button" className="auth-password-toggle" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?c.hidePassword:c.showPassword}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
        <button className="auth-primary-button" type="submit" disabled={loading}><span>{loading?c.signingIn:c.signIn}</span><ArrowRight size={19}/></button>
      </form><p className="auth-switch">{c.newUser} <Link to="/register">{c.createAccount}</Link></p>
    </div></div>
  </section></div>;
};

export default Login;
