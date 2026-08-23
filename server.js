const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const initialPort = Number(process.env.PORT || 3000);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 2000);
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', contactLimiter, async (req, res) => {
  const name = sanitize(req.body.name);
  const email = sanitize(req.body.email);
  const message = sanitize(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide your name, email, and a message.' });
  }

  if (name.length > 100) {
    return res.status(400).json({ success: false, message: 'Name is too long.' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || smtpUser;
  const toEmail = process.env.TO_EMAIL || 'djweirdnasty@gmail.com';

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(500).json({
      success: false,
      message: 'Email credentials are not configured yet. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and TO_EMAIL in your environment.'
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `New website enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    });

    return res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy. Trying ${nextPort} instead.`);
      startServer(nextPort);
    } else {
      console.error(error);
      process.exit(1);
    }
  });
};

startServer(initialPort);
