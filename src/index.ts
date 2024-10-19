import express, { Request, Response } from 'express';
import { openDb } from './database';
import fetch from 'node-fetch';
import logger from './logger';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Physical Store API');
});

app.post('/stores', async (req: Request, res: Response) => {
  const { name, street, number, neighborhood, city, state, cep, latitude, longitude } = req.body;
  const db = await openDb();
  await db.run(
    'INSERT INTO stores (name, street, number, neighborhood, city, state, cep, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, street, number, neighborhood, city, state, cep, latitude, longitude]
  );
  logger.info('Store added', { name, street, number, neighborhood, city, state, cep, latitude, longitude });
  res.status(201).send({ message: 'Store added successfully' });
});

app.get('/stores/:cep', async (req: Request, res: Response) => {
  const { cep } = req.params;
  const db = await openDb();

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data: any = await response.json();
  if (data.erro) {
    logger.error('CEP not found', { cep });
    return res.status(404).send({ message: 'CEP not found' });
  }

  const { logradouro, bairro, localidade, uf } = data;
  const address = `${logradouro}, ${bairro}, ${localidade}, ${uf}`;
  const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const geoData: any = await geoResponse.json();
  if (geoData.length === 0) {
    logger.error('Geolocation not found for the provided CEP', { cep, address });
    return res.status(404).send({ message: 'Geolocation not found for the provided CEP' });
  }

  const { lat, lon } = geoData[0];

  const stores = await db.all('SELECT * FROM stores');
  const storesWithDistance = stores.map((store: any) => {
    const distance = calculateDistance(parseFloat(lat), parseFloat(lon), store.latitude, store.longitude);
    return { ...store, distance };
  });

  const nearbyStores = storesWithDistance.filter((store: any) => store.distance <= 100).sort((a: any, b: any) => a.distance - b.distance);

  if (nearbyStores.length === 0) {
    logger.info('No stores found within 100km', { cep });
    return res.status(404).send({ message: 'No stores found within 100km' });
  }

  logger.info('Stores found', { cep, nearbyStores });
  res.send(nearbyStores);
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port}`);
});