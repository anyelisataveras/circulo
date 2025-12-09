import { appRouter } from './server/routers.js';

// Create a mock context
const mockContext = {
  user: { id: 1, name: 'Test User', role: 'admin' },
  req: {},
  res: {}
};

// Create caller
const caller = appRouter.createCaller(mockContext);

// Test generate with document IDs
console.log('Testing impact report generation with documents...');

try {
  const result = await caller.impactReports.generate({
    title: 'Test Report',
    period: '2024',
    focus: 'Testing document analysis',
    documentIds: [1, 2] // Use first two documents
  });
  
  console.log('\n✅ SUCCESS! Report generated:');
  console.log('Content length:', result.content.length);
  console.log('\nFirst 500 characters:');
  console.log(result.content.substring(0, 500));
  console.log('\n...\n');
  console.log('Last 500 characters:');
  console.log(result.content.substring(result.content.length - 500));
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
}
