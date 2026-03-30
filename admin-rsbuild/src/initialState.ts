import { ParsedLocation } from '@tanstack/react-router';
import useAuthStore from '@/store/auth.ts';
import { initErrorHandler } from '@/service/loginService.ts';

/**
 * 初始化登录态
 * @param context
 */
const initialState = async (context: { location: ParsedLocation }) => {
  const { location } = context;
  const authStore = useAuthStore.getState();
  if (authStore.loadState !== 0) {
    return;
  }

  await authStore.initState(location);
};

export default initialState;
