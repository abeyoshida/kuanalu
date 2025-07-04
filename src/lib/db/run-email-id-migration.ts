import { addEmailIdField } from './migrations/add-email-id-field';

/**
 * Run the email ID field migration
 */
async function runMigration() {
  try {
    console.log('Starting email ID field migration...');
    
    const success = await addEmailIdField();
    
    if (success) {
      console.log('Email ID field migration completed successfully');
    } else {
      console.error('Email ID field migration failed');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error running email ID field migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 