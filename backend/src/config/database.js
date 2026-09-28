import mongoose from 'mongoose';

// Values coming from requests can never be interpreted as query operators.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDatabase(uri) {
  await mongoose.connect(uri);
  console.info('Connected to MongoDB.');
}
