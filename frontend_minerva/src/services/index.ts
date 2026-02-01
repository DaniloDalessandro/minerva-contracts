/**
 * Services Layer
 *
 * This barrel file exports all service classes that handle business logic
 * and orchestrate API calls. Services provide a clean interface between
 * the presentation layer and the HTTP API layer.
 *
 * Usage:
 *   import { ColaboradorService, ContractService } from '@/services';
 *
 * Services follow a consistent pattern:
 * - Static methods for all operations
 * - Comprehensive logging for debugging
 * - Parameter validation and transformation
 * - Error handling and propagation
 * - Type safety with TypeScript
 */

export { ColaboradorService } from './colaborador.service';
export { ContractService } from './contrato.service';
export { BudgetService } from './budget.service';
export { BudgetLineService } from './budget-line.service';
export { AuxilioService } from './auxilio.service';
export { CenterService } from './center.service';
export { SetorService } from './setor.service';
export { AliceService } from './alice.service';
export { AuthService } from './auth.service';

/**
 * Service Layer Architecture
 *
 * The services layer is organized as follows:
 *
 * 1. Services (this layer):
 *    - Handle business logic
 *    - Build query parameters
 *    - Add logging and debugging
 *    - Transform data if needed
 *    - Call API functions
 *
 * 2. API Layer (lib/api/*):
 *    - Pure HTTP wrappers
 *    - No business logic
 *    - Simple request/response handling
 *    - Type-safe interfaces
 *
 * 3. API Client (lib/api/client.ts):
 *    - Handles authentication
 *    - Token refresh
 *    - Request headers
 *    - Low-level HTTP operations
 *
 * Benefits:
 * - Separation of concerns
 * - Easy to test
 * - Consistent error handling
 * - Centralized logging
 * - Type safety
 * - Reusable business logic
 */
