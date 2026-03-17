import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReplyComposer from '../src/popup/components/ReplyComposer';

// Mock the OpenAI module
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked reply 1' } }],
        }),
      },
    },
  })),
}));

describe('ReplyComposer', () => {
  const mockApiKey = 'test-venice-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input and button', () => {
    render(<ReplyComposer apiKey={mockApiKey} />);
    expect(screen.getByPlaceholderText(/Enter/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('shows alert when apiKey is empty', async () => {
    window.alert = jest.fn();
    render(<ReplyComposer apiKey="" />);
    const button = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please enter your Venice API key in Settings');
    });
  });

  it('shows alert when input is too short', async () => {
    window.alert = jest.fn();
    render(<ReplyComposer apiKey={mockApiKey} />);
    const input = screen.getByPlaceholderText(/Enter/i);
    fireEvent.change(input, { target: { value: 'hi' } });
    const button = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please enter at least 5 characters of text');
    });
  });

  it('fetches suggestions successfully', async () => {
    const createMock = require('openai').OpenAI().chat.completions.create;
    render(<ReplyComposer apiKey={mockApiKey} />);
    const input = screen.getByPlaceholderText(/Enter/i);
    fireEvent.change(input, { target: { value: 'This is a test post for generating replies' } });
    const button = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
    });
  });
});