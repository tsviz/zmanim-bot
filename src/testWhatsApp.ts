import 'dotenv/config'; // Load environment variables from .env file
import { createWhatsAppNotifier } from './whatsappNotifier';
import { createTwilioNotifier } from './twilioWhatsAppNotifier';

async function testWhatsAppConnections() {
  console.log('🧪 Testing WhatsApp Connections...\n');

  // Test WhatsApp Business API
  const whatsAppNotifier = createWhatsAppNotifier();
  if (whatsAppNotifier) {
    console.log('📱 Testing WhatsApp Business API...');
    const success = await whatsAppNotifier.testConnection();
    console.log(`Result: ${success ? '✅ Success' : '❌ Failed'}\n`);
  } else {
    console.log('⚠️ WhatsApp Business API not configured\n');
  }

  // Test Twilio WhatsApp
  const twilioNotifier = createTwilioNotifier();
  if (twilioNotifier) {
    console.log('📱 Testing Twilio WhatsApp...');
    // Send a simple test message
    const testMessage = {
      name: 'Test Location',
      locationId: 'TEST',
      timezone: 'UTC'
    };
    const testTimes = {
      shacharit: {
        earliest: { time: '06:00', description: 'Test' },
        recommended: { time: '07:00', description: 'Test' },
        latest: { time: '10:00', description: 'Test' }
      },
      mincha: {
        earliest: { time: '13:00', description: 'Test' },
        recommended: { time: '17:00', description: 'Test' },
        latest: { time: '20:00', description: 'Test' }
      },
      maariv: {
        earliest: { time: '19:00', description: 'Test' },
        recommended: { time: '21:00', description: 'Test' }
      },
      shema: {
        morning: { time: '09:00', description: 'Test' },
        night: { time: '01:00', description: 'Test' }
      }
    };
    
    const success = await twilioNotifier.sendPrayerTimes(testMessage, testTimes, 'Test Date');
    console.log(`Result: ${success ? '✅ Success' : '❌ Failed'}\n`);
  } else {
    console.log('⚠️ Twilio WhatsApp not configured\n');
  }

  console.log('🏁 Test completed!');
}

// Run the test
testWhatsAppConnections().catch(console.error);
