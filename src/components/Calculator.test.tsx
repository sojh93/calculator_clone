import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Calculator } from './Calculator';
const click = async (name: string) =>
  userEvent.click(screen.getByRole('button', { name }));
describe('calculator integration', () => {
  it('S01: click calculation and recall history', async () => {
    render(<Calculator />);
    for (const key of ['1', '2', '더하기', '3', '계산 결과']) await click(key);
    expect(screen.getByRole('status')).toHaveTextContent('15');
    await click('12 + 3 = 15 불러오기');
    expect(screen.getByRole('status')).toHaveTextContent('15');
    await click('기록 전체 삭제');
    expect(screen.getByText('아직 기록이 없어요')).toBeInTheDocument();
  });
  it('S04: immediate execution with keyboard', async () => {
    render(<Calculator />);
    await userEvent.keyboard('5+3*2{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('16');
    expect(screen.getByTestId('expression')).toHaveTextContent('8 × 2 =');
  });
  it('S40: error and recovery, disabled operations', async () => {
    render(<Calculator />);
    await userEvent.keyboard('5/0{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent(
      '0으로 나눌 수 없습니다',
    );
    expect(screen.getByRole('button', { name: '더하기' })).toBeDisabled();
    await click('7');
    expect(screen.getByRole('status')).toHaveTextContent('7');
  });
  it('persists memory and history through remount', async () => {
    const view = render(<Calculator />);
    await userEvent.keyboard('12+3{Enter}');
    await click('메모리 저장');
    view.unmount();
    render(<Calculator />);
    expect(
      screen.getByRole('button', { name: '12 + 3 = 15 불러오기' }),
    ).toBeInTheDocument();
    await click('메모리 불러오기');
    expect(screen.getByRole('status')).toHaveTextContent('15');
    expect(screen.getByLabelText('메모리 저장됨')).toBeInTheDocument();
    await click('메모리 패널 열기');
    expect(screen.getByText('저장된 값')).toBeInTheDocument();
    await click('저장된 메모리 삭제');
    expect(screen.getByText('저장된 메모리가 없어요')).toBeInTheDocument();
  });
  it('recovers from malformed persisted values', () => {
    localStorage.setItem('calc:v1:memory', '"Infinity"');
    localStorage.setItem('calc:v1:history', '[{"id":1}]');
    render(<Calculator />);
    expect(screen.getByRole('status')).toHaveTextContent('0');
    expect(
      screen.getByRole('button', { name: '메모리 불러오기' }),
    ).toBeDisabled();
  });
  it('ignores input focus and handles keyboard shortcuts', async () => {
    render(
      <>
        <Calculator />
        <input aria-label="test input" />
      </>,
    );
    await userEvent.type(screen.getByRole('textbox'), '123');
    expect(screen.getByRole('status')).toHaveTextContent('0');
    screen.getByRole('textbox').blur();
    await userEvent.keyboard(
      '8{Control>}m{/Control}{Escape}{Control>}r{/Control}',
    );
    expect(screen.getByRole('status')).toHaveTextContent('8');
  });
  it('copies and pastes validated clipboard text', async () => {
    const readText = vi.fn().mockResolvedValue('1,234.5'),
      writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText, writeText },
    });
    render(<Calculator />);
    fireEvent.keyDown(window, { key: 'v', ctrlKey: true });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('1,234.5'),
    );
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    expect(writeText).toHaveBeenCalledWith('1234.5');
    readText.mockResolvedValue('not a number');
    fireEvent.keyDown(window, { key: 'v', ctrlKey: true });
    await waitFor(() => expect(readText).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('status')).toHaveTextContent('1,234.5');
  });
});
