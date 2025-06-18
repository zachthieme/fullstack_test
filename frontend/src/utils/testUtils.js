// Test utilities for React components
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Custom render function that includes common providers and setup
 */
export async function renderWithProviders(ui, options = {}) {
  const { initialState, ...renderOptions } = options;
  const { act } = await import('@testing-library/react');

  // Add any providers here if needed (e.g., Redux, Context providers)
  function Wrapper({ children }) {
    return children;
  }

  let result;
  await act(async () => {
    result = render(ui, { wrapper: Wrapper, ...renderOptions });
  });
  
  return result;
}

/**
 * Mock fetch responses for testing
 */
export const mockFetchResponse = (data, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
};

/**
 * Mock fetch error for testing error handling
 */
export const mockFetchError = (errorMessage = 'Network error') => {
  return Promise.reject(new Error(errorMessage));
};

/**
 * Helper to create sample feedback data
 */
export const createSampleFeedback = (overrides = {}) => {
  const defaults = {
    id: 1,
    message: 'Sample feedback message',
    rating: 5,
    created_at: '2024-01-20',
  };
  
  return { ...defaults, ...overrides };
};

/**
 * Helper to create multiple sample feedback items
 */
export const createSampleFeedbackList = (count = 3) => {
  return Array.from({ length: count }, (_, index) => 
    createSampleFeedback({
      id: index + 1,
      message: `Sample feedback ${index + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
      created_at: `2024-01-${String(15 + index).padStart(2, '0')}`,
    })
  );
};

/**
 * Helper to simulate user typing in an input field with proper act wrapping
 */
export const typeInInput = async (element, text) => {
  const { fireEvent, act } = await import('@testing-library/react');
  
  await act(async () => {
    // Clear existing value
    fireEvent.change(element, { target: { value: '' } });
    
    // Type new value
    fireEvent.change(element, { target: { value: text } });
  });
};

/**
 * Helper to wait for API calls to complete
 */
export const waitForApiCall = async (mockFetch, expectedUrl, options = {}) => {
  const { waitFor } = await import('@testing-library/react');
  const { timeout = 1000 } = options;
  
  await waitFor(
    () => {
      const calls = mockFetch.mock.calls;
      const matchingCall = calls.find(call => call[0].includes(expectedUrl));
      expect(matchingCall).toBeTruthy();
    },
    { timeout }
  );
};

/**
 * Helper to get the last fetch call arguments
 */
export const getLastFetchCall = (mockFetch) => {
  const calls = mockFetch.mock.calls;
  return calls[calls.length - 1];
};

/**
 * Helper to get all fetch calls for a specific URL
 */
export const getFetchCallsForUrl = (mockFetch, url) => {
  return mockFetch.mock.calls.filter(call => call[0].includes(url));
};

/**
 * Helper to simulate clicking a button with proper act wrapping
 */
export const clickButton = async (buttonElement) => {
  const { fireEvent, act } = await import('@testing-library/react');
  
  await act(async () => {
    fireEvent.click(buttonElement);
  });
};

/**
 * Helper to fill form fields with proper act wrapping
 */
export const fillForm = async (fields) => {
  const { fireEvent, act } = await import('@testing-library/react');
  
  await act(async () => {
    Object.entries(fields).forEach(([element, value]) => {
      fireEvent.change(element, { target: { value } });
    });
  });
};

/**
 * Helper to suppress console warnings during tests
 */
export const suppressConsoleWarnings = () => {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: A component is changing') ||
       args[0].includes('act(...)') ||
       args[0].includes('wrapped in act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: A component is changing'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
  
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
};

/**
 * Mock date functions for consistent testing
 */
export const mockDate = (dateString = '2024-01-20') => {
  const mockDate = new Date(dateString);
  const originalDate = Date;
  
  // Mock Date constructor
  global.Date = jest.fn(() => mockDate);
  global.Date.now = jest.fn(() => mockDate.getTime());
  
  // Preserve static methods
  Object.setPrototypeOf(global.Date, originalDate);
  Object.getOwnPropertyNames(originalDate).forEach(name => {
    if (name !== 'length' && name !== 'name' && name !== 'prototype') {
      global.Date[name] = originalDate[name];
    }
  });
  
  return () => {
    global.Date = originalDate;
  };
};

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mocks = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
  
  Object.assign(console, mocks);
  
  return {
    mocks,
    restore: () => Object.assign(console, originalConsole),
  };
};

/**
 * Mock window.alert for testing
 */
export const mockAlert = () => {
  const originalAlert = window.alert;
  const mockAlert = jest.fn();
  window.alert = mockAlert;
  
  return {
    mock: mockAlert,
    restore: () => {
      window.alert = originalAlert;
    },
  };
};

/**
 * Helper to test component rendering without errors
 */
export const expectComponentToRender = (component) => {
  expect(() => render(component)).not.toThrow();
};

/**
 * Helper to test form submission with proper act wrapping
 */
export const submitForm = async (form) => {
  const { fireEvent, act } = await import('@testing-library/react');
  
  await act(async () => {
    fireEvent.submit(form);
  });
};

/**
 * Test data generators
 */
export const testData = {
  feedback: {
    valid: () => ({
      message: 'This is a test feedback message',
      rating: 4,
      created_at: '2024-01-20',
    }),
    
    withLongMessage: () => ({
      message: 'x'.repeat(1000),
      rating: 5,
      created_at: '2024-01-20',
    }),
    
    withMinRating: () => ({
      message: 'Poor service',
      rating: 1,
      created_at: '2024-01-20',
    }),
    
    withMaxRating: () => ({
      message: 'Excellent service',
      rating: 5,
      created_at: '2024-01-20',
    }),
  },
  
  queryParams: {
    withRating: (rating) => `rating=${rating}`,
    withDateRange: (from, to) => `from=${from}&to=${to}`,
    withSort: (order) => `sort=${order}`,
    combined: (rating, from, to, sort) => {
      const params = [];
      if (rating) params.push(`rating=${rating}`);
      if (from) params.push(`from=${from}`);
      if (to) params.push(`to=${to}`);
      if (sort) params.push(`sort=${sort}`);
      return params.join('&');
    },
  },
};

/**
 * Custom matchers for better assertions
 */
export const customMatchers = {
  toHaveBeenCalledWithUrl: (mockFetch, expectedUrl) => {
    const calls = mockFetch.mock.calls;
    const matchingCall = calls.find(call => call[0] === expectedUrl);
    return {
      pass: !!matchingCall,
      message: () => 
        `Expected fetch to have been called with URL "${expectedUrl}". 
         Actual calls: ${calls.map(call => call[0]).join(', ')}`,
    };
  },
};

// Re-export commonly used testing utilities
export * from '@testing-library/react';
export * from '@testing-library/jest-dom';