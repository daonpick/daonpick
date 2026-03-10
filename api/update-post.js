/**
 * [REF: VOL_03.3] Web App 보안 통신 로직 100% 반영.
 * - 클라이언트 다이렉트 DB 접근 차단: 본 엔드포인트에서만 DB Update 수행.
 * - API 페이로드: POST Body { post_id, content_html, initData }.
 * - HMAC-SHA256 서명 검증: TELEGRAM_BOT_TOKEN 사용. secret_key = HMAC_SHA256(key=WebAppData, msg=bot_token), hash = HMAC_SHA256(key=secret_key, msg=data_check_string). [VOL_03.3]
 * - 검증 통과 시 SUPABASE_SERVICE_ROLE_KEY로 post_queue.content_html 업데이트 및 status = 'Ready', HTTP 200. 불일치 시 401/403.
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Telegram initData 검증 (공식 문서: secret_key = HMAC_SHA256(bot_token, "WebAppData"), then hex(HMAC_SHA256(data_check_string, secret_key)) === hash)
 * @param {string} initData - Telegram.WebApp.initData (query string)
 * @returns {boolean}
 */
function verifyTelegramWebAppData(initData) {
  if (!BOT_TOKEN || !initData || typeof initData !== 'string') return false;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;
  params.delete('hash');
  params.delete('signature');
  const sortedKeys = [...params.keys()].sort();
  const dataCheckString = sortedKeys.map((k) => `${k}=${params.get(k)}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { post_id, content_html, initData } = req.body || {};
  if (!post_id || content_html == null || !initData) {
    return res.status(400).json({ error: 'Missing post_id, content_html, or initData' });
  }

  if (!verifyTelegramWebAppData(initData)) {
    return res.status(401).json({ error: 'Invalid or tampered initData' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Server configuration error' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('post_queue')
      .update({ content_html: String(content_html), status: 'Ready' })
      .eq('id', post_id)
      .select('id')
      .single();

    if (error) {
      return res.status(500).json({ error: 'DB update failed', details: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: 'Post not found' });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
