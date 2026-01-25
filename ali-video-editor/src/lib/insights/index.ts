/**
 * Video Copilot - Insights Module
 * Exports all insights-related services and utilities
 */

// Main service
export { InsightsService, insightsService } from "./insights-service";

// Improvement calculator
export {
  ImprovementCalculator,
  improvementCalculator,
  calculateImprovementPotential,
  calculateImprovementBreakdown,
  type ImprovementBreakdown,
  type ImprovementFactor,
  type ImprovementCalculatorInput,
} from "./improvement-calculator";

// Description generator
export { DescriptionGeneratorService, descriptionGeneratorService } from "./description-generator";
