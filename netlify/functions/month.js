// 指定した月（YYYY-MM）の全記録を返す関数（月次集計用）
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const store = getStore('kadoritsu-entries');
  const month = event.queryStringParameters && event.queryStringParameters.month;
  if (!month) {
    return { statusCode: 400, body: JSON.stringify({ error: 'month is required' }) };
  }
  try {
    const { blobs } = await store.list({ prefix: `daily:${month}` });
    const entries = [];
    for (const b of blobs || []) {
      const value = await store.get(b.key, { type: 'text' });
      if (value) {
        try {
          const e = JSON.parse(value);
          e._date = b.key.replace('daily:', '');
          entries.push(e);
        } catch (err) {
          // 壊れたデータはスキップ
        }
      }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'list failed' }) };
  }
};
