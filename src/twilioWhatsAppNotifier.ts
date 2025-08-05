import axios from 'axios';
import { ChabadPrayerTimes, Location } from './types';

export interface TwilioWhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Twilio WhatsApp number (e.g., 'whatsapp:+14155238886')
  toNumber: string;   // Group or individual number (e.g., 'whatsapp:+1234567890')
}

export class TwilioWhatsAppNotifier {
  private config: TwilioWhatsAppConfig;
  private apiUrl: string;

  constructor(config: TwilioWhatsAppConfig) {
    this.config = config;
    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  }

  /**
   * Send prayer times via Twilio WhatsApp
   */
  async sendPrayerTimes(
    location: Location,
    chabadTimes: ChabadPrayerTimes,
    hebrewDate: string
  ): Promise<boolean> {
    try {
      const message = this.formatPrayerTimesMessage(location, chabadTimes, hebrewDate);
      
      const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
      
      const response = await axios.post(
        this.apiUrl,
        new URLSearchParams({
          From: this.config.fromNumber,
          To: this.config.toNumber,
          Body: message
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('✅ Twilio WhatsApp message sent:', response.data.sid);
      return true;
    } catch (error) {
      console.error('❌ Failed to send Twilio WhatsApp message:', error);
      return false;
    }
  }

  private formatPrayerTimesMessage(
    location: Location,
    chabadTimes: ChabadPrayerTimes,
    hebrewDate: string
  ): string {
    // Calculate Shacharit time as 10 minutes before the recommended time
    const recommendedShacharitTime = chabadTimes.shacharit.recommended.time;
    const shacharitTime = this.calculateEarlierTime(recommendedShacharitTime, 10);
    
    // Calculate Mincha time as 10 minutes before the latest Mincha time
    const latestMinchaTime = chabadTimes.mincha.latest.time;
    const minchaTime = this.calculateEarlierTime(latestMinchaTime, 10);
    
    return `🕎 CHABAD PRAYER TIMES - ${location.name.toUpperCase()}
📅 ${hebrewDate}

🌅 Shacharit: ${shacharitTime}
🌇 Mincha: ${minchaTime}

Sent automatically by Zmanim Tracker 🤖`;
  }

  private calculateEarlierTime(timeString: string, minutesEarlier: number): string {
    try {
      // Parse the time (e.g., "6:56 AM")
      const parts = timeString.split(' ');
      if (parts.length !== 2) return 'N/A';
      
      const time = parts[0];
      const period = parts[1];
      
      if (!time || !period) return 'N/A';
      
      const timeParts = time.split(':');
      if (timeParts.length !== 2) return 'N/A';
      
      const hoursStr = timeParts[0];
      const minutesStr = timeParts[1];
      
      if (!hoursStr || !minutesStr) return 'N/A';
      
      const hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);
      
      if (isNaN(hours) || isNaN(minutes)) return 'N/A';
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      // Create date object and subtract specified minutes
      const originalDate = new Date();
      originalDate.setHours(hour24, minutes, 0, 0);
      const earlierDate = new Date(originalDate.getTime() - (minutesEarlier * 60 * 1000));
      
      // Format back to AM/PM
      return earlierDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error calculating earlier time:', error);
      return 'N/A';
    }
  }
}

export function createTwilioNotifier(): TwilioWhatsAppNotifier | null {
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_WHATSAPP_FROM || '',
    toNumber: process.env.TWILIO_WHATSAPP_TO || ''
  };

  if (!config.accountSid || !config.authToken || !config.fromNumber || !config.toNumber) {
    console.warn('⚠️ Twilio configuration incomplete. Skipping Twilio WhatsApp notifications.');
    return null;
  }

  return new TwilioWhatsAppNotifier(config);
}
