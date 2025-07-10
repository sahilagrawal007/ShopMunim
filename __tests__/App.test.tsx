import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    navigate: jest.fn(),
  }),
  router: {
    push: jest.fn(),
    navigate: jest.fn(),
  },
}));

// Mock Firebase
jest.mock('../firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}));

// Example test for a simple component
describe('App Tests', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('handles user interactions', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Text onPress={mockOnPress}>Press Me</Text>
    );
    
    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});

// Example test for async operations
describe('Async Operations', () => {
  it('handles async operations correctly', async () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('success');
    
    const result = await mockAsyncFunction();
    
    expect(result).toBe('success');
    expect(mockAsyncFunction).toHaveBeenCalled();
  });
}); 