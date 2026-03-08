import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function PaymentSuccess() {
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !paymentId) {
      setStatus('error');
      return;
    }

    const pollStatus = async (attempts = 0) => {
      if (attempts >= 5) {
        setStatus('timeout');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API}/payments/${paymentId}/checkout-status/${sessionId}`,
          { 
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          setPaymentStatus(response.data);
        } else if (response.data.status === 'expired') {
          setStatus('expired');
        } else {
          setTimeout(() => pollStatus(attempts + 1), 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    pollStatus();
  }, [paymentId, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
              <CardTitle className="font-heading text-2xl mt-4">Processing Payment</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <CardTitle className="font-heading text-2xl mt-4">Payment Successful!</CardTitle>
            </>
          )}
          {(status === 'error' || status === 'expired' || status === 'timeout') && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <CardTitle className="font-heading text-2xl mt-4">
                {status === 'expired' ? 'Payment Expired' : 'Payment Issue'}
              </CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'checking' && (
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          )}
          {status === 'success' && (
            <>
              <p className="text-muted-foreground">
                Your payment of ${(paymentStatus?.amount_total / 100).toFixed(2)} {paymentStatus?.currency?.toUpperCase()} has been received.
              </p>
              <p className="text-sm text-muted-foreground">
                The payment is now held in escrow and will be released upon work completion.
              </p>
            </>
          )}
          {status === 'error' && (
            <p className="text-muted-foreground">
              There was an issue verifying your payment. Please contact support if the issue persists.
            </p>
          )}
          {status === 'expired' && (
            <p className="text-muted-foreground">
              This payment session has expired. Please try again.
            </p>
          )}
          {status === 'timeout' && (
            <p className="text-muted-foreground">
              Payment verification is taking longer than expected. Please check your dashboard for status.
            </p>
          )}
          <div className="pt-4">
            <Button onClick={() => navigate('/builder/payments')} data-testid="back-to-payments-btn">
              Back to Payments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
