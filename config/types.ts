export interface GeneratedPageConfig {
  id: string;
  siteMeta: {
    title: string;
    description: string;
    icon: string;
    iconCandidates: string[];
  };
}

export interface GeneratedConfig {
  baseUrl: string;
  pageId: string;
  pageIds: string[];
  pages: GeneratedPageConfig[];
  siteMeta: GeneratedPageConfig['siteMeta'];
  isPlaceholder: boolean;
  isEditThisPage: boolean;
  isShowStarButton: boolean;
}
