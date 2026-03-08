import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API, useAuth } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { 
  Shield, Smartphone, Key, AlertTriangle, CheckCircle, 
  Copy, Eye, EyeOff, QrCode, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function TwoFactorSettings() {
  const { user } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFAEnabled(response.data.two_factor_enabled || false);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    }
  };

  const initSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/2fa/setup`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setSetupMode(true);
    } catch (error) {
      toast.error('Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/2fa/verify`, 
        { code: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBackupCodes(response.data.backup_codes);
      setTwoFAEnabled(true);
      setSetupMode(false);
      setShowBackupCodes(true);
      toast.success('Two-factor authentication enabled!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/2fa/disable`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password }
      });
      setTwoFAEnabled(false);
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret key copied to clipboard');
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard');
  };

  return (
    <DashboardLayout title="Security Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 2FA Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-heading">Two-Factor Authentication</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <Badge className={twoFAEnabled ? 'badge-success' : 'badge-warning'}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!twoFAEnabled && !setupMode && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Recommended for security</p>
                    <p className="text-sm text-yellow-700">
                      Two-factor authentication protects your account from unauthorized access.
                    </p>
                  </div>
                </div>
                <Button onClick={initSetup} disabled={loading} className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            )}

            {setupMode && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use an authenticator app like Google Authenticator or Authy
                  </p>
                  {qrCode && (
                    <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48 border rounded-lg" />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Or enter this key manually:</p>
                  <div className="flex items-center gap-2">
                    <Input value={secret} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="sm" onClick={copySecret}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Enter the 6-digit code from your app:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="font-mono text-lg text-center tracking-widest"
                      maxLength={6}
                    />
                    <Button onClick={verifyAndEnable} disabled={loading || verificationCode.length !== 6}>
                      Verify & Enable
                    </Button>
                  </div>
                </div>

                <Button variant="outline" onClick={() => setSetupMode(false)} className="w-full">
                  Cancel
                </Button>
              </div>
            )}

            {twoFAEnabled && !setupMode && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Your account is protected</p>
                    <p className="text-sm text-green-700">
                      Two-factor authentication is active on your account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowBackupCodes(!showBackupCodes)} className="gap-2">
                    <Key className="h-4 w-4" />
                    {showBackupCodes ? 'Hide' : 'View'} Backup Codes
                  </Button>
                  <Button variant="destructive" onClick={disable2FA} disabled={loading}>
                    Disable 2FA
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Codes Card */}
        {showBackupCodes && backupCodes.length > 0 && (
          <Card className="border-2 border-yellow-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Backup Codes
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                  <Copy className="h-4 w-4 mr-2" /> Copy All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Save these codes in a secure place. Each code can only be used once 
                  to access your account if you lose your authenticator device.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="font-mono text-sm bg-muted px-3 py-2 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Use a strong, unique password for your account
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Never share your 2FA codes with anyone
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Store backup codes in a secure location
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Log out when using shared devices
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
