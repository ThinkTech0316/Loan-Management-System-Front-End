import { config } from './config.js';
import { bootstrapDatabase } from './bootstrap.js';

// Auto-create database, tables, and seed data on every startup
await bootstrapDatabase();

const { createApp } = await import('./app.js');

const server = createApp();

server.listen(config.port, () => {
  console.log(`Loan Management API running on http://localhost:${config.port}`);
  console.log(`Health: http://localhost:${config.port}/health`);
  console.log(`API base: http://localhost:${config.port}/api`);
});
