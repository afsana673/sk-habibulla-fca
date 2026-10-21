'use strict';

class MessengerAPIError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'MessengerAPIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function graphPost({ fetchImpl, apiVersion, pageId, accessToken, payload, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pageId)}/messages`;
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const bodyText = await response.text();
    let result;
    try { result = bodyText ? JSON.parse(bodyText) : {}; }
    catch { throw new MessengerAPIError('Graph API returned an invalid JSON response', response.status); }
    if (!response.ok || result.error) {
      const apiError = result.error || {};
      throw new MessengerAPIError(
        apiError.message || `Graph API request failed (HTTP ${response.status})`,
        response.status, apiError.code, apiError
      );
    }
    return result;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new MessengerAPIError('Graph API request timed out', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { MessengerAPIError, graphPost };
