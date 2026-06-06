/**
 * UI primitives barrel export.
 *
 * Kullanım:
 *   import { Text, Button, Screen, Icon, VStack, HStack, Box, Input, useToast } from '@components/ui';
 */
export { default as Text } from './Text';
export type { TextProps, TextColor, FontRole } from './Text';

export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Screen } from './Screen';
export type { ScreenProps, ScreenVariant } from './Screen';

export { default as Icon } from './Icon';
export type { IconProps, IconColor, LucideIconProps } from './Icon';

export { default as Stack, VStack, HStack, Box } from './Stack';
export type { SpaceKey, BgKey, BorderKey } from './Stack';

export { default as Input } from './Input';
export type { InputProps, InputType } from './Input';

export { ToastProvider, ToastOutlet, useToast } from './Toast';
export type { ToastOptions, ToastVariant } from './Toast';

export { default as AppBottomSheet } from './AppBottomSheet';
export type { AppBottomSheetProps } from './AppBottomSheet';

export { default as SegmentedTabs } from './SegmentedTabs';
export type { SegmentedTabsProps, SegmentedTabOption } from './SegmentedTabs';

export { default as BottomTabBar } from './BottomTabBar';
export type { AppBottomTabBarProps } from './BottomTabBar';
