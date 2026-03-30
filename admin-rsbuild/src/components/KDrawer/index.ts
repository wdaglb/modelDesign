import { useKModal } from '@/components/KModal';
import OpenButton from '@/components/KModal/components/OpenButton.tsx';
import Form from '@/components/KModal/components/Form.tsx';

export const useKDrawer = useKModal;

const KDrawer = {
  OpenButton,
  Form,
};

export default KDrawer;
