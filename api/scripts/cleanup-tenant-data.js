require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const DatabaseManager = require('../core/DatabaseManager');
const { logger } = require('../core/Logger');

const TENANT_ID = 't_hf_sinclair';
const DOCUMENT_TYPES_TO_DELETE = ['company', 'site', 'asset_group', 'asset'];

async function cleanupTenantData() {
  const dbManager = DatabaseManager.getInstance();
  try {
    await dbManager.connect();
    logger.info('Database connected successfully.');

    const db = dbManager.getDatabase();
    const documentsCollection = db.collection('documents');

    logger.info(`Starting cleanup for tenant: ${TENANT_ID}`);
    logger.info(`Document types to be deleted: ${DOCUMENT_TYPES_TO_DELETE.join(', ')}`);

    const query = {
      tenantId: TENANT_ID,
      type: { $in: DOCUMENT_TYPES_TO_DELETE },
    };

    const countResult = await documentsCollection.countDocuments(query);

    if (countResult === 0) {
      logger.info('No matching documents found for the specified tenant and types. No action taken.');
      return;
    }

    logger.warn(`Found ${countResult} documents to delete. This operation is irreversible.`);
    logger.info('Proceeding with deletion in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const deleteResult = await documentsCollection.deleteMany(query);

    logger.info('Deletion complete.');
    logger.info(`Successfully deleted ${deleteResult.deletedCount} documents.`);

  } catch (error) {
    logger.error('An error occurred during the cleanup process:', {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    await dbManager.disconnect();
    logger.info('Database connection closed.');
  }
}

cleanupTenantData();
