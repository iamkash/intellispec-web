#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function checkPipingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI + 'test');
// Check what field the piping options actually have
    const pipingWithListType = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listType: '68ba8bdd4e8d44952203ab28' })
      .count();

    const pipingWithListTypeId = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listTypeId: '68ba8bdd4e8d44952203ab28' })
      .count();
// Sample of piping data
    const samplePiping = await mongoose.connection.db.collection('referenceListOptions')
      .find({
        $or: [
          { listType: '68ba8bdd4e8d44952203ab28' },
          { listTypeId: '68ba8bdd4e8d44952203ab28' }
        ]
      })
      .limit(2)
      .toArray();
samplePiping.forEach((opt, i) => {
if (opt.listType) console.log(`      listType: ${opt.listType}`);
      if (opt.listTypeId) console.log(`      listTypeId: ${opt.listTypeId}`);
});

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPipingData();
