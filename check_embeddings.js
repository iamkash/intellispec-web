require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkEmbeddings() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
const executions = await db.collection('executions').find({}).limit(3).toArray();

  if (executions.length === 0) {
await client.close();
    return;
  }

  executions.forEach((exec, i) => {
});

  // Check vector service discovery
const vectorService = require('./services/vectorUpdateService');

  await client.close();
}

checkEmbeddings().catch(console.error);
