import 'dotenv/config'; // Load environment variables from .env file
import { MyZmanimApi } from './api';
import { DataManager } from './dataManager';
import { ZmanimData, ApiResponse, Location } from './types';
import { ChabadPrayerCalculator } from './chabadCalculator';
import { createWhatsAppNotifier } from './whatsappNotifier';
import { createTwilioNotifier } from './twilioWhatsAppNotifier';
import moment from 'moment-timezone';

export class ZmanimProcessor {
  private api: MyZmanimApi;
  private dataManager: DataManager;
  private whatsappNotifier: any;
  private twilioNotifier: any;

  constructor(apiUser: string, apiKey: string, dataDir?: string) {
    this.api = new MyZmanimApi(apiUser, apiKey);
    this.dataManager = new DataManager(dataDir);
    
    // Initialize WhatsApp notifiers
    this.whatsappNotifier = createWhatsAppNotifier();
    this.twilioNotifier = createTwilioNotifier();
    
    if (this.whatsappNotifier) {
      console.log('✅ WhatsApp Business API notifier initialized');
    }
    if (this.twilioNotifier) {
      console.log('✅ Twilio WhatsApp notifier initialized');
    }
  }

  /**
   * Process and save Zmanim data for all configured locations
   */
  async processAllLocations(locations: Location[], date?: Date): Promise<void> {
    console.log(`Processing Zmanim for ${locations.length} locations...`);
    
    // Initialize data structure
    await this.dataManager.initializeDataStructure();
    
    const allPrayerTimes = new Map<string, any>();
    const processedDate = date || new Date();
    
    // Process each location
    for (const location of locations) {
      try {
        console.log(`Fetching data for ${location.name}...`);
        const zmanimData = await this.fetchAndProcessLocation(location, date);
        await this.dataManager.saveDailyData(zmanimData);
        
        // Store prayer times for WhatsApp summary
        allPrayerTimes.set(location.name, zmanimData.chabadPrayerTimes);
        
        console.log(`✓ Saved data for ${location.name}`);
        
        // Send individual WhatsApp notification if enabled
        await this.sendLocationWhatsAppNotification(location, zmanimData);
        
      } catch (error) {
        console.error(`✗ Failed to process ${location.name}:`, error);
      }
    }
    
    // Send daily summary to WhatsApp
    await this.sendDailySummaryWhatsApp(locations, allPrayerTimes, processedDate);
    
    console.log('Processing complete!');
  }

  /**
   * Send WhatsApp notification for a single location
   */
  private async sendLocationWhatsAppNotification(location: Location, zmanimData: ZmanimData): Promise<void> {
    try {
      if (this.whatsappNotifier) {
        await this.whatsappNotifier.sendPrayerTimes(
          location,
          zmanimData.chabadPrayerTimes,
          zmanimData.hebrewDate.formatted
        );
        console.log(`📱 WhatsApp notification sent for ${location.name}`);
      }

      if (this.twilioNotifier) {
        await this.twilioNotifier.sendPrayerTimes(
          location,
          zmanimData.chabadPrayerTimes,
          zmanimData.hebrewDate.formatted
        );
        console.log(`📱 Twilio WhatsApp notification sent for ${location.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send WhatsApp notification for ${location.name}:`, error);
    }
  }

  /**
   * Send daily summary to WhatsApp
   */
  private async sendDailySummaryWhatsApp(
    locations: Location[],
    allPrayerTimes: Map<string, any>,
    date: Date
  ): Promise<void> {
    try {
      const dateStr = moment(date).format('YYYY-MM-DD');
      
      if (this.whatsappNotifier) {
        await this.whatsappNotifier.sendDailySummary(locations, allPrayerTimes, dateStr);
        console.log('📱 Daily WhatsApp summary sent');
      }
    } catch (error) {
      console.error('❌ Failed to send daily WhatsApp summary:', error);
    }
  }

  /**
   * Test WhatsApp connectivity
   */
  async testWhatsAppConnection(): Promise<void> {
    console.log('🧪 Testing WhatsApp connections...');
    
    if (this.whatsappNotifier) {
      const success = await this.whatsappNotifier.testConnection();
      console.log(`WhatsApp Business API: ${success ? '✅ Connected' : '❌ Failed'}`);
    }

    if (this.twilioNotifier) {
      // Twilio doesn't have a specific test method, but we can try sending a test message
      console.log('Twilio WhatsApp: ⚠️ Test by sending actual message');
    }
  }

  /**
   * Process a single location
   */
  async processSingleLocation(location: Location, date?: Date): Promise<ZmanimData> {
    await this.dataManager.initializeDataStructure();
    const zmanimData = await this.fetchAndProcessLocation(location, date);
    await this.dataManager.saveDailyData(zmanimData);
    return zmanimData;
  }

  /**
   * Fetch and process data for a single location
   */
  private async fetchAndProcessLocation(location: Location, date?: Date): Promise<ZmanimData> {
    const targetDate = date || new Date();
    const apiResponse = await this.api.getDay(location.locationId, targetDate);
    
    return this.transformApiResponse(apiResponse, location, targetDate);
  }

  /**
   * Transform API response to our ZmanimData format
   */
  private transformApiResponse(apiResponse: ApiResponse, location: Location, date: Date): ZmanimData {
    const dateMoment = moment.tz(date, location.timezone);
    
    // Parse Hebrew date from the API response with null safety
    let hebrewDay = 1;
    let hebrewMonth = '';
    let hebrewYear = 5784;
    
    if (apiResponse.Time.DateJewishLong) {
      const hebrewDateParts = apiResponse.Time.DateJewishLong.split(' ');
      hebrewDay = parseInt(hebrewDateParts[0]?.replace(/[^\d]/g, '') || '1');
      hebrewMonth = hebrewDateParts[1] || '';
      hebrewYear = parseInt(hebrewDateParts[2]?.replace(/[^\d]/g, '') || '5784');
    }

    // Check for Shabbat and Jewish calendar events
    const isShabbat = apiResponse.Time.IsShabbos || false;
    const isYomTov = apiResponse.Time.IsYomTov || false;
    const isFastDay = apiResponse.Time.IsFastDay || false;

    // Calculate Chabad prayer times
    const chabadPrayerTimes = ChabadPrayerCalculator.calculateChabadTimes(apiResponse);

    const zmanimData: ZmanimData = {
      date: dateMoment.format('YYYY-MM-DD'),
      location: location,
      hebrewDate: {
        day: hebrewDay,
        month: hebrewMonth,
        year: hebrewYear,
        formatted: apiResponse.Time.DateJewishLong || ''
      },
      times: {
        sunrise: {
          time: this.formatTime(apiResponse.Zman.SunriseDefault),
          description: 'Sunrise (נץ החמה)'
        },
        sunset: {
          time: this.formatTime(apiResponse.Zman.SunsetDefault),
          description: 'Sunset (שקיעת החמה)'
        },
        shemaGra: {
          time: this.formatTime(apiResponse.Zman.ShemaGra),
          description: 'Latest Shema - GRA (סוף זמן קריאת שמע - הגר״א)'
        },
        shemaMga: {
          time: this.formatTime(apiResponse.Zman.ShemaMA72fix),
          description: 'Latest Shema - MGA (סוף זמן קריאת שמע - מג״א)'
        },
        shacharitEnd: {
          time: this.formatTime(apiResponse.Zman.ShachrisGra),
          description: 'Latest Shacharit (סוף זמן תפילת שחרית)'
        },
        minchaGedola: {
          time: this.formatTime(apiResponse.Zman.MinchaGra),
          description: 'Mincha Gedola (מנחה גדולה)'
        },
        minchaKetana: {
          time: this.formatTime(apiResponse.Zman.KetanaGra),
          description: 'Mincha Ketana (מנחה קטנה)'
        },
        plagHamincha: {
          time: this.formatTime(apiResponse.Zman.PlagGra),
          description: 'Plag HaMincha (פלג המנחה)'
        },
        twilightStart: {
          time: this.formatTime(apiResponse.Zman.SunsetDefault),
          description: 'Twilight begins'
        },
        twilightEnd: {
          time: this.formatTime(apiResponse.Zman.Night72fix),
          description: 'Twilight ends (צאת הכוכבים)'
        },
        chatzot: {
          time: this.formatTime(apiResponse.Zman.Midday),
          description: 'Midday (חצות היום)'
        },
        midnightEnd: {
          time: this.formatTime(apiResponse.Zman.Midnight),
          description: 'Midnight (חצות הלילה)'
        },
        dawn72: {
          time: this.formatTime(apiResponse.Zman.Dawn72fix),
          description: 'Dawn - 72 minutes (עלות השחר)'
        },
        nightfall: {
          time: this.formatTime(apiResponse.Zman.Night72fix),
          description: 'Nightfall (צאת הכוכבים)'
        }
      },
      jewishCalendar: {
        ...(apiResponse.Time.Parsha && { parsha: apiResponse.Time.Parsha }),
        ...(apiResponse.Time.Holiday && { yomTov: apiResponse.Time.Holiday }),
        ...(apiResponse.Time.Omer > 0 && { omerCount: apiResponse.Time.Omer }),
        ...(apiResponse.Time.DafYomi && { dafYomi: apiResponse.Time.DafYomi }),
        isShabbat,
        isYomTov,
        isFastDay
      },
      chabadPrayerTimes,
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'MyZmanim API',
        apiVersion: '1.0'
      }
    };

    // Add Shabbat times if applicable
    if (apiResponse.Zman.Candles && apiResponse.Zman.Candles !== '0001-01-01T00:00:00Z') {
      zmanimData.times.candleLighting = {
        time: this.formatTime(apiResponse.Zman.Candles),
        description: 'Candle Lighting (הדלקת נרות)'
      };
    }

    if (apiResponse.Zman.NightShabbos) {
      zmanimData.times.havdalah = {
        time: this.formatTime(apiResponse.Zman.NightShabbos),
        description: 'Havdalah (הבדלה)'
      };
    }

    // Print Chabad prayer times to console
    ChabadPrayerCalculator.printChabadTimes(
      location.name, 
      chabadPrayerTimes, 
      apiResponse.Time.DateJewishLong || ''
    );

    return zmanimData;
  }

  /**
   * Format time string to a consistent format
   */
  private formatTime(timeString: string): string {
    if (!timeString || timeString === '0001-01-01T00:00:00Z') return '';
    
    try {
      // Parse the UTC time and format it consistently
      const time = new Date(timeString);
      return time.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.warn(`Warning: Could not parse time "${timeString}"`);
      return timeString;
    }
  }

  /**
   * Test the API connection
   */
  async testApiConnection(): Promise<boolean> {
    return await this.api.testConnection();
  }
}
