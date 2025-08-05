import * as fs from 'fs-extra';
import * as path from 'path';
import { ZmanimProcessor } from './processor';
import { Location } from './types';

// For CommonJS modules, __dirname is available globally
declare const __dirname: string;

async function main() {
  try {
    // Load configuration - environment variables take precedence, then .env, then credentials.json
    let apiUser: string | undefined = process.env.MYZMANIM_USER;
    let apiKey: string | undefined = process.env.MYZMANIM_KEY;

    // If not set in environment, try loading from .env file (dotenv/config should already be loaded)
    if ((!apiUser || !apiKey) && process.env.NODE_ENV !== 'production') {
      // dotenv/config is loaded at runtime, so process.env will have .env values
      apiUser = process.env.MYZMANIM_USER;
      apiKey = process.env.MYZMANIM_KEY;
      if (apiUser && apiKey) {
        console.log('✓ Loaded credentials from .env file');
      }
    }

    // If still not set, try loading from credentials.json
    if (!apiUser || !apiKey) {
      const credentialsPath = path.join(__dirname, '..', 'config', 'credentials.json');
      if (await fs.pathExists(credentialsPath)) {
        try {
          const credentials = await fs.readJson(credentialsPath);
          apiUser = credentials.user;
          apiKey = credentials.key;
          if (apiUser && apiKey) {
            console.log('✓ Loaded credentials from config/credentials.json');
          }
        } catch (error) {
          console.warn('Warning: Could not load credentials.json');
        }
      }
    }

    if (!apiUser || !apiKey) {
      throw new Error(`Missing required API credentials. Please set MYZMANIM_USER and MYZMANIM_KEY as environment variables, in your .env file, or in config/credentials.json.`);
    }
    
    // Load locations configuration
    const configPath = path.join(__dirname, '..', 'config', 'locations.json');
    if (!await fs.pathExists(configPath)) {
      throw new Error(`Locations configuration file not found: ${configPath}`);
    }
    
    const locations: Location[] = await fs.readJson(configPath);
    
    if (locations.length === 0) {
      throw new Error('No locations configured');
    }
    
    console.log('='.repeat(50));
    console.log('Jewish Event Times Tracker');
    console.log('='.repeat(50));
    console.log(`Processing ${locations.length} location(s):`);
    locations.forEach(loc => console.log(`  - ${loc.name} (${loc.locationId})`));
    console.log('');
    
    // Initialize processor
    const processor = new ZmanimProcessor(apiUser, apiKey);
    
    // Test API connection first
    console.log('Testing API connection...');
    const connectionTest = await processor.testApiConnection();
    if (!connectionTest) {
      throw new Error('Failed to connect to MyZmanim API. Please check your credentials.');
    }
    console.log('✓ API connection successful');
    console.log('');
    
    // Process all locations for today
    const today = new Date();
    console.log(`Processing data for ${today.toDateString()}...`);
    console.log('');
    
    await processor.processAllLocations(locations, today);
    
    console.log('');
    console.log('='.repeat(50));
    console.log('Processing completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Jewish Event Times Tracker

Usage:
  npm start                   # Process today's data for all locations
  npm run dev                 # Run in development mode

Environment Variables:
  MYZMANIM_USER              # Your MyZmanim API user ID
  MYZMANIM_KEY               # Your MyZmanim API key

Configuration:
  Edit config/locations.json to configure locations

Examples:
  export MYZMANIM_USER="your_user_id"
  export MYZMANIM_KEY="your_api_key"
  npm start
`);
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
