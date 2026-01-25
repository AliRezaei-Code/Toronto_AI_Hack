/**
 * Mock for uuid package
 */

function v4(): string {
  return "mock-uuid-" + Math.random().toString(36).substring(2, 15);
}

const mockUuid = {
  v4,
};

export default mockUuid;
