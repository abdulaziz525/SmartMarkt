import re

with open("src/routes/auth.routes.ts", "r") as f:
    code = f.read()

# Replace axios with fetch
code = code.replace("import axios from 'axios';", "")
code = code.replace("""      const response = await axios.get(`https://api.wathq.sa/sandbox/commercial-registration/info/${crNumber}`, {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json'
        }
      });
      
      // If found, return the data
      res.json({ valid: true, data: response.data });""", """      const response = await fetch(`https://api.wathq.sa/sandbox/commercial-registration/info/${crNumber}`, {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err: any = new Error(response.statusText);
        err.response = { status: response.status, data: errorData };
        throw err;
      }
      
      const data = await response.json();
      res.json({ valid: true, data: data });""")

with open("src/routes/auth.routes.ts", "w") as f:
    f.write(code)

print("Updated backend to use fetch")
