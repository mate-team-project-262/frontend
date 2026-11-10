import type { ComponentProps } from 'react';
import { cx } from '../../utils/classNames.ts';
import './BrandButton.css';

type Variant = 'primary' | 'ghost' | 'light';
type ButtonProps = { as?: 'button'; variant?: Variant } & ComponentProps<'button'>;
type LinkProps = { as: 'a'; variant?: Variant } & ComponentProps<'a'>;

/**
 * Pill button of the new design. variant: 'primary' (violet gradient) | 'ghost' (outlined)
 * | 'light' (cream, for light surfaces).
 * `as="a"` renders a link that looks the same (e.g. "Share on Telegram").
 */
export default function BrandButton({
  variant = 'primary',
  className,
  ...props
}: ButtonProps | LinkProps) {
  const classes = cx('brand-button', `brand-button--${variant}`, className);
  if (props.as === 'a') {
    const { as, children, ...rest } = props;
    return (
      <a className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const { as, ...rest } = props;
  return <button type="button" className={classes} {...rest} />;
}
