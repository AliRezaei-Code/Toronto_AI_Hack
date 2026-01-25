/**
 * Mock for @faker-js/faker
 */

let counter = 0;

function generateId(): string {
  counter++;
  return `test-${counter}`;
}

const faker = {
  string: {
    uuid: () => generateId(),
  },
  lorem: {
    paragraph: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    paragraphs: (count: number) => Array(count).fill("Test paragraph").join("\n\n"),
    word: () => "test",
    sentence: () => "Test sentence with some words.",
  },
  number: {
    int: (options?: { min?: number; max?: number }) => {
      const min = options?.min ?? 0;
      const max = options?.max ?? 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    float: (options?: {
      min?: number;
      max?: number;
      fractionDigits?: number;
      precision?: number;
    }) => {
      const min = options?.min ?? 0;
      const max = options?.max ?? 1;
      const digits = options?.fractionDigits ?? options?.precision ?? 2;
      const value = Math.random() * (max - min) + min;
      return parseFloat(value.toFixed(digits));
    },
  },
  date: {
    recent: () => new Date(),
    past: () => new Date(Date.now() - 86400000),
  },
  helpers: {
    arrayElement: <T>(array: T[]) => array[Math.floor(Math.random() * array.length)],
    arrayElements: <T>(array: T[], options?: { min?: number; max?: number }) => {
      const min = options?.min ?? 1;
      const max = options?.max ?? array.length;
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      const shuffled = [...array].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    },
    shuffle: <T>(array: T[]) => [...array].sort(() => Math.random() - 0.5),
  },
};

// Export both default and named for compatibility
export default faker;
export { faker };
