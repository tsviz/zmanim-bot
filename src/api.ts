import axios, { AxiosError } from 'axios';
import { ApiResponse, ApiError, Location } from './types';

export class MyZmanimApi {
  private readonly baseUrl = 'https://api.myzmanim.com/engine1.json.aspx';
  private readonly user: string;
  private readonly key: string;

  constructor(user: string, key: string) {
    this.user = user;
    this.key = key;
  }

  /**
   * Get Zmanim data for a specific date and location
   */
  async getDay(locationId: string, date?: Date): Promise<ApiResponse> {
    const inputDate = date ? this.formatDate(date) : this.formatDate(new Date());
    
    const data = new URLSearchParams({
      user: this.user,
      key: this.key,
      coding: 'JS',
      language: 'en',
      locationid: locationId,  // Note: lowercase 'id'
      inputdate: inputDate     // Note: lowercase
    });

    try {
      const response = await axios.post(`${this.baseUrl}/getDay`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data.error) {
        throw new Error(`API Error: ${response.data.error}`);
      }
      
      return response.data as ApiResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Search for a location by postal code
   */
  async searchPostal(postalCode: string, timeZone?: string): Promise<any> {
    const data = new URLSearchParams({
      user: this.user,
      key: this.key,
      coding: 'JS',
      query: postalCode,
      ...(timeZone && { timezone: timeZone })
    });

    try {
      const response = await axios.post(`${this.baseUrl}/searchPostal`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Search for a location by GPS coordinates
   */
  async searchGps(latitude: number, longitude: number, timeZone?: string): Promise<any> {
    const data = new URLSearchParams({
      user: this.user,
      key: this.key,
      coding: 'JS',
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ...(timeZone && { timezone: timeZone })
    });

    try {
      const response = await axios.post(`${this.baseUrl}/searchGps`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    const isoString = date.toISOString();
    return isoString.split('T')[0]!;
  }

  /**
   * Test API connection with a simple request
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a known location (NYC)
      const response = await this.getDay('US10001');
      return response.Place?.Name !== undefined;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}
