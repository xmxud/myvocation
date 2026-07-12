const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running successfully.' });
});

app.listen(PORT, () => {
  console.log(`Backend is listening on http://localhost:${PORT}`);
});
