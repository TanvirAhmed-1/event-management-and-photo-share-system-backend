export interface ICreateEventRequest {
  title: string;
  coverImage?: string;
}

export interface IUpdateEventRequest {
  title?: string;
  coverImage?: string;
}
