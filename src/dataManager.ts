import * as fs from 'fs-extra';
import * as path from 'path';
import moment from 'moment-timezone';
import { ZmanimData, ApiResponse, Location } from './types';

export class DataManager {
  private readonly dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  /**
   * Save daily Zmanim data
   */
  async saveDailyData(data: ZmanimData): Promise<void> {
    const date = moment(data.date);
    const year = date.format('YYYY');
    const month = date.format('MM');
    const day = date.format('DD');
    
    // Save to daily file
    const dailyPath = path.join(this.dataDir, year, month, `${day}.json`);
    await fs.ensureDir(path.dirname(dailyPath));
    
    // Read existing data if it exists
    let dailyData: ZmanimData[] = [];
    if (await fs.pathExists(dailyPath)) {
      dailyData = await fs.readJson(dailyPath);
    }
    
    // Update or add location data
    const existingIndex = dailyData.findIndex(d => d.location.locationId === data.location.locationId);
    if (existingIndex >= 0) {
      dailyData[existingIndex] = data;
    } else {
      dailyData.push(data);
    }
    
    await fs.writeJson(dailyPath, dailyData, { spaces: 2 });
    
    // Save to location-specific files
    await this.saveLocationData(data);
    
    // Update summary files
    await this.updateSummaries();
  }

  /**
   * Save location-specific data
   */
  private async saveLocationData(data: ZmanimData): Promise<void> {
    const locationSlug = this.slugify(data.location.name);
    const locationDir = path.join(this.dataDir, 'locations', locationSlug);
    await fs.ensureDir(locationDir);
    
    // Save latest data
    const latestPath = path.join(locationDir, 'latest.json');
    await fs.writeJson(latestPath, data, { spaces: 2 });
    
    // Save to monthly file
    const date = moment(data.date);
    const monthlyPath = path.join(locationDir, `${date.format('YYYY-MM')}.json`);
    
    let monthlyData: ZmanimData[] = [];
    if (await fs.pathExists(monthlyPath)) {
      monthlyData = await fs.readJson(monthlyPath);
    }
    
    // Update or add daily data
    const existingIndex = monthlyData.findIndex(d => d.date === data.date);
    if (existingIndex >= 0) {
      monthlyData[existingIndex] = data;
    } else {
      monthlyData.push(data);
      // Sort by date
      monthlyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    await fs.writeJson(monthlyPath, monthlyData, { spaces: 2 });
  }

  /**
   * Update summary files
   */
  private async updateSummaries(): Promise<void> {
    const summaryDir = path.join(this.dataDir, 'summary');
    await fs.ensureDir(summaryDir);
    
    // Update latest.json with all location latest data
    const locationsDir = path.join(this.dataDir, 'locations');
    const latestSummary: { [key: string]: ZmanimData } = {};
    
    if (await fs.pathExists(locationsDir)) {
      const locations = await fs.readdir(locationsDir);
      
      for (const location of locations) {
        const latestPath = path.join(locationsDir, location, 'latest.json');
        if (await fs.pathExists(latestPath)) {
          const latestData = await fs.readJson(latestPath);
          latestSummary[location] = latestData;
        }
      }
    }
    
    const latestPath = path.join(summaryDir, 'latest.json');
    await fs.writeJson(latestPath, {
      lastUpdated: new Date().toISOString(),
      locations: latestSummary
    }, { spaces: 2 });
    
    // Create weekly summary
    await this.createWeeklySummary();
  }

  /**
   * Create weekly summary
   */
  private async createWeeklySummary(): Promise<void> {
    const now = moment();
    const startOfWeek = now.clone().startOf('week');
    const endOfWeek = now.clone().endOf('week');
    
    const weeklySummary: { [date: string]: ZmanimData[] } = {};
    
    for (let date = startOfWeek.clone(); date.isSameOrBefore(endOfWeek); date.add(1, 'day')) {
      const year = date.format('YYYY');
      const month = date.format('MM');
      const day = date.format('DD');
      const dailyPath = path.join(this.dataDir, year, month, `${day}.json`);
      
      if (await fs.pathExists(dailyPath)) {
        const dailyData = await fs.readJson(dailyPath);
        weeklySummary[date.format('YYYY-MM-DD')] = dailyData;
      }
    }
    
    const weeklyPath = path.join(this.dataDir, 'summary', 'weekly.json');
    await fs.writeJson(weeklyPath, {
      weekStarting: startOfWeek.format('YYYY-MM-DD'),
      weekEnding: endOfWeek.format('YYYY-MM-DD'),
      lastUpdated: new Date().toISOString(),
      data: weeklySummary
    }, { spaces: 2 });
  }

  /**
   * Get data for a specific date and location
   */
  async getDailyData(date: string, locationId?: string): Promise<ZmanimData[]> {
    const dateMoment = moment(date);
    const year = dateMoment.format('YYYY');
    const month = dateMoment.format('MM');
    const day = dateMoment.format('DD');
    
    const dailyPath = path.join(this.dataDir, year, month, `${day}.json`);
    
    if (!(await fs.pathExists(dailyPath))) {
      return [];
    }
    
    const dailyData: ZmanimData[] = await fs.readJson(dailyPath);
    
    if (locationId) {
      return dailyData.filter(d => d.location.locationId === locationId);
    }
    
    return dailyData;
  }

  /**
   * Get location data for a specific month
   */
  async getLocationMonthlyData(locationName: string, yearMonth: string): Promise<ZmanimData[]> {
    const locationSlug = this.slugify(locationName);
    const monthlyPath = path.join(this.dataDir, 'locations', locationSlug, `${yearMonth}.json`);
    
    if (!(await fs.pathExists(monthlyPath))) {
      return [];
    }
    
    return await fs.readJson(monthlyPath);
  }

  /**
   * Create a URL-friendly slug from a string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Ensure data directory structure exists
   */
  async initializeDataStructure(): Promise<void> {
    await fs.ensureDir(this.dataDir);
    await fs.ensureDir(path.join(this.dataDir, 'locations'));
    await fs.ensureDir(path.join(this.dataDir, 'summary'));
  }
}
