//Express Server
import express from 'express';

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connectDB();
// routes(app);

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});