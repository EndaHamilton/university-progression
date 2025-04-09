const API_KEY = "my-secret-key"; 

function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorised: Invalid API key" });
  }

  next(); // API key is valid
}

module.exports = checkApiKey;