# API Configuration

This document explains how to configure the MyZmanim API for the Jewish Event Times Tracker.

## Getting API Credentials

1. Visit [MyZmanim API Registration](https://www.myzmanim.com/apiget.aspx)
2. Sign up for a free 30-day trial or choose a paid plan
3. You'll receive:
   - `User ID`: A numeric identifier for your account
   - `API Key`: A long alphanumeric string for authentication

## Environment Variables

Set these environment variables in your system or CI/CD environment:

```bash
export MYZMANIM_USER="your_user_id_here"
export MYZMANIM_KEY="your_long_api_key_here"
```

### For GitHub Actions

Add these as repository secrets:
1. Go to your repository → Settings → Secrets and variables → Actions
2. Add new repository secrets:
   - Name: `MYZMANIM_USER`, Value: your user ID
   - Name: `MYZMANIM_KEY`, Value: your API key

## Location Configuration

Edit `config/locations.json` to configure the locations you want to track:

```json
[
  {
    "name": "New York",
    "locationId": "US10001",
    "timezone": "America/New_York",
    "description": "New York City, NY"
  }
]
```

### Finding Location IDs

Location IDs follow these patterns:

1. **US Postal Codes**: `US` + 5-digit ZIP code
   - Example: `US10001` for New York, NY 10001
   - Example: `US90210` for Beverly Hills, CA 90210

2. **International Postal Codes**: Country code + postal code
   - Example: `IL91000` for Jerusalem, Israel
   - Example: `GBNW1` for London, UK NW1
   - Example: `CAM5G` for Toronto, Canada M5G

3. **GPS Coordinates**: Use the search API to find location IDs by coordinates

### Using the Search API

You can find location IDs using the API search functions:

```javascript
// Search by postal code
const api = new MyZmanimApi(user, key);
const result = await api.searchPostal('10001', 'America/New_York');

// Search by GPS coordinates
const result = await api.searchGps(40.7128, -74.0060, 'America/New_York');
```

## Supported Timezones

Use standard IANA timezone identifiers:

- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Denver` - Mountain Time
- `America/Los_Angeles` - Pacific Time
- `Asia/Jerusalem` - Israel Time
- `Europe/London` - GMT/BST
- `America/Toronto` - Eastern Time (Canada)

## API Limits

- **Starter Plan**: $15/month for 10 locations, $1 per additional location
- **Premium Plan**: $40/month for 100 locations, $0.10 per additional location
- **Free Trial**: 30 days with limited locations

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `MYZMANIM_USER` and `MYZMANIM_KEY` are set
   - Check for typos in environment variable names

2. **"Failed to connect to MyZmanim API"**
   - Verify your API credentials are correct
   - Check if your trial period has expired
   - Ensure you haven't exceeded your location limit

3. **"Invalid location ID"**
   - Use the search API to find valid location IDs
   - Ensure postal codes are properly formatted
   - Check timezone spelling and format

### Testing Your Setup

Run the connection test:

```bash
npm run dev -- --test-connection
```

This will validate your API credentials without fetching full data.

## Rate Limiting

The MyZmanim API has built-in rate limiting. The tracker automatically handles this by:
- Processing locations sequentially
- Adding small delays between requests
- Retrying failed requests with exponential backoff

## Data Privacy

- API credentials are stored as environment variables/secrets
- No personal data is transmitted beyond location queries
- All data is stored locally in your repository
- Location data is anonymized (no personal addresses)
