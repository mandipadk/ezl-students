export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public service: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Types for API requests
type EmailPollingRequest = {
  access_token: string;
  user_id: string;
};

type VectorStoreRequest = {
  user_id: string;
  access_token: string;
  provider: string;
};

type CanvasAgentRequest = {
  access_token: string;
  user_id: string;
};

type CanvasAssignmentRequest = {
  access_token: string;
  user_id: string;
};

type CalendarRequest = {
  user_id: string;
};

async function handleResponse(response: Response, service: string) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new APIError(
      response.statusText || 'API request failed',
      response.status,
      service,
      errorData
    );
  }
  return response.json();
}

async function fetchWithTimeout(
  resource: string,
  options: RequestInit & { timeout?: number } = {}
) {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  email: {
    async startPolling(data: EmailPollingRequest) {
      try {
        const response = await fetchWithTimeout('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 10000,
        });
        return handleResponse(response, 'email');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'email');
        }
        throw error;
      }
    },
  },

  canvas: {
    async agent(data: CanvasAgentRequest) {
      try {
        const response = await fetchWithTimeout('/api/canvas/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 10000,
        });
        return handleResponse(response, 'canvas');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'canvas');
        }
        throw error;
      }
    },

    async startFetchAssignments(data: CanvasAssignmentRequest) {
      try {
        const response = await fetchWithTimeout('/api/canvas/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 10000,
        });
        return handleResponse(response, 'canvas');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'canvas');
        }
        throw error;
      }
    },
  },

  calendar: {
    async schedule(data: CalendarRequest) {
      try {
        const response = await fetchWithTimeout('/api/calendar/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 10000,
        });
        return handleResponse(response, 'calendar');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'calendar');
        }
        throw error;
      }
    },

    async getScheduleStatus(data: CalendarRequest) {
      try {
        const response = await fetchWithTimeout(`/api/calendar/status?user_id=${data.user_id}`, {
          method: 'GET',
          timeout: 5000,
        });
        return handleResponse(response, 'calendar');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'calendar');
        }
        throw error;
      }
    },
  },

  vectorDb: {
    async createStore(data: VectorStoreRequest) {
      try {
        const response = await fetchWithTimeout('/api/vector-db/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 15000,
        });
        return handleResponse(response, 'vectorDb');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'vectorDb');
        }
        throw error;
      }
    },
  },
}; 