require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  const sourceUri = process.env.SOURCE_MONGODB_URI;
  const targetUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;

  if (!sourceUri || !targetUri) {
    console.error('Migration URIs not found in environment variables (SOURCE_MONGODB_URI / TARGET_MONGODB_URI)');
    process.exit(1);
  }

  try {
    console.log('Connecting to source (test)...');
    const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
    console.log('Connecting to target (medcodepro)...');
    const targetConn = await mongoose.createConnection(targetUri).asPromise();

    const collections = ['chapters', 'questions'];

    for (const collName of collections) {
      console.log(`Migrating ${collName}...`);
      const docs = await sourceConn.db.collection(collName).find({}).toArray();
      if (docs.length > 0) {
        // Remove _id from target if it exists to avoid conflicts, or just insert
        // InsertMany fails if target is not empty and ids collide
        await targetConn.db.collection(collName).deleteMany({}); // Clear target first
        await targetConn.db.collection(collName).insertMany(docs);
        console.log(`Inserted ${docs.length} documents into ${collName}`);
      } else {
        console.log(`No documents found in ${collName}`);
      }
    }

    await sourceConn.close();
    await targetConn.close();
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
