// const { MongoClient } = require('mongodb');

// const MONGO_URI = 'mongodb+srv://parasharone6:Heroalom55@cluster2.wm00t49.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2';
// const DB_NAME = 'chatbot_db';
// const COLLECTION_NAME = 'user_queries';

// // 'https://script.google.com/macros/s/AKfycbxrFWog-4b1WzgUp3A9VECeiVUY3Z_9ZiMGU2qoodm6fRHe0Bv7k-mJ0y0e53pAzeRrRA/exec';


// const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwoAm1w_gTHBJRRiF5DW845mHefObvjMiFZHIwtsMm1mcVnL86tL5TIxvK4tvFwkEFOfQ/exec';
// async function main() {
//     // 1) Connect to MongoDB
//     const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//     await client.connect();
//     console.log('✅ Connected to MongoDB');

//     const col = client.db(DB_NAME).collection(COLLECTION_NAME);

//     // 2) Watch for insert events
//     const changeStream = col.watch([
//         { $match: { operationType: 'insert' } }
//     ]);
//     console.log(`🔍 Watching for inserts on ${DB_NAME}.${COLLECTION_NAME}`);

//     changeStream.on('change', async change => {
//         const id = change.documentKey && change.documentKey._id;
//         if (!id) {
//             return console.warn('⚠️ No _id in change.documentKey, skipping');
//         }

//         // 3) Re-fetch the complete document from MongoDB
//         let doc;
//         try {
//             doc = await col.findOne({ _id: id });
//         } catch (err) {
//             console.error('❌ Error fetching full document:', err);
//             return;
//         }
//         if (!doc) {
//             return console.warn(`⚠️ Document with _id=${id} not found`);
//         }

//         // 4) Debug: confirm we have the fields
//         console.log('⚙️  Fetched document:', JSON.stringify(doc, null, 2));

//         // 5) Destructure your fields
//         const {
//             _id = '',
//             email = '',
//             services = [],
//             state = '',
//             sheet_status = '',
//             name = ''
//         } = doc;

//         const payload = { _id, email, services, state, sheet_status, name };

//         // 6) POST to Apps Script webhook
//         try {
//             const res = await fetch(WEBHOOK_URL, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });
//             const text = await res.text();
//             console.log(`📤 Webhook response: ${res.status} ${text}`);
//         } catch (err) {
//             console.error('❌ Error posting to webhook:', err);
//         }
//     });
// }

// main().catch(err => {
//     console.error('Fatal error:', err);
//     process.exit(1);
// });


// index.js
// Watches MongoDB inserts, re-reads each doc, and POSTS to your Apps Script webhook.




// const axios         = require('axios');
// const { MongoClient } = require('mongodb');

// const MONGO_URI       = 'mongodb+srv://parasharone6:Heroalom55@cluster2.wm00t49.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2';
// const DB_NAME         = 'chatbot_db';
// const COLLECTION_NAME = 'user_queries';

// // ← your new Web App URL (no trailing slash or dot)
// const WEBHOOK_URL     = 'https://script.google.com/macros/s/AKfycbzyO2GiUm9DVsRw1aWxZFx8f7T1dWO7XURn_PjgWvMa6jftMLRl-I9Woh-UXZGldbNCVQ/exec';

// async function main() {
//   const client = new MongoClient(MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
//   await client.connect();
//   console.log('✅ Connected to MongoDB');

//   const col = client.db(DB_NAME).collection(COLLECTION_NAME);
//   const stream = col.watch([{ $match: { operationType: 'insert' } }]);
//   console.log(`🔍 Watching inserts on ${DB_NAME}.${COLLECTION_NAME}`);

//   stream.on('change', async change => {
//     const id = change.documentKey && change.documentKey._id;
//     if (!id) return console.warn('⚠️ No _id in change, skipping');

//     // Re‐read to guarantee full fields
//     const doc = await col.findOne({ _id: id });
//     if (!doc) return console.warn(`⚠️ Doc not found for _id=${id}`);

//     console.log('⚙️  Fetched document:', JSON.stringify(doc, null,2));

//     const payload = {
//       _id:          doc._id,
//       email:        doc.email,
//       services:     doc.services   || [],
//       state:        doc.state      || '',
//       sheet_status: doc.sheet_status|| '',
//       name:         doc.name       || ''
//     };

//     try {
//       const resp = await axios.post(WEBHOOK_URL, payload, {
//         headers: { 'Content-Type': 'application/json' }
//       });
//       console.log(`📤 Webhook response: ${resp.status} ${JSON.stringify(resp.data)}`);
//     } catch (err) {
//       console.error('❌ Error posting to webhook:', err.toString());
//     }
//   });
// }

// main().catch(err => {
//   console.error('Fatal error:', err);
//   process.exit(1);
// });


/*
  A refactored MongoDB change-stream watcher
  - Uses environment variables for configuration
  - Modular error handling and graceful shutdown
  - Optional custom logger
*/

require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');

// Load configuration from environment variables or provide sensible defaults
const config = {
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME || 'chatbot_db',
  collectionName: process.env.COLLECTION_NAME || 'user_queries',
  webhookUrl: process.env.WEBHOOK_URL,
  watchPipeline: [{ $match: { operationType: 'insert' } }]
};

if (!config.mongoUri || !config.webhookUrl) {
  console.error('⚠️  Missing required environment variables: MONGO_URI and WEBHOOK_URL');
  process.exit(1);
}

// Optional: simple logger wrapper
const log = {
  info: (...args) => console.log('ℹ️', ...args),
  warn: (...args) => console.warn('⚠️', ...args),
  error: (...args) => console.error('❌', ...args),
};

async function handleChange(change, collection) {
  try {
    const id = change.documentKey?._id;
    if (!id) return log.warn('No _id in change, skipping');

    // Fetch full document
    const doc = await collection.findOne({ _id: id });
    if (!doc) return log.warn(`Doc not found for _id=${id}`);

    log.info('Fetched document:', JSON.stringify(doc));

    const payload = {
      _id: doc._id,
      email: doc.email,
      services: doc.services || [],
      state: doc.state || '',
      sheet_status: doc.sheet_status || '',
      name: doc.name || ''
    };

    const response = await axios.post(config.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    log.info(`Webhook responded with ${response.status}`, response.data);
  } catch (err) {
    log.error('Error in change handler:', err);
  }
}

async function main() {
  const client = new MongoClient(config.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    log.info('Connected to MongoDB');

    const collection = client.db(config.dbName).collection(config.collectionName);
    const changeStream = collection.watch(config.watchPipeline);
    log.info(`Watching inserts on ${config.dbName}.${config.collectionName}`);

    changeStream.on('change', change => handleChange(change, collection));

    // Graceful shutdown
    process.on('SIGINT', async () => {
      log.info('Shutting down...');
      await changeStream.close();
      await client.close();
      log.info('Closed MongoDB connection and change stream');
      process.exit(0);
    });

  } catch (err) {
    log.error('Fatal error in main:', err);
    process.exit(1);
  }
}

main();