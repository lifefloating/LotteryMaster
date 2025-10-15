export interface EmailConfig {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  to_email: string;
  lottery_type: 'ssq' | 'dlt' | 'fc3d';
  schedule_type: 'daily' | 'weekly';
  schedule_time: string; // HH:mm format
  schedule_weekday?: number; // 0-6, Sunday-Saturday, only for weekly
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailConfigInput {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name?: string;
}

export interface CreateSubscriptionInput {
  to_email: string;
  lottery_type: 'ssq' | 'dlt' | 'fc3d';
  schedule_type: 'daily' | 'weekly';
  schedule_time: string;
  schedule_weekday?: number;
  enabled?: boolean;
}

export interface UpdateSubscriptionInput {
  to_email?: string;
  lottery_type?: 'ssq' | 'dlt' | 'fc3d';
  schedule_type?: 'daily' | 'weekly';
  schedule_time?: string;
  schedule_weekday?: number;
  enabled?: boolean;
}
