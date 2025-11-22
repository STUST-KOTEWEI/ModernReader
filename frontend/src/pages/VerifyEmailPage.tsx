import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../services/api';
import { Card, Button } from '../design-system';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle'|'verifying'|'success'|'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('缺少驗證代碼');
      return;
    }
    const run = async () => {
      setStatus('verifying');
      try {
        const res = await authClient.verifyEmailToken(token);
        if (res.status === 'verified') {
          setStatus('success');
          setMessage('Email 驗證成功，現在可以登入囉。');
        } else {
          setStatus('error');
          setMessage('驗證失敗，請稍後再試。');
        }
      } catch (err: any) {
        setStatus('error');
        const detail = err?.response?.data?.detail || err?.message || '驗證失敗';
        setMessage(String(detail));
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-3">Email 驗證</h1>
        {status === 'verifying' && <p className="text-gray-600">驗證中，請稍候…</p>}
        {(status === 'success' || status === 'error') && (
          <>
            <p className={status === 'success' ? 'text-emerald-700' : 'text-red-600'}>{message}</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/login')} className="w-full">前往登入</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
