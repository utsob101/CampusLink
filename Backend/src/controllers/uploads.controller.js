import path from 'path';
import { fileURLToPath } from 'url';

export function uploadedFile(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
}
