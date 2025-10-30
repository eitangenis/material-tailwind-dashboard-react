import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Switch,
  Chip,
  Alert,
  Spinner,
  ButtonGroup,
} from "@material-tailwind/react";
import { CheckIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PaidPlans() {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [paymentProvider, setPaymentProvider] = useState('stripe'); // 'stripe' or 'paypal'

  // Check if payment providers are properly configured
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isPayPalConfigured = true; // PayPal will check on server side

  // Handle toggle change
  const handleToggleChange = () => {
    const newValue = !isYearly;
    console.log('Toggle changed from', isYearly, 'to', newValue);
    setIsYearly(newValue);
  };

  // Check for payment success/cancel from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      const planName = urlParams.get('plan');
      const provider = urlParams.get('provider') || 'stripe';
      const selectedPlan = plans.find(p => p.name === planName);
      const credits = selectedPlan?.credits || 50;
      issueSimulationTokens(credits);
      setMessage(`Payment received via ${provider.toUpperCase()}! You have successfully subscribed to the plan: ${planName}`);
      setMessageType('success');
    } else if (urlParams.get('canceled')) {
      const provider = urlParams.get('provider') || 'stripe';
      setMessage(`Payment was canceled. You can try again anytime.`);
      setMessageType('error');
    }
  }, []);

  const plans = [
     {
      name: 'Trial',
      subtitle: 'Affordable access for anyone to understand the concept',
      popular: false,
      description: 'Affordable access for anyone to understand the concept',
      credits: 4,
      features: [
        'Trial',
        '4 credits',        
        'Low job priority',
        'Most models & settings',
        'Email Support',
        'Guaranteed Confidentiality',
      ],
      buttonText: 'Get Tokens and Try',
      buttonColor: 'gray'
    },
    {
      name: 'Standard',
      subtitle: 'Best for active research projects',
      price: 20,
      popular: false,
      description: 'The best choice for active research projects needing more power.',
      credits: 50,
      features: [
        '50 credits',
        'Medium job priority',
        'Most models & settings',
        'Email Support',
        'Guaranteed Confidentiality',
        'Unlimited Data Storage',
      ],
      buttonText: 'Purchase',
      buttonColor: 'blue'
    },
    {
      name: 'Academic',
      subtitle: 'For serious academic research with higher compute demands',
      price: 40,
      popular: false,
      description: 'The best choice for active research projects needing more power.',
      credits: 300,
      features: [
        '300 credits',
        'Medium job priority',
        'Most models & settings',
        'Email Support',
        'Guaranteed Confidentiality',
        'Unlimited Data Storage',
      ],
      buttonText: 'Purchase',
      buttonColor: 'blue'
    },
    
    {
      name: 'Professional',
      subtitle: 'The powerhouse plan for professionals',
      price: 80,
      popular: false,
      description: 'The powerhouse plan for professionals needing large-scale computation.',
      credits: 720,
      features: [
        'Commercial Use',
        '720 credits',
        'High job priority',
        'All models & settings',
        'Priority Support',
        'Guaranteed Confidentiality',
        'Unlimited Data Storage',
      ],
      buttonText: 'Purchase',
      buttonColor: 'purple'
    }
  ];

  const handlePlanSelection = async (plan) => {
    // Check if payment provider is configured
    if (paymentProvider === 'stripe' && !isStripeConfigured) {
      setMessage('Stripe is not configured. Please check the setup instructions or try PayPal.');
      setMessageType('error');
      return;
    }

    if (plan.name === 'Trial') {
      // Handle trial
      issueSimulationTokens(plan.credits);
      setMessage('Your subscription is now active.');
      setMessageType('success');
      return;
    }
    if (plan.name === 'Enterprise') {
      // Handle enterprise contact separately
      window.open('mailto:sales@asinex.com?subject=Enterprise Plan Inquiry&body=I am interested in the Enterprise plan for molecular research tools.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      let result;
      if (paymentProvider === 'stripe') {
        result = await createCheckoutSession(plan, isYearly);
      } else if (paymentProvider === 'paypal') {
        result = await createPayPalOrder(plan);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect to checkout
      window.location.href = result.url || result.approvalUrl;
      
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Failed to start checkout: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create checkout session
  const createCheckoutSession = async (plan, isYearly) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://${window.location.hostname}:3000/create-checkout-session-onetime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          planName: plan.name,
          price: plan.price,
      
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { error: error.message };
    }
  };

  // Helper function to create PayPal order
  const createPayPalOrder = async (plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      const port = window.location.hostname === 'localhost' ? '3002' : '3002';
      const protocol = window.location.protocol;
      const response = await fetch(`${protocol}//${window.location.hostname}:${port}/api/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          planName: plan.name,
          price: plan.price
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      return { error: error.message };
    }
  };

  // Helper to issue simulation tokens after payment
  const issueSimulationTokens = async (tokensAmount) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://${window.location.hostname}:3000/api/issueSimulationTokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ simulationTokens: tokensAmount })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to issue simulation tokens');
      }
      const data = await response.json();
      localStorage.setItem("simulation_tokens", JSON.stringify(tokensAmount));
      console.log('Simulation tokens issued:', data);
      // Scroll to top so user sees the message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Dispatch custom event to update tokens in dashboard navbar
      if (data && typeof data.tokens === 'number') {
        window.dispatchEvent(new CustomEvent('tokensUpdated', { detail: { tokens: data.tokens } }));
      }
      // Optionally, show a message or update UI
    } catch (error) {
      console.error('Error issuing simulation tokens:', error);
      // Optionally, show an error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Payment Configuration Warning */}
        {!isStripeConfigured && !isPayPalConfigured && (
          <div className="mb-8">
            <Alert
              color="red"
              icon={<XMarkIcon className="h-5 w-5" />}
            >
              <div>
                <Typography className="font-semibold mb-2">Payment Providers Not Configured</Typography>
                <Typography className="text-sm">
                  Neither Stripe nor PayPal are properly configured. Please check the setup instructions.
                </Typography>
              </div>
            </Alert>
          </div>
        )}

        {/* Success/Error Messages */}
        {message && (
          <div className="mb-8">
            <Alert
              color={messageType === 'success' ? 'green' : 'red'}
              icon={messageType === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
              onClose={() => setMessage('')}
              dismissible
            >
              {message}
            </Alert>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-16">
          <Typography variant="h1" className="mb-4 text-4xl lg:text-5xl font-bold text-gray-900">
            Choose Your Plan
          </Typography>
          <Typography variant="lead" className="mb-8 text-xl text-gray-600 max-w-3xl mx-auto">
            Elevate your molecular research without breaking the bank! Our pricing options make 
            advanced computational tools accessible to every researcher and scientist.
          </Typography>
          
          {/* Payment Provider Selector */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Typography variant="h6" className="text-gray-700">
              Select Payment Method
            </Typography>
            <ButtonGroup variant="outlined">
              <Button
                color={paymentProvider === 'stripe' ? 'blue' : 'gray'}
                onClick={() => setPaymentProvider('stripe')}
                className={paymentProvider === 'stripe' ? 'bg-blue-500 text-white' : ''}
                disabled={!isStripeConfigured}
              >
                <svg className="w-5 h-5 mr-2 inline" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                </svg>
                Stripe
              </Button>
              <Button
                color={paymentProvider === 'paypal' ? 'blue' : 'gray'}
                onClick={() => setPaymentProvider('paypal')}
                className={paymentProvider === 'paypal' ? 'bg-blue-500 text-white' : ''}
              >
                <svg className="w-5 h-5 mr-2 inline" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.793.68H8.25c-.367 0-.617-.33-.542-.695l1.985-12.591a.992.992 0 0 1 .978-.83h3.153c1.671 0 2.97.34 3.859 1.01a3.205 3.205 0 0 1 1.384 2.936z"/>
                  <path d="M7.187 3.524l.002-.01c.067-.43.396-.736.828-.736h5.762c1.258 0 2.245.136 3.02.425.73.272 1.33.686 1.782 1.228.452.542.738 1.218.873 2.008.067.393.09.816.069 1.264-.022.448-.09.926-.205 1.437-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.793.68H8.25c-.367 0-.617-.33-.542-.695l1.985-12.591a.992.992 0 0 1 .978-.83h.516z"/>
                </svg>
                PayPal
              </Button>
            </ButtonGroup>
            {!isStripeConfigured && paymentProvider === 'stripe' && (
              <Typography className="text-sm text-red-500">
                Stripe is not configured. Please select PayPal or configure Stripe.
              </Typography>
            )}
          </div>

        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Chip
                    value="Most Popular"
                    className="bg-blue-600 text-white font-semibold px-4 py-2"
                  />
                </div>
              )}
              
              <Card className={`h-full ${plan.popular ? 'ring-2 ring-blue-600 shadow-xl scale-105' : 'shadow-lg hover:shadow-xl'} transition-all duration-300`}>
                <CardBody className="p-8">
                  <div className="text-center mb-8">
                    <Typography variant="h4" className="mb-2 font-bold text-gray-900">
                      {plan.name}
                    </Typography>
                    <Typography className="text-gray-600 mb-6">
                      {plan.subtitle}
                    </Typography>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center">
                        <Typography variant="h2" className="text-4xl font-bold text-gray-900">
                          ${ plan.price}
                        </Typography>

                      </div>
                
                    </div>
                    
                    <Typography className="text-gray-600 text-sm mb-6">
                      {plan.description}
                    </Typography>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <Typography className="text-gray-700 text-sm">
                          {feature}
                        </Typography>
                      </div>
                    ))}
                  </div>                  <Button
                    onClick={() => handlePlanSelection(plan)}
                    color={plan.buttonColor}
                    size="lg"
                    className="w-full"
                    variant={plan.popular ? "filled" : "outlined"}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Spinner className="h-4 w-4 mr-2" />
                        Processing...
                      </div>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <Typography className="text-gray-600 mb-4">
            All plans include a 14-day free trial. No credit card required to start.
          </Typography>
          <Typography className="text-gray-500 text-sm">
            Questions about our plans? <a href="#" className="text-blue-600 hover:underline">Contact our sales team</a>
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default PaidPlans;