#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import { ZmanimProcessor } from './processor';
import { Location } from './types';

declare const __dirname: string;

async function showPrayerTimes() {
  try {
    // Load credentials
    let apiUser: string | undefined;
    let apiKey: string | undefined;
    
    const credentialsPath = path.join(__dirname, '..', 'config', 'credentials.json');
    if (await fs.pathExists(credentialsPath)) {
      const credentials = await fs.readJson(credentialsPath);
      apiUser = credentials.user;
      apiKey = credentials.key;
    }
    
    if (!apiUser || !apiKey) {
      throw new Error('Missing API credentials');
    }
    
    // Load locations
    const configPath = path.join(__dirname, '..', 'config', 'locations.json');
    const locations: Location[] = await fs.readJson(configPath);
    
    console.log('🕰️  CHABAD PRAYER TIMES FOR TODAY');
    console.log('='.repeat(70));
    
    const processor = new ZmanimProcessor(apiUser, apiKey);
    
    // Process each location but don't save, just display
    for (const location of locations) {
      try {
        const targetDate = new Date();
        const apiResponse = await processor['api'].getDay(location.locationId, targetDate);
        
        // Just print the prayer times without saving
        const chabadTimes = require('./chabadCalculator').ChabadPrayerCalculator.calculateChabadTimes(apiResponse);
        require('./chabadCalculator').ChabadPrayerCalculator.printChabadTimes(
          location.name,
          chabadTimes,
          apiResponse.Time.DateJewishLong || ''
        );
        
      } catch (error) {
        console.error(`❌ Failed to get times for ${location.name}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  showPrayerTimes();
}
