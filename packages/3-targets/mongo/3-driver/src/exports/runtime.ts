import type { RuntimeDriverDescriptor } from '@internal/framework-components/execution';
import { DRIVER_INFO } from '../core/driver-info';
import {
  createMongoRuntimeDriver,
  type MongoRuntimeDriver,
} from '../core/runtime/mongo-runtime-driver';

const mongoRuntimeDriverDescriptor: RuntimeDriverDescriptor<
  'mongo',
  'mongo',
  void,
  MongoRuntimeDriver
> = {
  kind: 'driver',
  familyId: 'mongo',
  targetId: 'mongo',
  id: 'mongo',
  version: DRIVER_INFO.version,
  capabilities: {},
  create: createMongoRuntimeDriver,
};

export default mongoRuntimeDriverDescriptor;
export type { MongoBinding, MongoRuntimeDriver } from '../core/runtime/mongo-runtime-driver';
