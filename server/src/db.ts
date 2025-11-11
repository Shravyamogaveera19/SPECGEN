import mongoose from 'mongoose';

async function connectDB(uri: string) {
  // use mongoose to connect
  await mongoose.connect(uri, {
    // options are handled by mongoose defaults in v7+
  } as any);
  return mongoose.connection;
}

export default connectDB;
