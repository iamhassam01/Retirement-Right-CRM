import axios, { AxiosError } from 'axios';
import { PrismaClient, EventTemplate, EventOccurrence } from '@prisma/client';

const prisma = new PrismaClient();

// WordPress Configuration from environment
const WP_SITE_URL = process.env.WP_SITE_URL || 'https://retirement-right.com';
const WP_USERNAME = process.env.WP_USERNAME || '';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';

// WordPress REST API endpoint for custom Events post type
const WP_EVENTS_ENDPOINT = `${WP_SITE_URL}/wp-json/wp/v2/events`;

interface WordPressEventPayload {
    title: string;
    status: 'draft' | 'publish';
    excerpt?: string;
    slug?: string;
    acf: {
        subtitle?: string;
        learnings?: string[];
        why_attend?: string;
        faqs?: { question: string; answer: string }[];
        venue_name?: string;
        room?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        map_url?: string;
        event_date?: string;
        start_time?: string;
        end_time?: string;
        host_name?: string;
        host_title?: string;
        host_email?: string;
        host_phone?: string;
        guide_url?: string;
        disclaimer?: string;
    };
    featured_media?: number;
}

interface WordPressResponse {
    id: number;
    slug: string;
    link: string;
    status: string;
}

/**
 * WordPress Sync Service
 * Handles all communication with WordPress REST API
 */
export class WordPressService {
    private authHeader: string;

    constructor() {
        // Create Basic Auth header from credentials
        const credentials = `${WP_USERNAME}:${WP_APP_PASSWORD.replace(/\s/g, '')}`;
        this.authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
    }

    /**
     * Check if WordPress credentials are configured
     */
    isConfigured(): boolean {
        return !!(WP_USERNAME && WP_APP_PASSWORD);
    }

    /**
     * Build the WordPress payload from template + occurrence
     */
    private buildPayload(
        template: EventTemplate,
        occurrence: EventOccurrence,
        wpStatus: 'draft' | 'publish'
    ): WordPressEventPayload {
        // Format date for title
        const eventDate = new Date(occurrence.eventDate);
        const dateStr = eventDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Generate slug from template name and date
        const slug = `${template.slug || template.name.toLowerCase().replace(/\s+/g, '-')}-${eventDate.toISOString().split('T')[0]}`;

        // Parse FAQs from JSON
        let faqs: { question: string; answer: string }[] = [];
        if (template.faqs) {
            try {
                faqs = Array.isArray(template.faqs) ? template.faqs : JSON.parse(template.faqs as string);
            } catch {
                faqs = [];
            }
        }

        return {
            title: `${template.name} ${dateStr}`,
            status: wpStatus,
            excerpt: template.description || undefined,
            slug,
            acf: {
                subtitle: template.subtitle || undefined,
                learnings: template.learnings || [],
                why_attend: template.whyAttend || undefined,
                faqs,
                venue_name: occurrence.venueName,
                room: occurrence.room || undefined,
                address: occurrence.address,
                city: occurrence.city || undefined,
                state: occurrence.state || undefined,
                zip: occurrence.zipCode || undefined,
                map_url: occurrence.mapUrl || undefined,
                event_date: eventDate.toISOString().split('T')[0],
                start_time: occurrence.startTime || undefined,
                end_time: occurrence.endTime || undefined,
                host_name: template.hostName || undefined,
                host_title: template.hostTitle || undefined,
                host_email: template.hostEmail || undefined,
                host_phone: template.hostPhone || undefined,
                guide_url: template.guideUrl || undefined,
                disclaimer: template.disclaimer || undefined,
            }
        };
    }

    /**
     * Create a new post in WordPress
     */
    async createPost(payload: WordPressEventPayload): Promise<WordPressResponse> {
        if (!this.isConfigured()) {
            throw new Error('WordPress credentials not configured. Please set WP_USERNAME and WP_APP_PASSWORD in environment.');
        }

        try {
            const response = await axios.post<WordPressResponse>(
                WP_EVENTS_ENDPOINT,
                payload,
                {
                    headers: {
                        'Authorization': this.authHeader,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000, // 30 second timeout
                }
            );
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            const errorMessage = axiosError.response?.data
                ? JSON.stringify(axiosError.response.data)
                : axiosError.message;
            throw new Error(`WordPress API Error: ${errorMessage}`);
        }
    }

    /**
     * Update an existing post in WordPress
     */
    async updatePost(wpPostId: number, payload: WordPressEventPayload): Promise<WordPressResponse> {
        if (!this.isConfigured()) {
            throw new Error('WordPress credentials not configured. Please set WP_USERNAME and WP_APP_PASSWORD in environment.');
        }

        try {
            const response = await axios.put<WordPressResponse>(
                `${WP_EVENTS_ENDPOINT}/${wpPostId}`,
                payload,
                {
                    headers: {
                        'Authorization': this.authHeader,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            const errorMessage = axiosError.response?.data
                ? JSON.stringify(axiosError.response.data)
                : axiosError.message;
            throw new Error(`WordPress API Error: ${errorMessage}`);
        }
    }

    /**
     * Delete a post from WordPress
     */
    async deletePost(wpPostId: number): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('WordPress credentials not configured. Please set WP_USERNAME and WP_APP_PASSWORD in environment.');
        }

        try {
            await axios.delete(
                `${WP_EVENTS_ENDPOINT}/${wpPostId}?force=true`,
                {
                    headers: {
                        'Authorization': this.authHeader,
                    },
                    timeout: 30000,
                }
            );
        } catch (error) {
            const axiosError = error as AxiosError;
            // 404 is OK - post was already deleted
            if (axiosError.response?.status === 404) {
                return;
            }
            const errorMessage = axiosError.response?.data
                ? JSON.stringify(axiosError.response.data)
                : axiosError.message;
            throw new Error(`WordPress API Error: ${errorMessage}`);
        }
    }

    /**
     * Sync a single occurrence to WordPress
     * Creates or updates based on whether wpPostId exists
     */
    async syncOccurrence(
        occurrenceId: string,
        wpStatus: 'draft' | 'publish' = 'draft'
    ): Promise<{ success: boolean; wpPostId?: number; error?: string }> {
        try {
            // Fetch occurrence with template
            const occurrence = await prisma.eventOccurrence.findUnique({
                where: { id: occurrenceId },
                include: { template: true }
            });

            if (!occurrence) {
                return { success: false, error: 'Occurrence not found' };
            }

            const payload = this.buildPayload(occurrence.template, occurrence, wpStatus);

            let wpResponse: WordPressResponse;

            if (occurrence.wpPostId) {
                // Update existing post
                wpResponse = await this.updatePost(occurrence.wpPostId, payload);
            } else {
                // Create new post
                wpResponse = await this.createPost(payload);
            }

            // Update occurrence with sync status
            await prisma.eventOccurrence.update({
                where: { id: occurrenceId },
                data: {
                    wpPostId: wpResponse.id,
                    wpSlug: wpResponse.slug,
                    wpStatus: wpResponse.status as string,
                    wpSyncStatus: 'synced',
                    wpLastSyncedAt: new Date(),
                    wpSyncError: null,
                }
            });

            return { success: true, wpPostId: wpResponse.id };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Update occurrence with error status
            await prisma.eventOccurrence.update({
                where: { id: occurrenceId },
                data: {
                    wpSyncStatus: 'failed',
                    wpSyncError: errorMessage,
                }
            });

            return { success: false, error: errorMessage };
        }
    }

    /**
     * Delete an occurrence from WordPress
     */
    async deleteOccurrenceFromWP(occurrenceId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const occurrence = await prisma.eventOccurrence.findUnique({
                where: { id: occurrenceId }
            });

            if (!occurrence) {
                return { success: false, error: 'Occurrence not found' };
            }

            if (occurrence.wpPostId) {
                await this.deletePost(occurrence.wpPostId);
            }

            // Update sync status
            await prisma.eventOccurrence.update({
                where: { id: occurrenceId },
                data: {
                    wpSyncStatus: 'deleted',
                    wpPostId: null,
                    wpSlug: null,
                }
            });

            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Sync all occurrences for a template
     */
    async syncAllOccurrences(
        templateId: string,
        wpStatus: 'draft' | 'publish' = 'draft'
    ): Promise<{ total: number; synced: number; failed: number; errors: string[] }> {
        const occurrences = await prisma.eventOccurrence.findMany({
            where: { templateId, status: 'scheduled' }
        });

        const results = {
            total: occurrences.length,
            synced: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const occurrence of occurrences) {
            const result = await this.syncOccurrence(occurrence.id, wpStatus);
            if (result.success) {
                results.synced++;
            } else {
                results.failed++;
                results.errors.push(`${occurrence.id}: ${result.error}`);
            }
        }

        return results;
    }
}

// Export singleton instance
export const wordpressService = new WordPressService();
