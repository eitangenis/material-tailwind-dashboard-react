const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set');
  console.error('Please create a .env file with your Stripe secret key');
  process.exit(1);
}

// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set');
  console.error('Please create a .env file with your Stripe secret key');
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env at:', path.join(__dirname, '.env'));
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// --- SMTP transport, 2026-07-29 -----------------------------------------------
// The two routes below hardcoded smtp.titan.email:465. That is not this account's
// provider: EMAIL_HOST in the .env is server028.yourhosting.nl and Titan rejects these
// credentials with 535 on every port. Every contact-form submission has therefore
// failed since the page shipped. Read the configured host instead.
function _smtpConfig() {
  const host = (process.env.EMAIL_HOST || '').trim();
  const port = Number.parseInt(process.env.EMAIL_PORT || '587', 10);
  if (!host) throw new Error('EMAIL_HOST is not configured');
  return {
    host,
    port,
    secure: port === 465,        // 465 is implicit TLS; 587/25 use STARTTLS
    requireTLS: port !== 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  };
}
// -----------------------------------------------------------------------------


// --- hardened 2026-07-29 ---------------------------------------------------------------
// Both mail routes below are public and hit a real SMTP account, so they get the same
// budget this project's own server gives them (publicEmailRateLimit): 5 per 15 minutes
// per IP. In-memory and per-process, exactly like server/index.js — no new dependency.
const _mailHits = new Map();
let _mailGlobal = [];

// nginx sets X-Real-IP from $remote_addr and overwrites anything the caller sent, so it
// is the only forwarded header here that can be trusted. X-Forwarded-For is built with
// $proxy_add_x_forwarded_for, which appends to whatever the client supplied.
function _clientKey(req) {
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim();
  return (req.ip || req.connection?.remoteAddress || 'unknown').replace('::ffff:', '');
}

function mailRateLimit(req, res, next) {
  const WINDOW_MS = 15 * 60 * 1000;
  const PER_IP = 5;
  const GLOBAL = 40;
  const now = Date.now();
  const fresh = (list) => list.filter((t) => now - t < WINDOW_MS);

  _mailGlobal = fresh(_mailGlobal);
  const key = _clientKey(req);
  const hits = fresh(_mailHits.get(key) || []);

  const over = hits.length >= PER_IP ? hits[0] : _mailGlobal.length >= GLOBAL ? _mailGlobal[0] : null;
  if (over !== null) {
    res.set('Retry-After', String(Math.ceil((WINDOW_MS - (now - over)) / 1000)));
    return res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
  }

  hits.push(now);
  _mailHits.set(key, hits);
  _mailGlobal.push(now);
  if (_mailHits.size > 5000) {
    for (const [k, v] of _mailHits) if (!fresh(v).length) _mailHits.delete(k);
  }
  next();
}

// /api/test-email reported whether the mail credentials were set and printed
// account-recovery steps. Diagnostics, not a public endpoint.
function localOnly(req, res, next) {
  const ip = (req.ip || '').replace('::ffff:', '');
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return next();
  return res.status(404).json({ error: 'Not found' });
}
// -----------------------------------------------------------------------------


app.use(cors());
app.use(express.json());

// Create checkout session endpoint (for subscriptions)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planName, price, isYearly } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planName} Plan`,
              description: `${planName} subscription for molecular research tools`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
            recurring: {
              interval: isYearly ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/dashboard/paidplans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/dashboard/paidplans?canceled=true`,
      metadata: {
        plan: planName,
        billing: isYearly ? 'yearly' : 'monthly'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session for one-time payment (paid plans and molecule cart)
app.post('/create-checkout-session-onetime', async (req, res) => {
  try {
    const { planName, price, cartItems, totalAmount, description } = req.body;
    
    let lineItems = [];
    let successUrl = '';
    let cancelUrl = '';
    let metadata = {};

    // Handle molecule cart checkout
    if (cartItems && cartItems.length > 0) {
      lineItems = cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name || 'Molecule',
            description: `${item.amount}mg - ${item.smiles ? item.smiles.substring(0, 50) : 'Chemical compound'}`,
          },
          unit_amount: Math.round((item.totalPrice || item.price || 0) * 100), // Convert to cents
        },
        quantity: 1,
      }));
      
      successUrl = `${req.headers.origin}/dashboard/simulation?payment=success`;
      cancelUrl = `${req.headers.origin}/dashboard/simulation?payment=canceled`;
      metadata = {
        type: 'molecule_purchase',
        itemCount: cartItems.length,
        totalAmount: totalAmount.toFixed(2)
      };
    } 
    // Handle plan purchase
    else if (planName && price) {
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planName} Plan`,
              description: `One-time payment for ${planName} credits`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];
      
      successUrl = `${req.headers.origin}/dashboard/paidplans?success=true&plan=${planName}`;
      cancelUrl = `${req.headers.origin}/dashboard/paidplans?canceled=true`;
      metadata = {
        plan: planName,
        type: 'one_time_purchase'
      };
    } else {
      return res.status(400).json({ error: 'Invalid request: must provide either planName/price or cartItems' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating one-time checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session for one-time payment (molecule purchase)
app.post('/create-checkout-session-molecules', async (req, res) => {
  try {
    const { cartItems, totalAmount, description } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create line items from cart
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || 'Molecule',
          description: `${item.amount}mg - ${item.smiles ? item.smiles.substring(0, 50) : 'Chemical compound'}`,
        },
        unit_amount: Math.round((item.totalPrice || item.price || 0) * 100), // Convert to cents
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/dashboard/simulation?payment=success`,
      cancel_url: `${req.headers.origin}/dashboard/simulation?payment=canceled`,
      metadata: {
        type: 'molecule_purchase',
        itemCount: cartItems.length,
        totalAmount: totalAmount.toFixed(2)
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating molecule checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session details endpoint
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json(session);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Issue simulation tokens endpoint
app.post('/api/issueSimulationTokens', async (req, res) => {
  try {
    const { simulationTokens } = req.body;
    
    if (!simulationTokens || typeof simulationTokens !== 'number') {
      return res.status(400).json({ error: 'Invalid simulation tokens amount' });
    }

    // In a real application, you would:
    // 1. Verify the user's authentication token
    // 2. Update the database with the new token count
    // 3. Return the updated token count
    
    // For now, we'll just return a success response
    // The client will handle updating localStorage
    res.json({ 
      success: true, 
      tokens: simulationTokens,
      message: 'Simulation tokens issued successfully'
    });
    
  } catch (error) {
    console.error('Error issuing simulation tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email configuration endpoint
app.get('/api/test-email', localOnly, async (req, res) => {
  try {
    console.log('Testing Titan Mail configuration...');
    
    const config = _smtpConfig();

    const transporter = nodemailer.createTransport(config);
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: 'Email configuration is working correctly!',
      config: `${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT || 587}`
    });
    
  } catch (error) {
    console.error('Email test failed:', error.message);
    
    let troubleshooting = [];
    if (error.message.includes('authentication failed')) {
      troubleshooting = [
        'Log into Titan Webmail at https://app.titan.email/',
        'Go to Settings > Enable Titan on other apps',
        'Complete the feature tour and enable third-party access',
        'Disable Two-Factor Authentication if enabled',
        'Verify your email and password are correct'
      ];
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      troubleshooting: troubleshooting,
      credentials: {
        user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
        pass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
      }
    });
  }
});

// Email sending endpoint
app.post('/api/send-email', mailRateLimit, async (req, res) => {
  try {
    const { name, subject, message, recipientEmail } = req.body;

    // Validate required fields
    if (!name || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'name, subject, and message are required'
      });
    }

    // SECURITY: this endpoint is public (contact form) and reachable from the internet
    // because Vite proxies /api here. The destination is therefore server-controlled and
    // NOT taken from the request, so it cannot be used to send mail to arbitrary
    // recipients through the production Titan Mail account. Any client-supplied
    // recipientEmail is treated only as the visitor's own reply-to address and shown in
    // the body. Identical to server/index.js:5783, so Release A changes nothing here.
    const destination = process.env.CONTACT_RECIPIENT || process.env.EMAIL_USER;
    if (!destination) {
      console.error('send-email: no CONTACT_RECIPIENT/EMAIL_USER configured');
      return res.status(500).json({ success: false, error: 'Email destination is not configured' });
    }
    const _emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const senderContact =
      typeof recipientEmail === 'string' && _emailRe.test(recipientEmail.trim())
        ? recipientEmail.trim()
        : null;

    const config = _smtpConfig();

    const transporter = nodemailer.createTransport(config);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: destination,
      subject: `${subject}`,
      html: `
        <h2>Message from ${name}</h2>
        <p><strong>From:</strong> ${name}${senderContact ? ` &lt;${senderContact}&gt;` : ''}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This email was sent from ${process.env.EMAIL_FROM} via the email client.
        </p>
      `,
      text: `
        Message from ${name}
        
        From: ${name}${senderContact ? ` <${senderContact}>` : ''}
        Subject: ${subject}
        
        Message:
        ${message}
        
        ---
        This email was sent from ${process.env.EMAIL_FROM} via the email client.
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully' });
    
  } catch (error) {
    console.error('Email sending error:', error);
    
    let errorMessage = 'Failed to send email. ';
    if (error.message.includes('authentication failed')) {
      errorMessage += 'Please check: 1) Third-party email access is enabled in your Titan account, 2) Two-Factor Authentication is disabled, 3) Credentials are correct.';
    } else {
      errorMessage += 'Please try again later.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage
    });
  }
});

const PORT = process.env.PORT || 3001;

// Use HTTP for local development, HTTPS for production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Production HTTPS setup
  try {
    const httpsOptions = {
      key: fs.readFileSync('/etc/letsencrypt/live/chem.software/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/chem.software/fullchain.pem')
    };
    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`cjs Stripe HTTPS server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('HTTPS certificates not found, falling back to HTTP');
    http.createServer(app).listen(PORT, '0.0.0.0', () => {
      console.log(`cjs Stripe HTTP server running on port ${PORT} (fallback)`);
    });
  }
} else {
  // Development HTTP setup
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`cjs Stripe HTTP server running on port ${PORT} (development)`);
  });
}
