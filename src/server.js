import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));      // serve /public

// Prefere usar caminho absoluto para SSR / SPA fallback, se precisar
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.use('/api', routes);

// Rota SPA opcional
app.get('/text', (_, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
);

const PORT = process.env.PORT || 4000;


app.listen(PORT, () => console.log(` Servidor na porta ${PORT}`));

