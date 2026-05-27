import { createFileRoute } from '@tanstack/react-router';

import { ProjectListPage } from './index.tsx';

export const Route = createFileRoute('/project/list')({
  component: ProjectListPage,
});
