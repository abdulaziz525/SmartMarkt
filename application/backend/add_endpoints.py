import re

with open("src/routes/auth.routes.ts", "r") as f:
    code = f.read()

# Add email verification endpoints
verification_code = """
const verificationCodes = new Map<string, string>();

router.post('/auth/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    verificationCodes.set(email, code);
    
    // Log it instead of sending real email
    console.log(`[Email Verification] Sent code ${code} to ${email}`);
    
    res.json({ message: 'Verification code sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
    
    const savedCode = verificationCodes.get(email);
    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Clear code after successful verification
    verificationCodes.delete(email);
    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import axios from 'axios';

router.post('/auth/wathq-verify', async (req, res) => {
  try {
    const { crNumber } = req.body;
    if (!crNumber) return res.status(400).json({ error: 'CR Number / Tax Number is required' });
    
    // Typically the apiKey would come from env vars
    const apiKey = process.env.WATHQ_API_KEY || 'sandbox_key';
    
    try {
      const response = await axios.get(`https://api.wathq.sa/sandbox/commercial-registration/info/${crNumber}`, {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json'
        }
      });
      
      // If found, return the data
      res.json({ valid: true, data: response.data });
    } catch (apiError: any) {
      // If it's a 401 or 403 (unauthorized/forbidden) due to missing real API key, we mock success for development purposes
      if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
        console.warn('Wathq API Key is invalid or missing, mocking success response for CR:', crNumber);
        return res.json({
          valid: true,
          data: {
            crNumber: crNumber,
            name: "مؤسسة تجريبية (Mock)",
            status: { id: 1, name: "فعال" }
          },
          mocked: true
        });
      }
      
      if (apiError.response && apiError.response.status === 404) {
        return res.status(400).json({ error: 'Invalid CR Number / Tax Number: Not found in Wathq' });
      }
      
      throw apiError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
"""

if 'send-verification-code' not in code:
    # Insert before router.post('/auth/signup'
    code = code.replace("router.post('/auth/signup'", verification_code + "\nrouter.post('/auth/signup'")

with open("src/routes/auth.routes.ts", "w") as f:
    f.write(code)

print("Added backend endpoints")
