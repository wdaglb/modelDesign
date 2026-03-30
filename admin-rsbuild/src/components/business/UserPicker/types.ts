export type UserPickerMode = 'search' | 'ids';

export interface UserPickerProps {
  value?: number[];
  onChange?: (userIds: number[]) => void;
  excludeUserIds?: number[];
  multiple?: boolean;
  defaultMode?: UserPickerMode;
}

export interface UserPickerModalProps {
  projectId?: number;
  excludeUserIds?: number[];
  multiple?: boolean;
  defaultMode?: UserPickerMode;
  onSubmit: (userIds: number[]) => Promise<void>;
}
