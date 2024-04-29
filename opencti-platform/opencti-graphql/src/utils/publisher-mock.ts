import type { StixCoreObject, StixRelationshipObject } from '../types/stix-common';

export interface NotificationData {
  notification_id: string
  instance: StixCoreObject | StixRelationshipObject | Partial<{ id: string }>
  type: string
  message: string
}
const DEFAULT_NOTIFICATION: NotificationData = {
  notification_id: 'default_notification_id',
  instance: { id: 'instanceId' },
  type: 'live',
  message: '[TEST] Creates a report with id : instanceId',
};

const DEFAULT_DIGEST: NotificationData[] = [
  {
    notification_id: 'default_notification_id',
    instance: { id: 'instanceId' },
    type: 'live',
    message: '[TEST] Creates a report with id : instanceId',
  },
  {
    notification_id: 'default_notification_id_2',
    instance: { id: 'instanceId2' },
    type: 'live',
    message: '[TEST] Udpates a malware with id : instanceId2',
  },
];

const DEFAULT_ACTIVITY = {
  notification_id: 'default_activity_id',
  instance: {
    id: 'instanceId',
    entity_type: 'Sync',
    input: [
      {
        key: 'name',
        value: [
          'Some name'
        ]
      },
    ]
  },
  version: '1',
  type: 'file',
  event_access: 'extended',
  event_scope: 'read',
  status: 'success',
  message: ' reads from `Test` the file `2024-04-29T10%3A24%3A32.423Z_PAP%3ACLEAR_(ExportFileStix)_Report-Test_full.json`',
  data: {},
};

export const MOCK_NOTIFICATIONS: Record<string, NotificationData[]> = {
  default_notification: [DEFAULT_NOTIFICATION],
  default_digest: DEFAULT_DIGEST,
  default_activity: [DEFAULT_ACTIVITY],
};
