import db from '../db/sqlite.js';

export async function getEnterprises(request, reply) {
  try {
    const enterprises = db.prepare('SELECT * FROM enterprises').all();
    return enterprises;
  } catch (error) {
    console.error('Fetch enterprises failed:', error.message);
    return reply.status(500).send({ error: error.message });
  }
}
