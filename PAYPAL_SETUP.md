# PayPal Payment Integration Setup

This guide will help you set up PayPal payment integration for your Material Tailwind Dashboard application.

## Prerequisites

- A PayPal Business account (or Sandbox account for testing)
- Node.js and npm installed
- Basic understanding of environment variables

## Step 1: Create a PayPal Developer Account

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Sign in with your PayPal account
3. If you don't have a business account, you can use the Sandbox for testing

## Step 2: Create a PayPal App

1. In the PayPal Developer Dashboard, click on **"My Apps & Credentials"**
2. Under the **Sandbox** or **Live** tab (depending on your needs), click **"Create App"**
3. Enter an **App Name** (e.g., "Molecular Research Tools")
4. Click **"Create App"**
5. You will see your **Client ID** and **Secret** - keep these safe!

## Step 3: Configure Environment Variables

1. Copy the `.env.example` file to create your `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Add your PayPal credentials to the `.env` file:
   ```env
   # PayPal Configuration
   PAYPAL_CLIENT_ID=your_sandbox_client_id_here
   PAYPAL_CLIENT_SECRET=your_sandbox_secret_here
   PAYPAL_MODE=sandbox
   PAYPAL_PORT=3002
   ```

3. For production, use your Live credentials and set `PAYPAL_MODE=live`:
   ```env
   PAYPAL_CLIENT_ID=your_live_client_id_here
   PAYPAL_CLIENT_SECRET=your_live_secret_here
   PAYPAL_MODE=live
   ```

## Step 4: Testing with Sandbox

1. Go to the [Sandbox Accounts](https://developer.paypal.com/dashboard/accounts) page
2. PayPal automatically creates test buyer and seller accounts for you
3. Use these test accounts to make test payments:
   - **Personal (Buyer) Account**: Use to make test purchases
   - **Business (Seller) Account**: Receives test payments

### Test Credentials
You can find test account credentials in your PayPal Developer Dashboard under "Sandbox > Accounts"

## Step 5: Run the Application

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```

   This will start:
   - Vite dev server (frontend) on port 5173
   - Stripe server on port 3001
   - PayPal server on port 3002

3. Or run PayPal server separately:
   ```bash
   npm run paypal-server
   ```

## Step 6: Test the Payment Flow

1. Navigate to the **Paid Plans** page in your application
2. Select **PayPal** as the payment method
3. Choose a plan and click the purchase button
4. You'll be redirected to PayPal's payment page
5. Log in with your Sandbox buyer account
6. Complete the payment
7. You'll be redirected back to your application with a success message

## API Endpoints

The PayPal server provides the following endpoints:

- `POST /api/paypal/create-order` - Create a new PayPal order
- `POST /api/paypal/capture-order/:orderId` - Capture/complete a PayPal order
- `GET /api/paypal/order/:orderId` - Get order details

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Keep your Secret secure** - only store it in environment variables
3. **Use Sandbox mode** for development and testing
4. **Validate webhook signatures** in production (implement webhook handling as needed)
5. **Use HTTPS** in production

## Troubleshooting

### "PayPal is not configured" Error
- Check that `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set in your `.env` file
- Restart the PayPal server after updating environment variables

### Sandbox Payments Not Working
- Ensure you're using Sandbox credentials (not Live credentials)
- Verify `PAYPAL_MODE=sandbox` is set
- Check that your Sandbox accounts are active in the Developer Dashboard

### CORS Errors
- The PayPal server includes CORS headers by default
- If you're hosting on a different domain, update the CORS configuration in `paypal-server.cjs`

### Production Issues
- Ensure you've switched to Live credentials
- Set `PAYPAL_MODE=live`
- Configure proper SSL certificates for HTTPS
- Test thoroughly before going live

## Going Live

Before accepting real payments:

1. Switch to Live credentials in your `.env` file
2. Set `PAYPAL_MODE=live`
3. Complete PayPal's business verification process
4. Test the entire payment flow with small amounts
5. Implement proper error handling and logging
6. Set up webhook handlers for payment notifications
7. Ensure SSL/HTTPS is properly configured

## Webhook Integration (Optional)

For production applications, implement webhook handlers to receive payment notifications:

1. In your PayPal App settings, add a webhook URL
2. Select events to subscribe to (e.g., `PAYMENT.CAPTURE.COMPLETED`)
3. Implement webhook verification and handling in your backend
4. Update user credits/subscriptions based on webhook events

## Support

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Sandbox Testing](https://developer.paypal.com/docs/api-basics/sandbox/)

## Additional Features

Consider implementing:

- **Subscription Payments**: Use PayPal's subscription API for recurring payments
- **Refunds**: Implement refund functionality for customer support
- **Payment History**: Store and display payment history for users
- **Multiple Currencies**: Support international payments with currency conversion
- **Webhooks**: Implement webhook handlers for reliable payment tracking
