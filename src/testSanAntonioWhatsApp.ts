import 'dotenv/config'; // Load environment variables from .env file
import { createTwilioNotifier } from './twilioWhatsAppNotifier';
import { MyZmanimApi } from './api';
import { ChabadPrayerCalculator } from './chabadCalculator';
import * as fs from 'fs-extra';
import * as path from 'path';

async function testSanAntonioWhatsApp() {
  console.log('🧪 Testing WhatsApp with Real San Antonio Prayer Times...\n');

  // Test Twilio WhatsApp with San Antonio data
  const twilioNotifier = createTwilioNotifier();
  if (!twilioNotifier) {
    console.log('❌ Twilio WhatsApp not configured');
    return;
  }

  try {
    console.log('📍 Fetching San Antonio prayer times...');
    
    // Load credentials
    const credentialsPath = path.join(__dirname, '..', 'config', 'credentials.json');
    const credentials = await fs.readJson(credentialsPath);
    
    // San Antonio location data (from config/locations.json)
    const location = {
      name: 'San Antonio',
      locationId: 'US78201',
      timezone: 'America/Chicago'
    };

    // Initialize API and fetch data
    const api = new MyZmanimApi(credentials.user, credentials.key);
    const apiResponse = await api.getDay(location.locationId);
    
    console.log('✅ API data fetched successfully');

    // Calculate Chabad prayer times
    const chabadTimes = ChabadPrayerCalculator.calculateChabadTimes(apiResponse);
    
    console.log('✅ Chabad times calculated');

    // Get Hebrew date
    const hebrewDate = apiResponse.Time?.DateJewishLong || 'Hebrew Date';

    // Print times to console first
    console.log('\n📿 Prayer times to be sent:');
    ChabadPrayerCalculator.printChabadTimes(location.name, chabadTimes, hebrewDate);

    // Send via WhatsApp
    console.log('\n📱 Sending WhatsApp message...');
    const success = await twilioNotifier.sendPrayerTimes(location, chabadTimes, hebrewDate);
    
    if (success) {
      console.log('✅ San Antonio prayer times sent successfully via WhatsApp!');
      console.log(`📱 Check your WhatsApp for the message`);
    } else {
      console.log('❌ Failed to send WhatsApp message');
    }

  } catch (error) {
    console.error('❌ Error testing San Antonio WhatsApp:', error);
  }

  console.log('\n🏁 San Antonio WhatsApp test completed!');
}

// Run the test
testSanAntonioWhatsApp().catch(console.error);
