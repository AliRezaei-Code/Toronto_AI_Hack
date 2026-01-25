/**
 * Mock for SEO Prompt Builder
 */

// Types matching the real SEO prompt builder
export interface TitleLengthConstraints {
  minimum: number;
  maximum: number;
  optimal: {
    min: number;
    max: number;
  };
}

export interface DescriptionLengthConstraints {
  minimum: number;
  maximum: number;
  aboveFold: number;
}

export interface ISEOPromptBuilder {
  buildTitlePrompt(args: any): Promise<string>;
  buildDescriptionPrompt(args: any): Promise<string>;
  getTitleLengthConstraints(): Promise<TitleLengthConstraints>;
  getDescriptionLengthConstraints(): Promise<DescriptionLengthConstraints>;
}

/**
 * Mock SEO Prompt Builder class
 */
export class MockSEOPromptBuilder implements ISEOPromptBuilder {
  private titlePrompt = "Mock title prompt";
  private descriptionPrompt = "Mock description prompt";
  private titleConstraints: TitleLengthConstraints = {
    minimum: 10,
    maximum: 70,
    optimal: { min: 50, max: 60 },
  };
  private descriptionConstraints: DescriptionLengthConstraints = {
    minimum: 50,
    maximum: 500,
    aboveFold: 150,
  };

  async buildTitlePrompt(_args: any): Promise<string> {
    return this.titlePrompt;
  }

  async buildDescriptionPrompt(_args: any): Promise<string> {
    return this.descriptionPrompt;
  }

  async getTitleLengthConstraints(): Promise<TitleLengthConstraints> {
    return this.titleConstraints;
  }

  async getDescriptionLengthConstraints(): Promise<DescriptionLengthConstraints> {
    return this.descriptionConstraints;
  }

  // Configuration methods
  setTitlePrompt(prompt: string): void {
    this.titlePrompt = prompt;
  }

  setDescriptionPrompt(prompt: string): void {
    this.descriptionPrompt = prompt;
  }

  setTitleConstraints(constraints: Partial<TitleLengthConstraints>): void {
    this.titleConstraints = { ...this.titleConstraints, ...constraints };
  }

  setDescriptionConstraints(constraints: Partial<DescriptionLengthConstraints>): void {
    this.descriptionConstraints = { ...this.descriptionConstraints, ...constraints };
  }

  reset(): void {
    this.titlePrompt = "Mock title prompt";
    this.descriptionPrompt = "Mock description prompt";
    this.titleConstraints = {
      minimum: 10,
      maximum: 70,
      optimal: { min: 50, max: 60 },
    };
    this.descriptionConstraints = {
      minimum: 50,
      maximum: 500,
      aboveFold: 150,
    };
  }
}

// Create singleton instance
export const mockSEOPromptBuilder = new MockSEOPromptBuilder();

// Factory function
export function createMockSEOPromptBuilder(): MockSEOPromptBuilder {
  return new MockSEOPromptBuilder();
}
