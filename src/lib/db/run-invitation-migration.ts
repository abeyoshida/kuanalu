import { addInvitationsTable } from './migrations/add-invitations-table';

async function main() {
  try {
    await addInvitationsTable();
    console.log('Invitations table migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 