import type { ISODateTime, UUID } from "../types";

export type Market = {
  id: UUID;
  name: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
}