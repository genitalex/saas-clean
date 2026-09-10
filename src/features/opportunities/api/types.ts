export interface Opportunity {
  id: string;
  title: string;
  customer: string;
  value: number;
  probability: number;
  stage: string;
  close: string;
  owner: string;
}

export interface OpportunityInput {
  title: string;
  customer: string;
  value: number;
  probability?: number;
  stage?: string;
  close?: string;
  owner?: string;
}
