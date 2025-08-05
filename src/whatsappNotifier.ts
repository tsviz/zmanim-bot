import axios from 'axios';
import { ChabadPrayerTimes, Location } from './types';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  groupId: string;
  businessAccountId: string;
}

export class WhatsAppNotifier {
  private config: WhatsAppConfig;
  private apiUrl: string;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.apiUrl = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
  }

  /**
   * Send Chabad prayer times to WhatsApp group
   */
  async sendPrayerTimes(
    location: Location,
    chabadTimes: ChabadPrayerTimes,
    hebrewDate: string
  ): Promise<boolean> {
    try {
      const message = this.formatPrayerTimesMessage(location, chabadTimes, hebrewDate);
      
      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: this.config.groupId,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WhatsApp message sent successfully:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send daily summary to multiple groups
   */
  async sendDailySummary(
    locations: Location[],
    allPrayerTimes: Map<string, ChabadPrayerTimes>,
    date: string
  ): Promise<void> {
    try {
      const summaryMessage = this.formatDailySummary(locations, allPrayerTimes, date);
      
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: this.config.groupId,
          type: 'text',
          text: {
            body: summaryMessage
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Daily summary sent to WhatsApp');
    } catch (error) {
      console.error('❌ Failed to send daily summary:', error);
    }
  }

  /**
   * Format prayer times for WhatsApp message
   */
  private formatPrayerTimesMessage(
    location: Location,
    chabadTimes: ChabadPrayerTimes,
    hebrewDate: string
  ): string {
    return `🕎 *CHABAD PRAYER TIMES - ${location.name.toUpperCase()}*
📅 ${hebrewDate}

🌅 *Shacharit (Morning)*
   • Earliest: ${chabadTimes.shacharit.earliest.time}
   • Recommended: ${chabadTimes.shacharit.recommended.time}
   • Latest: ${chabadTimes.shacharit.latest.time}

☀️ *Mincha (Afternoon)*
   • Earliest: ${chabadTimes.mincha.earliest.time}
   • Recommended: ${chabadTimes.mincha.recommended.time}
   • Latest: ${chabadTimes.mincha.latest.time}

🌙 *Maariv (Evening)*
   • Earliest: ${chabadTimes.maariv.earliest.time}
   • Recommended: ${chabadTimes.maariv.recommended.time}

📖 *Shema Times*
   • Morning: ${chabadTimes.shema.morning.time}
   • Night: ${chabadTimes.shema.night.time}

_Sent automatically by Zmanim Tracker_ 🤖`;
  }

  /**
   * Format daily summary for multiple locations
   */
  private formatDailySummary(
    locations: Location[],
    allPrayerTimes: Map<string, ChabadPrayerTimes>,
    date: string
  ): string {
    let message = `🕎 *DAILY CHABAD PRAYER TIMES*\n📅 ${date}\n\n`;

    locations.forEach(location => {
      const times = allPrayerTimes.get(location.name);
      if (times) {
        message += `*${location.name}*\n`;
        message += `🌅 Shacharit: ${times.shacharit.recommended.time}\n`;
        message += `☀️ Mincha: ${times.mincha.recommended.time}\n`;
        message += `🌙 Maariv: ${times.maariv.recommended.time}\n`;
        message += `📖 Shema: ${times.shema.morning.time}\n\n`;
      }
    });

    message += '_Sent automatically by Zmanim Tracker_ 🤖';
    return message;
  }

  /**
   * Send urgent notifications (e.g., Shabbat times)
   */
  async sendUrgentNotification(message: string): Promise<boolean> {
    try {
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: this.config.groupId,
          type: 'text',
          text: {
            body: `🚨 *URGENT NOTIFICATION* 🚨\n\n${message}`
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('❌ Failed to send urgent notification:', error);
      return false;
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: this.config.groupId,
          type: 'text',
          text: {
            body: '🧪 Test message from Zmanim Tracker - Connection successful! ✅'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WhatsApp connection test successful');
      return true;
    } catch (error) {
      console.error('❌ WhatsApp connection test failed:', error);
      return false;
    }
  }
}

/**
 * Helper function to create WhatsApp notifier from environment variables
 */
export function createWhatsAppNotifier(): WhatsAppNotifier | null {
  const config = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    groupId: process.env.WHATSAPP_GROUP_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
  };

  if (!config.accessToken || !config.phoneNumberId || !config.groupId) {
    console.warn('⚠️ WhatsApp configuration incomplete. Skipping WhatsApp notifications.');
    return null;
  }

  return new WhatsAppNotifier(config);
}
