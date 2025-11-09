import 'dotenv/config';
import fetch from 'node-fetch';

const base = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-01/shop.json`;
const res = await fetch(base, {
  headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
});
const json = await res.json();
console.log(json);
node ping.js
