import { render, screen } from '@testing-library/react';
import FormProvider from './index';
import * as Input from './Input';

describe('FormProvider', () => {
  it('should render children', () => {
    render(
      <FormProvider>
        <div data-testid="child">Child</div>
      </FormProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should initialize with state', () => {
    render(
      <FormProvider state={{ name: 'Initial' }}>
        <Input.Text path="name" data-testid="input" />
      </FormProvider>
    );
    
    const input = screen.getByTestId('input') as HTMLInputElement;
    expect(input.value).toBe('Initial');
  });
});
