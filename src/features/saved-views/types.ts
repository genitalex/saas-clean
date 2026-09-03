export type SavedViewEntity = 'tasks';

export type SavedViewFilters = {
  status?: string;
  priority?: string;
  assigneeId?: string;
  customerId?: string;
  eventId?: string;
  search?: string;
};

export type SavedView = {
  id: string;
  organizationId: string;
  userId: string;
  entity: SavedViewEntity;
  name: string;
  filters: SavedViewFilters;
  sortBy: string | null;
  groupBy: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSavedViewInput = {
  name: string;
  entity: SavedViewEntity;
  filters: SavedViewFilters;
  sortBy?: string | null;
  groupBy?: string | null;
  favorite?: boolean;
};

export type UpdateSavedViewInput = Partial<
  Pick<CreateSavedViewInput, 'name' | 'favorite' | 'sortBy' | 'groupBy' | 'filters'>
>;
