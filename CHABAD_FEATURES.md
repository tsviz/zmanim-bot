# 🕰️ CHABAD PRAYER TIMES FEATURE SUMMARY

## ✅ What We've Built

Your Jewish Event Times Tracker now includes **comprehensive Chabad prayer time calculations** with the following features:

### 🔥 New Capabilities

1. **Chabad-Specific Prayer Times**
   - Shacharit (morning prayer) times with earliest, recommended, and latest options
   - Mincha (afternoon prayer) times following Chabad customs
   - Maariv (evening prayer) times with weekday flexibility
   - Shema reading times for morning and night

2. **Beautiful Console Display**
   - Formatted prayer times with Hebrew descriptions
   - Color-coded sections for different prayers
   - Hebrew date display
   - Clean, professional output

3. **Data Storage**
   - All Chabad prayer times are saved to JSON files
   - Historical tracking capabilities
   - Location-specific storage

## 📍 Current Locations

- **New York** (US10001) - Eastern Time
- **Los Angeles** (US90210) - Pacific Time  
- **Jerusalem** (IL91000) - Israel Time
- **San Antonio** (US78201) - Central Time ✨ *Newly Added*

## 🚀 How to Use

### Full Processing (saves data + shows prayer times):
```bash
npm start
```

### Just Show Prayer Times (no data saving):
```bash
npm run times
```

## 📊 Sample Output

```
📿 CHABAD PRAYER TIMES - SAN ANTONIO
📅 י׳ אב תשפ״ה
════════════════════════════════════════════════════════════

🌅 SHACHARIT (שחרית):
   Earliest:    05:44 - Earliest Shacharit (from Alos - עלות השחר)
   Recommended: 06:56 - Recommended Shacharit (after sunrise - נץ החמה)
   Latest:      11:25 - Latest Shacharit (סוף זמן תפילה)

☀️ MINCHA (מנחה):
   Earliest:    14:14 - Earliest Mincha (מנחה גדולה)
   Recommended: 17:35 - Recommended Mincha (מנחה קטנה)
   Latest:      19:53 - Latest Mincha (30 min before sunset)

🌙 MAARIV (מעריב):
   Earliest:    18:59 - Earliest Maariv weekdays (after Plag HaMincha)
   Recommended: 21:36 - Recommended Maariv (after nightfall - צאת הכוכבים)

📖 SHEMA (שמע):
   Morning:     10:18 - Latest morning Shema (Chabad follows GRA - הגר״א)
   Night:       01:40 - Latest night Shema (before midnight - חצות)
════════════════════════════════════════════════════════════
```

## 🏗️ Technical Implementation

### New Files Created:
- `src/chabadCalculator.ts` - Chabad prayer time calculation logic
- `src/showTimes.ts` - Quick prayer time display utility

### Enhanced Files:
- `src/types.ts` - Added `ChabadPrayerTimes` interface
- `src/processor.ts` - Integrated Chabad calculations
- `config/locations.json` - Added San Antonio
- `package.json` - Added `npm run times` script

### Chabad Customs Implemented:

1. **Shacharit**: 
   - Earliest: From Alos HaShachar (dawn)
   - Recommended: After sunrise (נץ החמה)
   - Latest: End of prayer time (GRA)

2. **Mincha**:
   - Earliest: Mincha Gedola
   - Recommended: Mincha Ketana  
   - Latest: 30 minutes before sunset

3. **Maariv**:
   - Earliest: After Plag HaMincha (weekdays)
   - Recommended: After nightfall (צאת הכוכבים)

4. **Shema**:
   - Morning: Follows GRA opinion (Chabad custom)
   - Night: Before midnight (חצות)

## 🤖 Automation

The GitHub Actions workflow will:
- ✅ Calculate and save Chabad prayer times daily
- ✅ Display them in the workflow logs
- ✅ Store historical data for tracking
- ✅ Work for all configured locations

## 🎯 Next Steps

Your system is now fully functional with Chabad prayer times! You can:

1. **Add more locations** by editing `config/locations.json`
2. **View historical data** in the `data/` directory
3. **Set up GitHub Actions** for daily automation
4. **Customize prayer time calculations** in `chabadCalculator.ts`

The system now provides accurate, Chabad-compliant prayer times for all your locations! 🎉
