require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const INTEGRAIL_API = `https://cloud.integrail.ai/api/${process.env.INTEGRAIL_ACCOUNT_ID}`;

async function checkExecutionStatus(executionId) {
  const response = await axios.get(
    `${INTEGRAIL_API}/agent/${executionId}/status`,
    {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTEGRAIL_AUTH_TOKEN}`
      }
    }
  );
  return response.data;
}

async function waitForCompletion(executionId) {
  while (true) {
    const result = await checkExecutionStatus(executionId);
    if (result.execution.status === 'finished') {
      return result.execution.outputs;
    }
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait 1 second before next check
  }
}

app.post('/webhook', async (req, res) => {
  try {
    const incomingMsg = req.body.Body;
    const from = req.body.From;

    // Start execution
    const executeResponse = await axios.post(
      `${INTEGRAIL_API}/agent/${process.env.INTEGRAIL_AGENT_ID}/execute`,
      {
        inputs: {
          userPrompt: incomingMsg
        },
        executionId: from
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTEGRAIL_AUTH_TOKEN}`
        }
      }
    );

    // Wait for completion
    const outputs = await waitForCompletion(executeResponse.data.executionId);
    const aiResponse = outputs['4-output'];

    // Send response via Twilio
    await client.messages.create({
      body: aiResponse,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from
    });

    res.status(200).send('Message sent successfully');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error processing message');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
