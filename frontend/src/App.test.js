import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => '2024-01-20'),
}));

describe('App Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Default mock for GET /feedback
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders main heading', async () => {
      await act(async () => {
        render(<App />);
      });
      expect(screen.getByText('Feedback Dashboard')).toBeInTheDocument();
    });

    test('renders all filter controls', async () => {
      await act(async () => {
        render(<App />);
      });
      
      expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
    });

    test('renders add feedback button', async () => {
      await act(async () => {
        render(<App />);
      });
      expect(screen.getByText('Add Feedback')).toBeInTheDocument();
    });

    test('makes initial API call on mount', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback?sort=desc');
      });
    });
  });

  describe('Feedback List Display', () => {
    test('displays feedback items correctly', async () => {
      const sampleFeedback = [
        { id: 1, message: 'Great service', rating: 5, created_at: '2024-01-20' },
        { id: 2, message: 'Could improve', rating: 3, created_at: '2024-01-19' }
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleFeedback)
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Great service/)).toBeInTheDocument();
        expect(screen.getByText(/Could improve/)).toBeInTheDocument();
        // Check that the feedback items contain the expected content
        expect(screen.getByText(/★★★★★ Great service/)).toBeInTheDocument();
        expect(screen.getByText(/★★★ Could improve/)).toBeInTheDocument();
      });
    });

    test('displays empty list when no feedback', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      const feedbackList = screen.getByRole('list');
      expect(feedbackList).toBeEmptyDOMElement();
    });

    test('handles fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Filter Functionality', () => {
    test('rating filter updates API call', async () => {
      await act(async () => {
        render(<App />);
      });

      const ratingSelect = screen.getByLabelText(/rating/i);
      
      await act(async () => {
        fireEvent.change(ratingSelect, { target: { value: '5' } });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback?rating=5&sort=desc');
      });
    });

    test('date filters update API call', async () => {
      await act(async () => {
        render(<App />);
      });

      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/to/i);

      await act(async () => {
        fireEvent.change(fromInput, { target: { value: '2024-01-01' } });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback?from=2024-01-01&sort=desc');
      });

      await act(async () => {
        fireEvent.change(toInput, { target: { value: '2024-01-31' } });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback?from=2024-01-01&to=2024-01-31&sort=desc');
      });
    });

    test('sort filter updates API call', async () => {
      await act(async () => {
        render(<App />);
      });

      const sortSelect = screen.getByLabelText(/sort/i);
      
      await act(async () => {
        fireEvent.change(sortSelect, { target: { value: 'asc' } });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback?sort=asc');
      });
    });

    test('multiple filters combine correctly', async () => {
      await act(async () => {
        render(<App />);
      });

      const ratingSelect = screen.getByLabelText(/rating/i);
      const fromInput = screen.getByLabelText(/from/i);
      const sortSelect = screen.getByLabelText(/sort/i);

      await act(async () => {
        fireEvent.change(ratingSelect, { target: { value: '4' } });
        fireEvent.change(fromInput, { target: { value: '2024-01-15' } });
        fireEvent.change(sortSelect, { target: { value: 'asc' } });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback?rating=4&from=2024-01-15&sort=asc');
      });
    });
  });

  describe('Add Feedback Form', () => {
    test('shows form when add feedback button is clicked', async () => {
      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      expect(screen.getByText('Add Feedback', { selector: 'h2' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your feedback...')).toBeInTheDocument();
      expect(screen.getAllByLabelText(/rating/i)).toHaveLength(2); // One for filter, one for form
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
    });

    test('hides form when hide button is clicked', async () => {
      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const hideButton = screen.getByText('Hide');
      
      await act(async () => {
        fireEvent.click(hideButton);
      });

      expect(screen.queryByText('Add Feedback', { selector: 'h2' })).not.toBeInTheDocument();
    });

    test('form fields update correctly', async () => {
      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const messageTextarea = screen.getByPlaceholderText('Your feedback...');
      const ratingSelects = screen.getAllByLabelText(/rating/i);
      const formRatingSelect = ratingSelects[1]; // Second rating select is for the form
      const dateInput = screen.getByLabelText(/date/i);

      await act(async () => {
        fireEvent.change(messageTextarea, { target: { value: 'Test message' } });
        fireEvent.change(formRatingSelect, { target: { value: '4' } });
        fireEvent.change(dateInput, { target: { value: '2024-01-25' } });
      });

      expect(messageTextarea.value).toBe('Test message');
      expect(formRatingSelect.value).toBe('4');
      expect(dateInput.value).toBe('2024-01-25');
    });
  });

  describe('Submit Feedback', () => {
    beforeEach(() => {
      // Mock successful POST response
      mockFetch.mockImplementation((url, options) => {
        if (options && options.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'ok' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });
    });

    test('submits feedback successfully', async () => {
      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Fill form
      const messageTextarea = screen.getByPlaceholderText('Your feedback...');
      const ratingSelects = screen.getAllByLabelText(/rating/i);
      const formRatingSelect = ratingSelects[1]; // Second rating select is for the form
      const dateInput = screen.getByLabelText(/date/i);

      await act(async () => {
        fireEvent.change(messageTextarea, { target: { value: 'Test feedback' } });
        fireEvent.change(formRatingSelect, { target: { value: '4' } });
        fireEvent.change(dateInput, { target: { value: '2024-01-25' } });
      });

      const submitButton = screen.getByText('Submit Feedback');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Test feedback',
            rating: 4,
            created_at: '2024-01-25'
          })
        });
      });

      // Form should be cleared after successful submission
      await waitFor(() => {
        expect(messageTextarea.value).toBe('');
      });
    });

    test('prevents submission with empty message', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const submitButton = screen.getByText('Submit Feedback');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(alertSpy).toHaveBeenCalledWith('Please enter a message.');
      
      alertSpy.mockRestore();
    });

    test('prevents submission with whitespace-only message', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const messageTextarea = screen.getByPlaceholderText('Your feedback...');
      
      await act(async () => {
        fireEvent.change(messageTextarea, { target: { value: '   ' } });
      });

      const submitButton = screen.getByText('Submit Feedback');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(alertSpy).toHaveBeenCalledWith('Please enter a message.');
      
      alertSpy.mockRestore();
    });

    test('handles submission error', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      mockFetch.mockImplementation((url, options) => {
        if (options && options.method === 'POST') {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const messageTextarea = screen.getByPlaceholderText('Your feedback...');
      
      await act(async () => {
        fireEvent.change(messageTextarea, { target: { value: 'Test error handling' } });
      });

      const submitButton = screen.getByText('Submit Feedback');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to add feedback');
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('adding feedback refreshes the list', async () => {
      let postCalled = false;
      
      mockFetch.mockImplementation((url, options) => {
        if (options && options.method === 'POST') {
          postCalled = true;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'ok' })
          });
        }
        
        // Return different data after POST
        if (postCalled) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { id: 1, message: 'New feedback after submission', rating: 4, created_at: '2024-01-25' }
            ])
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const messageTextarea = screen.getByPlaceholderText('Your feedback...');
      
      await act(async () => {
        fireEvent.change(messageTextarea, { target: { value: 'Test submission' } });
      });

      const submitButton = screen.getByText('Submit Feedback');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verify list was refreshed with new data
      await waitFor(() => {
        expect(screen.getByText(/New feedback after submission/)).toBeInTheDocument();
      });
    });

    test('filters work after adding feedback', async () => {
      let postCalled = false;
      
      mockFetch.mockImplementation((url, options) => {
        if (options && options.method === 'POST') {
          postCalled = true;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'ok' })
          });
        }
        
        if (url.includes('rating=5')) {
          const fiveStarFeedback = postCalled 
            ? [{ id: 2, message: 'Five star feedback', rating: 5, created_at: '2024-01-25' }]
            : [];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(fiveStarFeedback)
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      await act(async () => {
        render(<App />);
      });

      // Add feedback
      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      const messageTextarea = screen.getByPlaceholderText('Your feedback...');
      const ratingSelects = screen.getAllByLabelText(/rating/i);
      const formRatingSelect = ratingSelects[1]; // Form rating select
      
      await act(async () => {
        fireEvent.change(messageTextarea, { target: { value: 'Five star feedback' } });
        fireEvent.change(formRatingSelect, { target: { value: '5' } });
      });

      const submitButton = screen.getByText('Submit Feedback');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Apply rating filter
      const filterRatingSelect = ratingSelects[0]; // Filter rating select
      
      await act(async () => {
        fireEvent.change(filterRatingSelect, { target: { value: '5' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Five star feedback/)).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    test('displays dates in correct format', async () => {
      const sampleFeedback = [
        { id: 1, message: 'Test feedback', rating: 5, created_at: '2024-01-20' }
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleFeedback)
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        // Check that date is formatted properly
        expect(screen.getByText(/1\/19\/2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('form elements have proper labels', async () => {
      await act(async () => {
        render(<App />);
      });

      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      expect(screen.getAllByLabelText(/rating/i)).toHaveLength(2); // Filter and form rating selects
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });

    test('buttons have accessible text', async () => {
      await act(async () => {
        render(<App />);
      });

      expect(screen.getByRole('button', { name: 'Add Feedback' })).toBeInTheDocument();
      
      const addButton = screen.getByText('Add Feedback');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeInTheDocument();
    });
  });
});