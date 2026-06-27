import { config } from './config.js';
import { HttpError } from './errors.js';

export const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

export const setCorsHeaders = (req, res) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = config.corsOrigin === '*' ? '*' : config.corsOrigin;

  if (allowedOrigin === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && requestOrigin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export const parseJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
};

export const handleError = (res, error) => {
  if (error instanceof HttpError) {
    return sendJson(res, error.statusCode, {
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  console.error(error);
  return sendJson(res, 500, {
    success: false,
    message: 'Internal server error',
  });
};