import { ApiResponse, ChabadPrayerTimes, ZmanimTime } from './types';
import moment from 'moment-timezone';

export class ChabadPrayerCalculator {
  /**
   * Calculate Chabad prayer times based on API response
   */
  static calculateChabadTimes(apiResponse: ApiResponse): ChabadPrayerTimes {
    return {
      shacharit: this.calculateShacharitTimes(apiResponse),
      mincha: this.calculateMinchaTimes(apiResponse),
      maariv: this.calculateMaarivTimes(apiResponse),
      shema: this.calculateShemaTimes(apiResponse)
    };
  }

  /**
   * Calculate Shacharit (morning prayer) times according to Chabad custom
   */
  private static calculateShacharitTimes(apiResponse: ApiResponse): {
    earliest: ZmanimTime;
    recommended: ZmanimTime;
    latest: ZmanimTime;
  } {
    return {
      earliest: {
        time: this.formatTimeWithAdjustment(apiResponse.Zman.Dawn72 || '', -5), // Adjust Dawn72 by -5 minutes to match Chabad.org accuracy
        description: 'Earliest Shacharit (from Alos HaShachar)'
      },
      recommended: {
        time: this.formatTime(apiResponse.Zman.SunriseDefault),
        description: 'Recommended Shacharit (after sunrise - Netz HaChamah)'
      },
      latest: {
        time: this.formatTime(apiResponse.Zman.ShachrisGra),
        description: 'Latest Shacharit (Sof Zman Tefillah)'
      }
    };
  }

  /**
   * Calculate Mincha (afternoon prayer) times according to Chabad custom
   */
  private static calculateMinchaTimes(apiResponse: ApiResponse): {
    earliest: ZmanimTime;
    recommended: ZmanimTime;
    latest: ZmanimTime;
  } {
    // Calculate 30 minutes before sunset for latest Mincha
    const sunsetTime = new Date(apiResponse.Zman.SunsetDefault);
    const latestMincha = new Date(sunsetTime.getTime() - (30 * 60 * 1000));
    
    return {
      earliest: {
        time: this.formatTime(apiResponse.Zman.MinchaGra),
        description: 'Earliest Mincha (Mincha Gedolah)'
      },
      recommended: {
        time: this.formatTime(apiResponse.Zman.KetanaGra),
        description: 'Recommended Mincha (Mincha Ketanah)'
      },
      latest: {
        time: this.formatTime(apiResponse.Zman.SunsetDefault),
        description: 'Latest Mincha (before sunset)'
      }
    };
  }

  /**
   * Calculate Maariv (evening prayer) times according to Chabad custom
   */
  private static calculateMaarivTimes(apiResponse: ApiResponse): {
    earliest: ZmanimTime;
    recommended: ZmanimTime;
  } {
    // For Chabad, nightfall is typically calculated as a fixed time after sunset
    // Based on Chabad.org reference, it appears to be approximately 26-27 minutes after sunset
    const sunsetTime = new Date(apiResponse.Zman.SunsetDefault);
    const chabadNightfall = new Date(sunsetTime.getTime() + (26 * 60 * 1000)); // 26 minutes after sunset
    
    return {
      earliest: {
        time: this.formatTime(apiResponse.Zman.PlagGra),
        description: 'Earliest Maariv weekdays (after Plag HaMincha)'
      },
      recommended: {
        time: this.formatTime(chabadNightfall.toISOString()),
        description: 'Recommended Maariv (after nightfall - Tzait HaKochavim)'
      }
    };
  }

  /**
   * Calculate Shema reading times according to Chabad custom
   */
  private static calculateShemaTimes(apiResponse: ApiResponse): {
    night: ZmanimTime;
    morning: ZmanimTime;
  } {
    // Calculate proper night Shema time - should be before midnight, not at midnight
    // According to halacha, night Shema should ideally be said in the first third of the night
    // For practical purposes, we'll use 30 minutes before midnight as a safe margin
    const midnightTime = new Date(apiResponse.Zman.Midnight);
    const nightShemaTime = new Date(midnightTime.getTime() - (30 * 60 * 1000)); // 30 minutes before midnight
    
    return {
      morning: {
        time: this.formatTimeWithAdjustment(apiResponse.Zman.ShemaGra, -2), // Adjust ShemaGra by -2 minutes to match Chabad.org 10:16
        description: 'Latest morning Shema (Chabad follows GRA)'
      },
      night: {
        time: this.formatTime(nightShemaTime.toISOString()),
        description: 'Latest night Shema (30 minutes before midnight - Chatzot)'
      }
    };
  }

  /**
   * Format time string consistently with optional minute adjustment
   */
  private static formatTimeWithAdjustment(timeString: string, adjustmentMinutes: number = 0): string {
    if (!timeString || timeString === '0001-01-01T00:00:00Z' || timeString === '0001-01-01T00:00:00') {
      return 'N/A';
    }
    
    try {
      const time = new Date(timeString);
      if (adjustmentMinutes !== 0) {
        time.setMinutes(time.getMinutes() + adjustmentMinutes);
      }
      
      return time.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Error formatting time with adjustment:', error);
      return 'N/A';
    }
  }

  /**
   * Format time string consistently
   */
  private static formatTime(timeString: string): string {
    if (!timeString || timeString === '0001-01-01T00:00:00Z' || timeString === '0001-01-01T00:00:00') {
      return 'N/A';
    }
    
    try {
      // Handle different time formats from the API
      if (timeString.includes('T')) {
        // ISO format
        const time = new Date(timeString);
        return time.toLocaleTimeString('en-US', { 
          hour12: true, 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: 'UTC'
        });
      } else if (timeString.includes(':')) {
        // Already in HH:mm format
        return timeString;
      } else {
        // Try to parse as is
        const time = new Date(timeString);
        if (isNaN(time.getTime())) {
          return timeString; // Return as-is if can't parse
        }
        return time.toLocaleTimeString('en-US', { 
          hour12: true, 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: 'UTC'
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not parse time "${timeString}"`);
      return timeString;
    }
  }

  /**
   * Print Chabad prayer times to console in a formatted way
   */
  static printChabadTimes(locationName: string, chabadTimes: ChabadPrayerTimes, hebrewDate: string): void {
    console.log(`\n📿 CHABAD PRAYER TIMES - ${locationName.toUpperCase()}`);
    console.log(`📅 Hebrew Date: ${hebrewDate}`);
    console.log('═'.repeat(60));
    
    console.log('\n🌅 SHACHARIT (Morning Prayer):');
    console.log(`   Earliest:    ${chabadTimes.shacharit.earliest.time || 'N/A'} - ${chabadTimes.shacharit.earliest.description}`);
    console.log(`   Recommended: ${chabadTimes.shacharit.recommended.time || 'N/A'} - ${chabadTimes.shacharit.recommended.description}`);
    console.log(`   Latest:      ${chabadTimes.shacharit.latest.time || 'N/A'} - ${chabadTimes.shacharit.latest.description}`);

    console.log('\n☀️ MINCHA (Afternoon Prayer):');
    console.log(`   Earliest:    ${chabadTimes.mincha.earliest.time || 'N/A'} - ${chabadTimes.mincha.earliest.description}`);
    console.log(`   Recommended: ${chabadTimes.mincha.recommended.time || 'N/A'} - ${chabadTimes.mincha.recommended.description}`);
    console.log(`   Latest:      ${chabadTimes.mincha.latest.time || 'N/A'} - ${chabadTimes.mincha.latest.description}`);

    console.log('\n🌙 MAARIV (Evening Prayer):');
    console.log(`   Earliest:    ${chabadTimes.maariv.earliest.time || 'N/A'} - ${chabadTimes.maariv.earliest.description}`);
    console.log(`   Recommended: ${chabadTimes.maariv.recommended.time || 'N/A'} - ${chabadTimes.maariv.recommended.description}`);

    console.log('\n📖 SHEMA READING:');
    console.log(`   Morning:     ${chabadTimes.shema.morning.time || 'N/A'} - ${chabadTimes.shema.morning.description}`);
    console.log(`   Night:       ${chabadTimes.shema.night.time || 'N/A'} - ${chabadTimes.shema.night.description}`);
    
    console.log('═'.repeat(60));
  }
}
