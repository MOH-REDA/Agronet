import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react';
import { exchangeSocialLogin } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAuthCopy } from './authCopy';
import './Auth.css';

const SocialAuthCallback = () => {
  const { language } = useLanguage(); const c = getAuthCopy(language); const [params] = useSearchParams(); const navigate = useNavigate(); const started = useRef(false); const [error,setError] = useState('');
  useEffect(() => { if(started.current)return;started.current=true;const code=params.get('code');if(!code){setError(c.callbackMissing);return;}exchangeSocialLogin(code).then(()=>navigate('/dashboard',{replace:true})).catch(()=>setError(c.callbackExpired)); },[c.callbackExpired,c.callbackMissing,navigate,params]);
  return <div className="auth-callback-page"><div className="auth-callback-card" role="status">{error?<TriangleAlert className="auth-callback-icon error"/>:<LoaderCircle className="auth-callback-icon spin"/>}<h1>{error?c.callbackError:c.callbackLoading}</h1><p>{error||c.callbackWait}</p>{error&&<Link className="auth-primary-button auth-callback-action" to="/login"><CheckCircle2 size={18}/> {c.backLogin}</Link>}</div></div>;
};

export default SocialAuthCallback;
