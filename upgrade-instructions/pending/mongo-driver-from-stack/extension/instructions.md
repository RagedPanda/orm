---
changes:
  - id: mongo-driver-from-runtime-descriptor
    summary: |
      `@internal/driver-mongo` has no root export any more, so `createMongoDriver` and `MongoDriverImpl` are gone, as `@internal/driver-postgres` has none. Create a runtime driver from the descriptor that `@internal/driver-mongo/runtime` exports by default, then connect it. `@prisma/orm-mongo/driver` and `@prisma/orm-target-mongo/driver` now export what `driver/control` and `driver/runtime` export. The detection matches files that name `createMongoDriver` or `MongoDriverImpl`, or import the root `@internal/driver-mongo`.
    detection:
      glob: "**/*.{ts,mts,cts,tsx}"
      matches:
        - '(?<![\w$])(?:createMongoDriver|MongoDriverImpl)(?![\w$])'
        - '[''"]@internal/driver-mongo[''"]'
  - id: mongo-driver-connect
    summary: |
      `MongoDriver` from `@internal/mongo-lowering` now declares `connect(binding)`, as `SqlDriver` does, and takes the binding type as a parameter: `MongoDriver<TBinding = void>`. A driver you implement that is connected when it is built adds `async connect(): Promise<void> {}`. `createMongoRuntime` takes `MongoDriver<unknown>`. The detection matches classes that implement `MongoDriver` and object literals typed or checked as `MongoDriver`.
    detection:
      glob: "**/*.{ts,mts,cts,tsx}"
      matches:
        - 'implements\s[^{]*(?<![\w$])MongoDriver(?![\w$])'
        - ':\s*MongoDriver(?:<[^>]*>)?\s*=\s*\{'
        - 'satisfies\s+MongoDriver(?![\w$])'
---

# Create a Mongo runtime driver from its descriptor

Put the descriptor on the execution stack, create the driver from the stack, and connect it to a binding. A `{ kind: 'url', url, dbName }` binding makes the driver open a `MongoClient` and close it on `close()`. A `{ kind: 'mongoClient', client, dbName }` binding uses your client and leaves it open.

```ts
// Before
import { createMongoDriver } from '@internal/driver-mongo';

const stack = createMongoExecutionStack({ target: mongoRuntimeTarget, adapter: mongoRuntimeAdapter });
const driver = await createMongoDriver(url, dbName);

// After
import mongoRuntimeDriver from '@internal/driver-mongo/runtime';

const stack = createMongoExecutionStack({
  target: mongoRuntimeTarget,
  adapter: mongoRuntimeAdapter,
  driver: mongoRuntimeDriver,
});
const driver = stack.driver.create();
await driver.connect({ kind: 'url', url, dbName });
```

Replace `MongoDriverImpl.fromDb(client.db(dbName))` with `driver.connect({ kind: 'mongoClient', client, dbName })` on a driver created the same way. Code that only sends DDL through a control adapter can use the control driver instead: `await mongoControlDriver.create(url)`, with `mongoControlDriver` the default export of `@internal/driver-mongo/control`.

`createMongoRuntime(...)` closes the driver when the runtime closes, so keep calling `runtime.close()` and drop any separate `driver.close()`.

# Implement `connect` on a Mongo driver

```ts
// Before
class StubMongoDriver implements MongoDriver {
  execute<Row>(command: AnyMongoDmlWireCommand): AsyncIterable<Row> { ... }
  async run(command: AnyMongoDdlWireCommand): Promise<void> { ... }
  async close(): Promise<void> {}
}

// After
class StubMongoDriver implements MongoDriver {
  async connect(): Promise<void> {}
  execute<Row>(command: AnyMongoDmlWireCommand): AsyncIterable<Row> { ... }
  async run(command: AnyMongoDdlWireCommand): Promise<void> { ... }
  async close(): Promise<void> {}
}
```
