import { render, screen, fireEvent } from '@testing-library/react';
import { getSettings, saveSettings } from '../src/shared/storage';

jest.mock('../src/shared/storage');

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings form', () => {
    (getSettings as jest.Mock).mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    render(<Settings />);
    expect(screen.getByPlaceholderText(/Enter.*API key/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('shows saved settings', async () => {
    (getSettings as jest.Mock).mockResolvedValue({
      veniceApiKey: 'test-key',
      bankrEnabled: true,
    });
    render(<Settings />);
    await screen.findByDisplayValue('test-key');
    expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('saves settings when form is submitted', async () => {
    (getSettings as jest.Mock).mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    (saveSettings as jest.Mock).mockResolvedValue(undefined);

    render(<Settings />);

    await screen.findByPlaceholderText(/Enter.*API key/i);
    const input = screen.getByPlaceholderText(/Enter.*API key/i);
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByText(/Save/i);

    fireEvent.change(input, { target: { value: 'new-key' } });
    fireEvent.click(checkbox);
    fireEvent.click(button);

    expect(saveSettings).toHaveBeenCalledWith({
      veniceApiKey: 'new-key',
      bankrEnabled: false,
    });
  });
});