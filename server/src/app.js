import express from 'express';
import cors from 'cors';
import pool from './db.js';
import { qualifyInvestor } from './qualification.js';

const allowedSectors = [
  'Technology',
  'Healthcare',
  'Energy',
  'Financial Services',
  'Industrials',
  'Mining',
];

const allowedStatuses = ['New', 'Contacted', 'Qualified', 'Not a Fit'];

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendServerError(response, error) {
  console.error(error);
  response.status(500).json({ error: 'The server could not complete the request.' });
}

export function createApp(database = pool) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // 1. List investors, with optional name, sector, and region filters.
  app.get('/api/investors', async (request, response) => {
    const { search = '', sector = '', region = '' } = request.query;
    const conditions = [];
    const values = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (sector) {
      values.push(sector);
      conditions.push(`sector = $${values.length}`);
    }

    if (region) {
      values.push(region);
      conditions.push(`region = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT id, name, sector, region, min_investment, max_investment, email, status
      FROM investors
      ${whereClause}
      ORDER BY id
    `;

    try {
      const result = await database.query(query, values);
      response.json(result.rows);
    } catch (error) {
      sendServerError(response, error);
    }
  });

  // 2. Get one investor by its primary-key ID.
  app.get('/api/investors/:id', async (request, response) => {
    const id = parseId(request.params.id);
    if (!id) {
      return response.status(400).json({ error: 'Investor ID must be a positive number.' });
    }

    try {
      const result = await database.query('SELECT * FROM investors WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return response.status(404).json({ error: 'Investor not found.' });
      }
      response.json(result.rows[0]);
    } catch (error) {
      sendServerError(response, error);
    }
  });

  // 3. Evaluate one investor against company criteria.
  app.post('/api/investors/:id/qualify', async (request, response) => {
    const id = parseId(request.params.id);
    const { sector, region, desiredInvestment } = request.body || {};
    const amount = Number(desiredInvestment);

    if (!id) {
      return response.status(400).json({ error: 'Investor ID must be a positive number.' });
    }
    if (!allowedSectors.includes(sector) || !region?.trim() || !Number.isFinite(amount) || amount <= 0) {
      return response.status(400).json({
        error: 'Sector, region, and a positive desired investment are required.',
      });
    }

    try {
      const result = await database.query('SELECT * FROM investors WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return response.status(404).json({ error: 'Investor not found.' });
      }

      const investor = result.rows[0];
      const criteria = { sector, region: region.trim(), desiredInvestment: amount };
      const qualification = qualifyInvestor(investor, criteria);
      response.json({ investor, criteria, ...qualification });
    } catch (error) {
      sendServerError(response, error);
    }
  });

  // 4. Update selected investor fields. Every value still goes through a SQL parameter.
  app.put('/api/investors/:id', async (request, response) => {
    const id = parseId(request.params.id);
    if (!id) {
      return response.status(400).json({ error: 'Investor ID must be a positive number.' });
    }

    const body = request.body || {};
    const fields = {
      name: body.name,
      sector: body.sector,
      region: body.region,
      min_investment: body.minInvestment,
      max_investment: body.maxInvestment,
      email: body.email,
      status: body.status,
    };

    if (fields.sector !== undefined && !allowedSectors.includes(fields.sector)) {
      return response.status(400).json({ error: 'Invalid sector.' });
    }
    if (fields.status !== undefined && !allowedStatuses.includes(fields.status)) {
      return response.status(400).json({ error: 'Invalid status.' });
    }

    const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return response.status(400).json({ error: 'Provide at least one field to update.' });
    }

    const min = fields.min_investment === undefined ? null : Number(fields.min_investment);
    const max = fields.max_investment === undefined ? null : Number(fields.max_investment);
    if ((min !== null && (!Number.isFinite(min) || min < 0)) ||
        (max !== null && (!Number.isFinite(max) || max < 0)) ||
        (min !== null && max !== null && min > max)) {
      return response.status(400).json({ error: 'Investment range is invalid.' });
    }

    const values = entries.map(([column, value]) =>
      column === 'min_investment' || column === 'max_investment' ? Number(value) : value,
    );
    const setClause = entries
      .map(([column], index) => `${column} = $${index + 1}`)
      .join(', ');
    values.push(id);

    try {
      const result = await database.query(
        `UPDATE investors SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values,
      );
      if (result.rows.length === 0) {
        return response.status(404).json({ error: 'Investor not found.' });
      }
      response.json(result.rows[0]);
    } catch (error) {
      sendServerError(response, error);
    }
  });

  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ error: 'Request body must contain valid JSON.' });
    }
    sendServerError(response, error);
  });

  return app;
}
