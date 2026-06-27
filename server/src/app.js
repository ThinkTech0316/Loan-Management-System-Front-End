import { createServer } from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { notFound } from './errors.js';
import { handleError, parseJsonBody, sendJson, setCorsHeaders } from './http.js';
import {
  addBorrower,
  changePassword,
  createFixedDeposit,
  createLoan,
  deleteFixedDeposit,
  deleteLoan,
  deleteNotification,
  deleteBorrower,
  deleteRepayment,
  getFixedDeposit,
  getFDEarningsSchedule,
  getBorrower,
  getCollectionData,
  getLoan,
  getRepayment,
  getRepaymentSchedule,
  getStats,
  getSetting,
  listDeletedBorrowers,
  listFixedDeposits,
  listNotifications,
  listSettings,
  listBorrowers,
  listLoans,
  listRepayments,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  permanentlyDeleteBorrower,
  recordRepayment,
  requestPasswordReset,
  restoreBorrower,
  updateBorrower,
  updateFixedDeposit,
  updateLoan,
  upsertSetting,
  getTenantUsers,
  createTenantUser,
  deleteTenantUser,
} from './services.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const ok = (res, data, statusCode = 200) => sendJson(res, statusCode, { success: true, data });

const parseRoute = (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  return { url, pathParts };
};

const handleUpload = (req, res) => new Promise((resolve, reject) => {
  const boundary = req.headers['content-type']?.split('boundary=')[1];
  if (!boundary) {
    reject(new Error('No boundary in content-type'));
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const boundaryBuffer = Buffer.from(`--${boundary}`);

    let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;
    // Skip the CRLF after boundary
    if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) start += 2;

    // Find end of headers (double CRLF)
    const headerEnd = buffer.indexOf('\r\n\r\n', start);
    if (headerEnd === -1) { reject(new Error('Invalid multipart')); return; }

    const headerSection = buffer.slice(start, headerEnd).toString();
    const filenameMatch = headerSection.match(/filename="([^"]+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'upload';

    const dataStart = headerEnd + 4;
    // Find closing boundary
    const endBoundary = buffer.indexOf(boundaryBuffer, dataStart);
    const dataEnd = endBoundary > -1 ? endBoundary - 2 : buffer.length;

    const fileData = buffer.slice(dataStart, dataEnd);

    const ext = path.extname(filename).toLowerCase() || '.jpg';
    const safeName = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFile(filePath, fileData, (err) => {
      if (err) { reject(err); return; }
      resolve(`/uploads/${safeName}`);
    });
  });
  req.on('error', reject);
});

const serveStaticFile = (req, res, url) => {
  const filePath = url.pathname.replace(/^\/uploads\//, '');
  const sanitized = path.basename(filePath);
  const fullPath = path.join(UPLOADS_DIR, sanitized);

  if (!fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileContent = fs.readFileSync(fullPath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(fileContent);
};

const routeRequest = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { url, pathParts } = parseRoute(req);

  // Serve uploaded files
  if (pathParts[0] === 'uploads') {
    serveStaticFile(req, res, url);
    return;
  }

  if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'health') {
    ok(res, { status: 'ok', service: 'loan-management-api' });
    return;
  }

  if (pathParts[0] !== 'api') throw notFound('Route not found');

  const resource = pathParts[1];
  const id = pathParts[2];
  const subResource = pathParts[3];

  if (req.method === 'POST' && resource === 'upload') {
    const fileUrl = await handleUpload(req, res);
    ok(res, { url: fileUrl });
    return;
  }

  if (req.method === 'POST' && resource === 'auth' && id === 'login') {
    ok(res, await login(await parseJsonBody(req)));
    return;
  }

  if (req.method === 'POST' && resource === 'tenants' && !id) {
    const { createTenant } = await import('./services.js');
    ok(res, await createTenant(await parseJsonBody(req)), 201);
    return;
  }

  if (req.method === 'POST' && resource === 'auth' && id === 'forgot-password') {
    ok(res, await requestPasswordReset(await parseJsonBody(req)));
    return;
  }

  if (req.method === 'POST' && resource === 'auth' && id === 'change-password') {
    ok(res, await changePassword(await parseJsonBody(req)));
    return;
  }

  if (req.method === 'GET' && resource === 'stats' && !id) {
    ok(res, await getStats());
    return;
  }

  if (req.method === 'GET' && resource === 'collection-data' && !id) {
    ok(res, await getCollectionData());
    return;
  }

  if (resource === 'borrowers') {
    if (req.method === 'GET' && !id) {
      const deleted = pathParts[2] === 'deleted' || url.searchParams.get('deleted') === 'true';
      return ok(res, deleted ? await listDeletedBorrowers() : await listBorrowers());
    }
    if (req.method === 'GET' && id === 'deleted') return ok(res, await listDeletedBorrowers());
    if (req.method === 'GET' && id) return ok(res, await getBorrower(id));
    if (req.method === 'POST' && !id) return ok(res, await addBorrower(await parseJsonBody(req)), 201);
    if ((req.method === 'PATCH' || req.method === 'PUT') && id && subResource === 'restore') return ok(res, await restoreBorrower(id));
    if ((req.method === 'DELETE') && id && subResource === 'permanent') return ok(res, await permanentlyDeleteBorrower(id));
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) return ok(res, await updateBorrower(id, await parseJsonBody(req)));
    if (req.method === 'DELETE' && id) return ok(res, await deleteBorrower(id));
  }

  if (resource === 'loans') {
    if (req.method === 'GET' && !id) return ok(res, await listLoans({ status: url.searchParams.get('status') || undefined }));
    if (req.method === 'GET' && id && subResource === 'schedule') return ok(res, await getRepaymentSchedule(id));
    if (req.method === 'GET' && id) return ok(res, await getLoan(id));
    if (req.method === 'POST' && !id) return ok(res, await createLoan(await parseJsonBody(req)), 201);
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) return ok(res, await updateLoan(id, await parseJsonBody(req)));
    if (req.method === 'DELETE' && id) return ok(res, await deleteLoan(id));
  }

  if (resource === 'repayments') {
    if (req.method === 'GET' && !id) return ok(res, await listRepayments({ loanId: url.searchParams.get('loanId') || undefined }));
    if (req.method === 'GET' && id) return ok(res, await getRepayment(id));
    if (req.method === 'POST' && !id) return ok(res, await recordRepayment(await parseJsonBody(req)), 201);
    if (req.method === 'DELETE' && id) return ok(res, await deleteRepayment(id));
  }

  if (resource === 'fixed-deposits') {
    if (req.method === 'GET' && !id) return ok(res, await listFixedDeposits({ status: url.searchParams.get('status') || undefined }));
    if (req.method === 'GET' && id && subResource === 'earnings') return ok(res, await getFDEarningsSchedule(id));
    if (req.method === 'GET' && id) return ok(res, await getFixedDeposit(id));
    if (req.method === 'POST' && !id) return ok(res, await createFixedDeposit(await parseJsonBody(req)), 201);
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) return ok(res, await updateFixedDeposit(id, await parseJsonBody(req)));
    if (req.method === 'DELETE' && id) return ok(res, await deleteFixedDeposit(id));
  }

  if (resource === 'notifications') {
    if (req.method === 'GET' && !id) return ok(res, await listNotifications());
    if ((req.method === 'PATCH' || req.method === 'PUT') && id === 'read-all') return ok(res, await markAllNotificationsRead());
    if ((req.method === 'PATCH' || req.method === 'PUT') && id && subResource === 'read') return ok(res, await markNotificationRead(id));
    if (req.method === 'DELETE' && id) return ok(res, await deleteNotification(id));
  }

  if (resource === 'settings') {
    if (req.method === 'GET' && !id) return ok(res, await listSettings());
    if (req.method === 'GET' && id) return ok(res, await getSetting(id));
    if ((req.method === 'PUT' || req.method === 'PATCH') && id) return ok(res, await upsertSetting(id, await parseJsonBody(req)));
  }

  if (resource === 'users') {
    if (req.method === 'GET' && !id) return ok(res, await getTenantUsers());
    if (req.method === 'POST' && !id) return ok(res, await createTenantUser(await parseJsonBody(req)), 201);
    if (req.method === 'DELETE' && id) return ok(res, await deleteTenantUser(id));
  }

  throw notFound('Route not found');
};

import { tenantContext } from './database.js';

export const createApp = () => createServer(async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    if (tenantId) {
      tenantContext.run(tenantId, async () => {
        try {
          await routeRequest(req, res);
        } catch (error) {
          handleError(res, error);
        }
      });
    } else {
      await routeRequest(req, res);
    }
  } catch (error) {
    handleError(res, error);
  }
});
