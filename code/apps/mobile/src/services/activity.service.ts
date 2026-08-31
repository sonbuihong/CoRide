import { apiClient } from '../api/client';
import type { ActivitiesPage, ActivityRole, ActivitySegment } from '../features/activities/activity.types';

export const activityService = {
  async getActivities(role: ActivityRole, segment: ActivitySegment, cursor?: string, limit = 20): Promise<ActivitiesPage> {
    const response = await apiClient.get<ActivitiesPage>('/activities', {
      params: { role, segment, cursor, limit },
    });
    return response.data;
  },
};
