export interface Location {
  name: string;
  locationId: string;
  timezone: string;
  description?: string;
}

export interface ZmanimTime {
  time: string;
  description?: string;
}

export interface ChabadPrayerTimes {
  shacharit: {
    earliest: ZmanimTime;
    recommended: ZmanimTime;
    latest: ZmanimTime;
  };
  mincha: {
    earliest: ZmanimTime;
    recommended: ZmanimTime;
    latest: ZmanimTime;
  };
  maariv: {
    earliest: ZmanimTime;
    recommended: ZmanimTime;
  };
  shema: {
    night: ZmanimTime;
    morning: ZmanimTime;
  };
}

export interface ZmanimData {
  date: string;
  location: Location;
  hebrewDate: {
    day: number;
    month: string;
    year: number;
    formatted: string;
  };
  times: {
    // Sunrise and sunset
    sunrise: ZmanimTime;
    sunset: ZmanimTime;
    
    // Shema times
    shemaGra: ZmanimTime;
    shemaMga: ZmanimTime;
    
    // Prayer times
    shacharitEnd: ZmanimTime;
    minchaGedola: ZmanimTime;
    minchaKetana: ZmanimTime;
    plagHamincha: ZmanimTime;
    
    // Twilight times
    twilightStart: ZmanimTime;
    twilightEnd: ZmanimTime;
    
    // Shabbat times
    candleLighting?: ZmanimTime;
    havdalah?: ZmanimTime;
    
    // Special times
    chatzot: ZmanimTime;
    midnightEnd: ZmanimTime;
    dawn72: ZmanimTime;
    nightfall: ZmanimTime;
  };
  
  // Jewish calendar information
  jewishCalendar: {
    parsha?: string;
    yomTov?: string;
    fastDay?: string;
    omerCount?: number;
    dafYomi?: string;
    isShabbat: boolean;
    isYomTov: boolean;
    isFastDay: boolean;
  };

  // Chabad prayer times
  chabadPrayerTimes: ChabadPrayerTimes;
  
  // Metadata
  metadata: {
    fetchedAt: string;
    source: string;
    apiVersion: string;
  };
}

export interface ApiResponse {
  Copyright: string;
  ErrMsg: string | null;
  Html: string | null;
  Lang: string;
  Place: {
    LocationID: string;
    Name: string;
    City: string;
    Country: string;
    State: string;
    PostalCode: string;
    DavenDirectionGC: number;
    DavenDirectionRL: number;
    ElevationEast: number;
    ElevationObserver: number;
    ElevationWest: number;
    ObservesDST: string;
    CandlelightingMinutes: number;
    YakirDegreesDefault: number;
  };
  Time: {
    DateCivil: string;
    DateJewish: string;
    DateJewishLong: string;
    DateJewishShort: string;
    DateFullLong: string;
    Weekday: string;
    Holiday: string;
    HolidayShort: string;
    Parsha: string;
    ParshaShort: string;
    DafYomi: string;
    Omer: number;
    IsShabbos: boolean;
    IsYomTov: boolean;
    IsFastDay: boolean;
    IsRoshChodesh: boolean;
    IsCholHamoed: boolean;
    IsErevShabbos: boolean;
    IsErevYomTov: boolean;
    TonightIsYomTov: boolean;
    TomorrowNightIsYomTov: boolean;
  };
  Zman: {
    SunriseDefault: string;
    SunsetDefault: string;
    ShemaGra: string;
    ShemaMA72: string;
    ShemaMA72fix: string;
    ShachrisGra: string;
    ShachrisMA72: string;
    ShachrisMA72fix: string;
    MinchaGra: string;
    KetanaGra: string;
    PlagGra: string;
    Night72fix: string;
    NightShabbos: string;
    NightChazonIsh: string;
    Midday: string;
    Midnight: string;
    Dawn72fix: string;
    Candles: string;
    [key: string]: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  code?: number;
}
