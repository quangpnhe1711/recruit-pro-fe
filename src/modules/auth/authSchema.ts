export type UserDto = {
  id: string;

  username: string;

  email: string;

  fullName: string;

  avatarUrl: string | null;

  phone: string | null;

  roles: string[];

  permissions: string[];
};

export type LoginResponseDto = {
  accessToken: string;

  refreshToken: string | null;

  user: UserDto;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type CandidateLoginRequest = {
  username: string;
  password: string;
};
