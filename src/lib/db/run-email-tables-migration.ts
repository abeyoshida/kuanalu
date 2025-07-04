import { createEmailTables } from './migrations/add-email-queue-table';

async function main() {
  try {
    console.log('Running email tables migration...');
    await createEmailTables();
    console.log('Email tables migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running email tables migration:', error);
    process.exit(1);
  }
}

main(); 