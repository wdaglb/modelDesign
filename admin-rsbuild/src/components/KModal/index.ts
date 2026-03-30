export { default as useKModal } from './useKModal.tsx';
export { globalModalContext, KModalProvider } from './context.tsx';
import OpenButton from './components/OpenButton.tsx';
import Form from './components/Form.tsx';
import Confirm from './actions/Confirm.tsx';

const KModal = {
  OpenButton,
  Form,
  confirm: Confirm,
};

export default KModal;
