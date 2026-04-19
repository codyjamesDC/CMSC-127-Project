//Express Server
import express from 'express';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
// import routes from './routes/router.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connectDB();
// routes(app);

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
})