// 1日分の記録を取得（GET）・保存（POST）する関数
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const store = getStore('kadoritsu-entries');

  if (event.httpMethod === 'GET') {
    const date = event.queryStringParameters && event.queryStringParameters.date;
    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ error: 'date is required' }) };
    }
    try {
      const value = await store.get(`daily:${date}`, { type: 'text' });
      const entry = value ? JSON.parse(value) : null;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'read failed' }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid json body' }) };
    }
    const { date, entry } = payload || {};
    if (!date || !entry) {
      return { statusCode: 400, body: JSON.stringify({ error: 'date and entry are required' }) };
    }
    try {
      await store.set(`daily:${date}`, JSON.stringify(entry));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'write failed' }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
