/**
 * Application Constants
 * 
 * All mock data has been removed. Data is now fetched from the API.
 * This file contains only enums and type-related constants.
 */

import { PipelineStage } from './types';

// Pipeline stage display order
export const PIPELINE_STAGE_ORDER = [
  PipelineStage.NewLead,
  PipelineStage.Contacted,
  PipelineStage.MeetingSet,
  PipelineStage.Proposal,
  PipelineStage.Negotiation,
  PipelineStage.ClientOnboarded
];

// Activity types
export const ACTIVITY_TYPES = ['call', 'sms', 'email', 'meeting'] as const;

// Task priority levels
export const TASK_PRIORITIES = ['High', 'Medium', 'Low'] as const;

// Client statuses
export const CLIENT_STATUSES = ['Active', 'Prospect', 'Lead', 'Inactive'] as const;

// Document categories
export const DOCUMENT_CATEGORIES = ['Client', 'Compliance', 'Internal'] as const;

// User roles
export const USER_ROLES = ['ADMIN', 'ADVISOR', 'STAFF'] as const;