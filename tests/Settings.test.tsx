import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import Settings from '../src/popup/components/Settings';

// Mock chrome storage to return settings
const mockGet = jest.fn();
const mockSet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (global.chrome.storage.local.get as jest.Mock) = mockGet.mockResolvedValue({
    veniceApiKey: '',
    bankrUsername: '',
    bankrEnabled: true,
    bankrApiKey: '',
    githubToken: '',
    responseTypes: { agreeReply: true, againstReply: true, forQuote: false, againstQuote: false },
  });
  (global.chrome.storage.local.set as jest.Mock) = mockSet.mockResolvedValue(undefined);
  (global.chrome.storage.local.remove as jest.Mock) = jest.fn().mockResolvedValue(undefined);
});

describe('Settings', () => {
  it('renders settings form', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByText(/Venice API Key/i)).toBeInTheDocument();
    });
  });

  it('shows save button', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Settings/i })).toBeInTheDocument();
    });
  });

  it('shows Bankr API Key section', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByText(/Bankr/i)).toBeInTheDocument();
    });
  });

  it('shows Response Types section', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByText(/Response Types/i)).toBeInTheDocument();
    });
  });

  it.skip('saves settings when Save clicked', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Settings/i })).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    });
    await waitFor(() => {
      expect(mockSet).toHaveBeenCalled();
    });
  });

  it.skip('loads existing API key from storage', async () => {
    mockGet.mockResolvedValue({
      veniceApiKey: 'test-venice-key',
      bankrUsername: '',
      bankrEnabled: true,
      bankrApiKey: '',
      githubToken: '',
      responseTypes: { agreeReply: true, againstReply: true, forQuote: false, againstQuote: false },
    });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('test-venice-key')).toBeInTheDocument();
    });
  });
});
