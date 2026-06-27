import { config } from './config.js';

/**
 * Format a Sri Lankan phone number to international format (94XXXXXXXXX).
 * Handles formats: 0773630237, +94773630237, 94773630237, 773630237
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, '');

  // Remove leading +
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);

  // Convert local format (07X) to international (947X)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  }

  // If it's just 9 digits without country code, add 94
  if (cleaned.length === 9 && !cleaned.startsWith('94')) {
    cleaned = '94' + cleaned;
  }

  return cleaned;
};

/**
 * Send an SMS via the Text.lk API (OAuth 2.0 Bearer Token method).
 * 
 * For testing: all messages are sent to the configured test number.
 * In production: pass the actual borrower phone number.
 * 
 * @param {string} recipientPhone - The borrower's phone number
 * @param {string} message - The SMS message body
 * @returns {Promise<object|null>} - The API response data, or null if SMS is disabled
 */
export const sendSMS = async (recipientPhone, message) => {
  const token = config.textlkApiToken;

  if (!token) {
    console.warn('[SMS] TEXTLK_API_TOKEN not configured. SMS not sent.');
    return null;
  }

  // For testing: override recipient to the test number
  const testNumber = '94773630237';
  const recipient = testNumber; // Change to formatPhoneNumber(recipientPhone) for production

  try {
    const response = await fetch('https://app.text.lk/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recipient,
        sender_id: config.textlkSenderId,
        type: 'plain',
        message,
      }),
    });

    const data = await response.json();

    if (data.status) {
      console.log(`[SMS] Sent successfully to ${recipient}: "${message.substring(0, 50)}..."`);
    } else {
      console.error(`[SMS] Failed: ${data.message}`);
    }

    return data;
  } catch (error) {
    console.error('[SMS] Error sending SMS:', error.message);
    return null;
  }
};
