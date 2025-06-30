import { addUserNameFields } from './migrations/add-user-name-fields';

async function runMigration() {
  try {
    await addUserNameFields();
    console.log('User name fields migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 