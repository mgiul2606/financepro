// frontend/scripts/generate-api-types.ts

// Import corretto per child_process
import { execSync } from 'child_process';

const environment = process.argv[2] || 'development';
const API_VERSION = 'v1';
const LOCAL_BASE_URL = 'http://localhost:8000';
const PROD_BASE_URL = 'https://api.financepro.app';

const baseUrl = environment === 'prod' ? PROD_BASE_URL : LOCAL_BASE_URL;
const openApiUrl = `${baseUrl}/api/${API_VERSION}/openapi.json`;
const outputPath = 'src/types/generated/api.ts';

console.log(`🔄 Generating API types...`);
console.log(`   Environment: ${environment}`);
console.log(`   Source: ${openApiUrl}`);
console.log(`   Output: ${outputPath}`);

try {
  execSync(
    `openapi-typescript ${openApiUrl} -o ${outputPath} --path-params-as-types`,
    { stdio: 'inherit' }
  );
  console.log('API types generated successfully!');
  process.exit(0); 
} catch (error) {
  console.error('Failed to generate API types:', error);
  process.exit(1);
}