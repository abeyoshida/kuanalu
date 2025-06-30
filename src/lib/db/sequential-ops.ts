/**
 * Utility functions to handle sequential database operations
 * that would normally require transactions
 * 
 * This is needed because the Neon HTTP driver doesn't support transactions
 */

/**
 * Execute a series of database operations sequentially
 * If any operation fails, execute the rollback operations in reverse order
 * 
 * @param operations - Array of async functions that perform database operations
 * @param rollbackOperations - Optional array of async functions to execute if an operation fails
 * @returns The result of the last operation
 */
export async function executeSequential<T>(
  operations: Array<() => Promise<unknown>>,
  rollbackOperations?: Array<() => Promise<unknown>>
): Promise<T> {
  const results: unknown[] = [];
  
  try {
    // Execute operations in sequence
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    // Return the result of the last operation
    return results[results.length - 1] as T;
  } catch (error) {
    console.error('Sequential operation failed:', error);
    
    // Execute rollback operations in reverse order if provided
    if (rollbackOperations) {
      console.log('Executing rollback operations...');
      
      for (let i = rollbackOperations.length - 1; i >= 0; i--) {
        try {
          await rollbackOperations[i]();
        } catch (rollbackError) {
          console.error('Rollback operation failed:', rollbackError);
        }
      }
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Create a new entity and its related entities in a sequential manner
 * This is a common pattern that would normally use a transaction
 * 
 * @param createMainEntity - Function to create the main entity
 * @param createRelatedEntities - Function that takes the main entity and creates related entities
 * @returns The result of creating the main entity and related entities
 */
export async function createWithRelations<T, R>(
  createMainEntity: () => Promise<T>,
  createRelatedEntities: (mainEntity: T) => Promise<R>
): Promise<{ main: T, related: R }> {
  // Create the main entity
  const mainEntity = await createMainEntity();
  
  try {
    // Create related entities
    const relatedEntities = await createRelatedEntities(mainEntity);
    
    return {
      main: mainEntity,
      related: relatedEntities
    };
  } catch (error) {
    console.error('Failed to create related entities:', error);
    // Note: In a real transaction, we would roll back the main entity creation
    // but since we can't do that, we just log the error and re-throw
    throw error;
  }
}

/**
 * Update multiple related entities sequentially
 * 
 * @param updateOperations - Array of update operations to perform
 * @returns Array of results from each update operation
 */
export async function updateMultipleEntities<T>(
  updateOperations: Array<() => Promise<unknown>>
): Promise<T[]> {
  const results: T[] = [];
  
  for (const operation of updateOperations) {
    try {
      const result = await operation();
      results.push(result as T);
    } catch (error) {
      console.error('Update operation failed:', error);
      throw error;
    }
  }
  
  return results;
} 