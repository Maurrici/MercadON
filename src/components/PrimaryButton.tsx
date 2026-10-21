import { AppButton } from '@/components/AppButton';
import type { AppButtonProps } from '@/components/AppButton';

type PrimaryButtonProps = Omit<AppButtonProps, 'tone'>;

/** @deprecated Use AppButton. Kept temporarily for existing screens. */
export function PrimaryButton(props: PrimaryButtonProps) {
  return <AppButton {...props} tone="primary" />;
}
