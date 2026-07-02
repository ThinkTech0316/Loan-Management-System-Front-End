import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/loans',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Id': 'dummy', // Will fail borrower validation, but we can see the error
    'X-User-Id': 'dummy-user'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', console.error);
req.write(JSON.stringify({
  borrowerId: 'e20a06bd-ee6a-4d92-bb8a-1a3b10b4f8d5',
  amount: 1000,
  interestRate: 10,
  durationMonths: 12,
  startDate: '2026-02-02',
  repaymentFrequency: 'monthly'
}));
req.end();
