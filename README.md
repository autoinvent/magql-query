# magql-query

[![npm version](https://badge.fury.io/js/%40autoinvent%2Fmagql-query.svg)](https://badge.fury.io/js/%40autoinvent%2Fmagql-query)
![CI](https://github.com/autoinvent/magql-query/workflows/CI/badge.svg?branch=master)
![license](https://img.shields.io/github/license/autoinvent/magql-query)

A library for building and sending queries to a [magql](https://github.com/autoinvent/magql)-generated GraphQL API.

## Docs
[View the docs here](https://magql-query.github.io/)
## Installation

```bash
yarn add @autoinvent/magql-query
```

With npm:

```bash
npm install --save @autoinvent/magql-query
```

## Usage

**IMPORTANT**: This package requires the usage of [conveyor-schema](https://github.com/autoinvent/conveyor-schema) for creating the SchemaBuilder object to pass to the MagqlQuery constructor.

### Example

```typescript
import { MagqlQuery } from '@autoinvent/magql-query'
import { SchemaBuilder } from '@autoinvent/conveyor-schema'

// would also require a schema.mergeSchema(remoteSchema) with the remote (backend) schema in practice
const schema = new SchemaBuilder(schemaJSON)
const endpoint = 'your/graphql/api/endpoint'

const magqlQuery = new MagqlQuery({ schema, endpoint })

// see docs for method options
magqlQuery.buildQuery({ ... })
magqlQuery.sendRequest({ ... }).then(({ data, error }) => {/* do something */})
magqlQuery.buildAndSendRequest({ ... }).then({ data, error }) => {/* do something */})
```
