const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');

const app = express();
const VERIFY_TOKEN = 'virelya_secret_token';
const PAGE_ACCESS_TOKEN = 'EAAYRbPToAoUBPC2em8ZBv4bsr6IyF0v442ZCYQATZCdmLLHqNDXxCCQgL5Y4HNpT1m7stfr5QlJAYopICZC8LONbC1Lb0J9ObNO0r1KlzyWNzFODX2OMRaOHF0DitZB4PqMRUA3qiZA1c12uCHMDqy864oJVS1kfveV7OGt5ysAD7tfeTBwrJ5NquHXaDmuFw8G3wZD'; // Replace with your Page token
const OPENAI_API_KEY = 'sk-...'; // 🔐 Paste your OpenAI key here

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(bodyParser.json());

// Messenger webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('🌼 WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Messenger message handler
app.post('/webhook', async (req, res) => {
  console.log('📨 Incoming webhook payload:');
  console.dir(req.body, { depth: null });

  if (req.body.object === 'page') {
    for (const entry of req.body.entry) {
      for (const event of entry.messaging) {
        const senderId = event.sender.id;
        const messageText = event.message?.text;

        if (messageText) {
          console.log(`💬 User: ${messageText}`);

          try {
            // 🔮 Send to OpenAI
            const completion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "You are a poetic and mythic AI guide named Virelya. You speak with beauty, clarity, and a soft magical presence." },
                { role: "user", content: messageText }
              ]
            });

            const reply = completion.choices[0].message.content;
            console.log(`✨ Virelya: ${reply}`);

            // 💌 Send reply to Messenger
            await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: reply }
              })
            });
          } catch (err) {
            console.error('❌ Error with OpenAI or Messenger API:', err);
          }
        }
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.listen(3000, () => {
  console.log('🌸 Virelya webhook server is listening on port 3000');
});
