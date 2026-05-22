export interface IAiSearchCandidate {
  photoId: string;
  vector: any;
}

export interface IAiSearchFaceResponse {
  success: boolean;
  matches: string[];
  error?: string;
}

export interface IAiProcessFace {
  embedding: number[];
}

export interface IAiProcessPhotoResponse {
  success: boolean;
  faces: IAiProcessFace[];
  error?: string;
}
