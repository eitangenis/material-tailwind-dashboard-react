/**
 * PayPal Client Utilities
 * Helper functions for PayPal payment integration
 */

/**
 * Create a PayPal order
 * @param {Object} planDetails - Plan information
 * @param {string} planDetails.planName - Name of the plan
 * @param {number} planDetails.price - Price of the plan
 * @returns {Promise<Object>} Order details with orderId and approvalUrl
 */
export async function createPayPalOrder(planDetails) {
  try {
    const token = localStorage.getItem('auth_token');
    const port = window.location.hostname === 'localhost' ? '3002' : '3002';
    const protocol = window.location.protocol;
    
    const response = await fetch(
      `${protocol}//${window.location.hostname}:${port}/api/paypal/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(planDetails),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create PayPal order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}

/**
 * Capture/complete a PayPal order
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<Object>} Capture result
 */
export async function capturePayPalOrder(orderId) {
  try {
    const token = localStorage.getItem('auth_token');
    const port = window.location.hostname === 'localhost' ? '3002' : '3002';
    const protocol = window.location.protocol;
    
    const response = await fetch(
      `${protocol}//${window.location.hostname}:${port}/api/paypal/capture-order/${orderId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to capture PayPal order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
}

/**
 * Get PayPal order details
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<Object>} Order details
 */
export async function getPayPalOrderDetails(orderId) {
  try {
    const token = localStorage.getItem('auth_token');
    const port = window.location.hostname === 'localhost' ? '3002' : '3002';
    const protocol = window.location.protocol;
    
    const response = await fetch(
      `${protocol}//${window.location.hostname}:${port}/api/paypal/order/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get PayPal order details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting PayPal order details:', error);
    throw error;
  }
}

export default {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrderDetails,
};
