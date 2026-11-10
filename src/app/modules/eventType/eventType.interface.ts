export interface ICreateEventTypeField {
  key: string;
  label: string;
  fieldType?: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "BOOLEAN";
  options?: any;
  isRequired?: boolean;
  isEnabled?: boolean;
  displayOrder?: number;
}

export interface ICreateEventTypeRequest {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  minGuests?: number;
  maxGuests?: number;
  defaultGuests?: number;
  allowServiceSelection?: boolean;
  allowFoodSelection?: boolean;
  displayOrder?: number;
  fields?: ICreateEventTypeField[];
}

export interface IUpdateEventTypeRequest {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  minGuests?: number;
  maxGuests?: number;
  defaultGuests?: number;
  allowServiceSelection?: boolean;
  allowFoodSelection?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

