import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/popup/App';
import { getSettings, saveSettings } from '../src/shared/storage';

jest.mock('../src/shared/storage', () => ({
  getSettings: jest.fn(),
  saveSettings: jest.fn(),
}));

const getSettingsMock = getSettings as jest.Mock;
const saveSettingsMock = saveSettings as jest.Mock;

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    getSettingsMock.mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    render(<App />);
    expect(screen.getByText('Venice Reply Composer')).toBeInTheDocument();
  });

  it('shows saved settings', async () => {
    getSettingsMock.mockResolvedValue({
      veniceApiKey: 'test-key',
      bankrEnabled: true,
    });
    render(<App />);
    await screen.findByDisplayValue('test-key');
    expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('handles settings save', async () => {
    getSettingsMock.mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    saveSettingsMock.mockResolvedValue(undefined);
    render(<App />);

    await screen.findByPlaceholderText('Enter API key');
    const input = screen.getByPlaceholderText('Enter API key');
    const button = screen.getByText('Save Settings');

    fireEvent.change(input, { target: { value: 'new-key' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(saveSettingsMock).toHaveBeenCalledWith({
        veniceApiKey: 'new-key',
        bankrEnabled: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    });
  });

  it('disables save button when API key empty', async () => {
    getSettingsMock.mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    render(<App />);
    await screen.findByPlaceholderText('Enter API key');
    const button = screen.getByText('Save Settings');
    expect(button).toBeDisabled();
  });

  it('enables save button when API key provided', async () => {
    getSettingsMock.mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    render(<App />);
    await screen.findByPlaceholderText('Enter API key');
    const input = screen.getByPlaceholderText('Enter API key');
    fireEvent.change(input, { target: { value: 'new-key' } });
    const button = screen.getByText('Save Settings');
    expect(button).not.toBeDisabled();
  });

  it('shows warning when API key missing', async () => {
    getSettingsMock.mockResolvedValue({ veniceApiKey: '', bankrEnabled: true });
    render(<App />);
    await screen.findByText(/enter your venice api key/i);
  });
});