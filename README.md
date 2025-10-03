
Instagram Unfollowers - Ready Demo (OAuth + Token Handling)
----------------------------------------------------------

This updated package adds OAuth login flow and token handling to the backend.
Frontend login now redirects to /auth/instagram which starts the OAuth flow.

IMPORTANT: You must create a Meta/Instagram app and set these environment variables
in backend/.env or your environment before running the server:

  APP_ID=your_app_id
  APP_SECRET=your_app_secret
  REDIRECT_URI=https://your-ngrok-url/auth/callback

Steps to run:
1) In backend folder:
   - create a .env file with the three variables above (APP_ID, APP_SECRET, REDIRECT_URI)
   - npm install
   - npm start

2) Start ngrok to expose your local server (if using localhost):
   npx ngrok http 4000
   Copy the https://... ngrok url and use it as REDIRECT_URI (append /auth/callback when registering in Meta)

3) In Meta Developers:
   - Set Redirect URI to the same REDIRECT_URI value (https://your-ngrok-url/auth/callback)
   - Ensure required permissions are requested (instagram_basic, instagram_manage_insights, pages_show_list)

Notes:
- After login, tokens are stored in backend/tokens.json (for demo only). For production, use secure storage & encryption.
- This demo converts the short-lived token to a long-lived token and stores the profile data.
