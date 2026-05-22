export interface IRegisterUserRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  packageId?: string;
}

export interface ILoginUserRequest {
  email: string;
  password?: string;
}
