const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate PayPal configuration
if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.warn('WARNING: PayPal credentials not configured. PayPal payments will not work.');
}

const app = express();

app.use(cors());
app.use(express.json());

// PayPal API base URL
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// Generate PayPal access token
async function generateAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// Create PayPal order endpoint
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { planName, price } = req.body;

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: 'PayPal is not configured. Please check your environment variables.' 
      });
    }

    const accessToken = await generateAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `${planName} Plan - Molecular Research Tools`,
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2)
          },
          custom_id: planName
        }
      ],
      application_context: {
        brand_name: 'Molecular Research Tools',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${req.headers.origin}/dashboard/paidplans?success=true&plan=${planName}&provider=paypal`,
        cancel_url: `${req.headers.origin}/dashboard/paidplans?canceled=true&provider=paypal`
      }
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    });

    const order = await response.json();
    
    if (order.error) {
      throw new Error(order.error_description || order.message);
    }

    res.json({ 
      orderId: order.id,
      approvalUrl: order.links.find(link => link.rel === 'approve')?.href
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Capture PayPal order endpoint
app.post('/api/paypal/capture-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const captureData = await response.json();
    
    if (captureData.error) {
      throw new Error(captureData.error_description || captureData.message);
    }

    res.json({ 
      success: true,
      orderId: captureData.id,
      status: captureData.status,
      payer: captureData.payer
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order details endpoint
app.get('/api/paypal/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const order = await response.json();
    res.json(order);
  } catch (error) {
    console.error('Error retrieving PayPal order:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PAYPAL_PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  try {
    const httpsOptions = {
      key: fs.readFileSync('/etc/letsencrypt/live/chem.software/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/chem.software/fullchain.pem')
    };
    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`PayPal HTTPS server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('HTTPS certificates not found, falling back to HTTP');
    http.createServer(app).listen(PORT, '0.0.0.0', () => {
      console.log(`PayPal HTTP server running on port ${PORT} (fallback)`);
    });
  }
} else {
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`PayPal HTTP server running on port ${PORT} (development)`);
  });
}
