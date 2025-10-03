/**
 * Backend for Instagram Unfollowers - Updated (OAuth + token handling)
 */
const express = require('express')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()
const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT || 4000
const APP_ID = process.env.APP_ID || ''
const APP_SECRET = process.env.APP_SECRET || ''
const REDIRECT_URI = process.env.REDIRECT_URI || ''
const TOKENS_FILE = path.join(__dirname, 'tokens.json')
function saveTokens(obj) {
  try { fs.writeFileSync(TOKENS_FILE, JSON.stringify(obj, null, 2)) } catch (e) { console.error('Error saving tokens', e) }
}
function loadTokens() {
  try { if (fs.existsSync(TOKENS_FILE)) return JSON.parse(fs.readFileSync(TOKENS_FILE)) } catch(e){}
  return {}
}
const sampleFollowing = [
  { username: 'alice', profile_pic_url: 'https://i.pravatar.cc/150?img=1' },
  { username: 'bob', profile_pic_url: 'https://i.pravatar.cc/150?img=2' },
  { username: 'charlie', profile_pic_url: 'https://i.pravatar.cc/150?img=3' },
  { username: 'doruk', profile_pic_url: 'https://i.pravatar.cc/150?img=4' },
  { username: 'esen', profile_pic_url: 'https://i.pravatar.cc/150?img=5' }
]
const sampleFollowers = [
  { username: 'alice', profile_pic_url: 'https://i.pravatar.cc/150?img=1' },
  { username: 'charlie', profile_pic_url: 'https://i.pravatar.cc/150?img=3' }
]
function computeNonFollowers(following, followers) {
  const followersSet = new Set(followers.map(u => u.username.toLowerCase()))
  return following.filter(u => !followersSet.has(u.username.toLowerCase()))
}
app.use('/', express.static(path.join(__dirname, '../frontend')))
app.get('/auth/instagram', (req, res) => {
  if (!APP_ID || !REDIRECT_URI) {
    return res.status(500).send('APP_ID or REDIRECT_URI not configured in environment. Set APP_ID, APP_SECRET and REDIRECT_URI.')
  }
  const scope = encodeURIComponent('instagram_basic,instagram_manage_insights,pages_show_list')
  const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code&auth_type=rerequest`
  res.redirect(url)
})
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code
  if (!code) { return res.status(400).send('No code provided in query string.') }
  if (!APP_ID || !APP_SECRET || !REDIRECT_URI) { return res.status(500).send('OAuth not configured (APP_ID/APP_SECRET/REDIRECT_URI missing).') }
  try {
    const tokenResp = await axios.post('https://graph.facebook.com/v21.0/oauth/access_token', new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code,
    }).toString(), { headers: {'Content-Type':'application/x-www-form-urlencoded'} })
    const shortToken = tokenResp.data.access_token
    console.log('Short-lived token received.')
    const exchangeResp = await axios.get('https://graph.instagram.com/access_token', { params: { grant_type: 'ig_exchange_token', client_secret: APP_SECRET, access_token: shortToken } })
    const longToken = exchangeResp.data.access_token
    console.log('Long-lived token received.')
    const profileResp = await axios.get('https://graph.instagram.com/me', { params: { fields: 'id,username,account_type,media_count', access_token: longToken } })
    const tokens = { short_token: shortToken, long_token: longToken, profile: profileResp.data, obtained_at: new Date().toISOString() }
    saveTokens(tokens)
    res.redirect('/app.html?logged=1')
  } catch (err) {
    console.error('OAuth error', err.response?.data || err.message)
    res.status(500).send('Token exchange failed: ' + (err.response?.data?.error?.message || err.message))
  }
})
app.get('/me', (req, res) => {
  const tokens = loadTokens()
  if (!tokens.long_token) return res.status(404).json({ error: 'No token stored. Please login first.' })
  res.json(tokens.profile || {})
})
app.get('/api/unfollowers', (req, res) => {
  const nonFollowers = computeNonFollowers(sampleFollowing, sampleFollowers)
  res.json({ nonFollowers, count: nonFollowers.length, snapshot_at: new Date().toISOString() })
})
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) })