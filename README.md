# Twilio Bot

A simple Twilio bot that echoes back messages.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your .env file with your Twilio credentials:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER

3. Start the server:
```bash
npm start
```

4. Use ngrok or similar to expose your local server:
```bash
ngrok http 3000
```

5. Configure your Twilio webhook URL to point to your ngrok URL + /webhook 