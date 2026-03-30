import request from '@/utils/request.ts';

export interface ProjectMember {
  projectId: number;
  userId: number;
  nickname?: string;
  avatarId?: string;
  joinedAt?: string;
}

export interface ProjectMemberUpdateParams {
  projectId: number;
  userIds: number[];
}

export const getList = (projectId: number) => {
  return request<ProjectMember[]>('/project/member/list', {
    params: { projectId },
  });
};

export const add = (data: ProjectMemberUpdateParams) => {
  return request<number>('/project/member/add', {
    method: 'post',
    data,
  });
};

export const deleted = (data: ProjectMemberUpdateParams) => {
  return request<number>('/project/member/delete', {
    method: 'post',
    data,
  });
};
