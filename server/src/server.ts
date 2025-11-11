import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import healthRouter from './routes/health';
import connectDB from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'specgen-server' });
});

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        // connect to MongoDB (if MONGODB_URI provided)
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
            await connectDB(mongoUri);
            // eslint-disable-next-line no-console
            console.log('Connected to MongoDB');
        } else {
            // eslint-disable-next-line no-console
            console.log('No MONGODB_URI provided; skipping MongoDB connection');
        }

        app.listen(PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();
