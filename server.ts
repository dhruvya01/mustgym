import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import { generateWorkoutPlan, generateDietPlan, generateAdminInsights } from './src/server/gemini';

// Initialize Firebase Admin (Only needed if we are generating links backend side)
// Note: We need a Service Account JSON for this. If the user doesn't have it, we will load it from env later.
let firebaseAdminInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    firebaseAdminInitialized = true;
  }
} catch (e) {
  console.log("Firebase Admin not initialized yet. Ensure FIREBASE_SERVICE_ACCOUNT is in .env");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  // Rate Limiting for AI Routes
  const userRateLimits = new Map<string, { count: number, resetTime: number }>();
  const RATE_LIMIT_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const MAX_REQUESTS = 2; // Twice every 3 hours

  const checkRateLimit = (userId: string) => {
    const now = Date.now();
    const userLimit = userRateLimits.get(userId);

    if (userLimit) {
      if (now > userLimit.resetTime) {
        // Reset limit if time has passed
        userRateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_DURATION });
        return { allowed: true };
      } else if (userLimit.count < MAX_REQUESTS) {
        userLimit.count += 1;
        return { allowed: true };
      } else {
        const hoursLeft = Math.ceil((userLimit.resetTime - now) / (1000 * 60 * 60));
        return { allowed: false, message: `You have reached the limit of ${MAX_REQUESTS} AI generations. Please try again in ${hoursLeft} hour(s).` };
      }
    } else {
      userRateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_DURATION });
      return { allowed: true };
    }
  };

  // AI Routes
  app.post('/api/ai/workout', async (req, res) => {
    try {
      const { preferences, fitnessLevel, goals, availableEquipment, userId } = req.body;
      
      if (userId) {
        const limit = checkRateLimit(userId);
        if (!limit.allowed) {
          return res.status(429).json({ error: limit.message });
        }
      }

      const plan = await generateWorkoutPlan(preferences || '', fitnessLevel || 'Beginner', goals || 'General fitness', availableEquipment || []);
      res.json(plan);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/ai/diet', async (req, res) => {
    try {
      const { preferences, fitnessLevel, goals, userId } = req.body;

      if (userId) {
        const limit = checkRateLimit(userId);
        if (!limit.allowed) {
          return res.status(429).json({ error: limit.message });
        }
      }

      const plan = await generateDietPlan(preferences || '', fitnessLevel || 'Beginner', goals || 'General fitness');
      res.json(plan);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/ai/insights', async (req, res) => {
    try {
      const { metrics } = req.body;
      const insights = await generateAdminInsights(metrics || {});
      res.json(insights);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Custom Password Reset Email Route
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      if (!firebaseAdminInitialized) {
        return res.status(500).json({ error: 'Firebase Admin is not configured on the server yet.' });
      }

      let link;
      try {
        const customLink = await admin.auth().generatePasswordResetLink(email);
        
        // Use FRONTEND_URL if set, otherwise default to the production web app URL
        const appOrigin = process.env.FRONTEND_URL || 'https://mustgymm.web.app';
        
        const urlObj = new URL(customLink);
        // Point to our app's /reset-password route, carrying over the query parameters (oobCode, apiKey, etc.)
        link = `${appOrigin}/reset-password${urlObj.search}`;
        
      } catch (authError: any) {
        if (
          authError.code === 'auth/internal-error' &&
          authError.message &&
          authError.message.includes('RESET_PASSWORD_EXCEED_LIMIT')
        ) {
          return res.status(429).json({ error: 'You have exceeded the limit for password reset requests for this email. Please try again later.' });
        }
        throw authError; // Rethrow to be caught by the outer catch block
      }

      // 2. Setup your Brevo (SMTP) transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER, // Your Brevo Login
          pass: process.env.SMTP_PASS  // Your Brevo SMTP Master Password
        }
      });

      // 3. The "Crazy" HTML Email Template
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: #1c1917; padding: 40px; border-radius: 16px; border: 1px solid #292524; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
            .logo { width: 60px; height: 60px; margin-bottom: 24px; }
            h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #fafaf9; }
            p { font-size: 15px; color: #a8a29e; line-height: 1.6; margin-bottom: 32px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(236, 72, 153, 0.39); text-transform: uppercase; letter-spacing: 0.5px; }
            .footer { margin-top: 32px; font-size: 12px; color: #57534e; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://api.dicebear.com/9.x/shapes/svg?seed=lock" alt="Lock Icon" class="logo" />
            <h1>Reset Your Password</h1>
            <p>Hey there! We received a request to recover the password for your account. If you initiated this, you're just one step away from getting back in action.</p>
            <a href="${link}" class="btn">Reset Password Now</a>
            <p style="margin-top: 32px; font-size: 13px;">If you didn't request this, you can safely ignore this email and your password will remain untouched.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Your App Team. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;

      // 4. Send the email via Brevo
      const fromEmail = process.env.SMTP_FROM_EMAIL || '"Your App Name" <no-reply@yourdomain.com>';
      await transporter.sendMail({
        from: fromEmail, // Needs to be a verified sender in Brevo
        to: email,
        subject: '⚡ Time to Reset Your Password',
        html: htmlContent,
      });

      res.json({ success: true, message: 'Password reset email sent via Brevo!' });
    } catch (error: any) {
      console.error('Email error:', error);
      let errorMessage = error.message;
      if (errorMessage && errorMessage.includes('Unauthorized IP address')) {
        errorMessage = 'Brevo blocked the request due to IP restrictions. Please go to your Brevo account -> Security -> Authorized IPs, and disable the IP restriction, since this app runs on dynamic IPs.';
      } else if (errorMessage && errorMessage.includes('451 4.0.0 Invalid from')) {
        errorMessage = 'Invalid sender email. Please set SMTP_FROM_EMAIL in the secrets panel (Settings -> Environment) to a verified sender email address in your Brevo account (e.g., "Your Name" <youremail@yourdomain.com>).';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Vite in development mode...');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated');
  } else {
    console.log('Starting in production mode...');
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> SERVER READY <<<`);
    console.log(`URL: http://0.0.0.0:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
