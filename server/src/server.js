import 'dotenv/config';
import { createApp } from './app.js';
import pool from './db.js';

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
