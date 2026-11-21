// 指定した月（YYYY-MM）の全記録を返す関数（月次集計用）
const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  // 2026-11 修正：この書き方（exports.handler）の関数では、Blobsを使う前に connectLambda(event) が必要。
  // これが無いと getStore で例外になり、画面には502が返って端末内だけに保存されていた。
  let store;
  try {
    connectLambda(event);
    store = getStore('kadoritsu-entries');
  } catch (e) {
    console.log('[blobs] 接続できませんでした:', e && e.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'storage unavailable' }) };
  }
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
