import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiPassport } from '@/api';
import useAuthStore from '@/store/auth.ts';

import LoginPage, { LoginFormValues } from './#LoginPage.tsx';

const searchSchema = z.object({
  redirect: z.string().optional().default('/'),
});

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  validateSearch: searchSchema,
  context: () => {
    return {
      title: '后台登录',
    };
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const setToken = useAuthStore((state) => state.setToken);

  const mutation = useMutation({
    mutationFn: ApiPassport.passwordLogin,
    onSuccess: (data) => {
      setToken(data.token);
      navigate({ to: search.redirect, replace: true });
    },
  });

  let errorMessage: string | undefined;
  if (mutation.isError) {
    errorMessage = mutation.error.message;
  }

  return (
    <LoginPage
      loading={mutation.isPending}
      errorMessage={errorMessage}
      onSubmit={(values: LoginFormValues) => {
        return mutation.mutateAsync(values);
      }}
    />
  );
}
