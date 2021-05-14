## Table of contents

### Classes

- [MagqlQuery](../wiki/Class:%20MagqlQuery)

### Interfaces

- [QueryVariables](../wiki/Interface:%20QueryVariables)

### Type aliases

- [QueryType](../wiki/Exports#querytype)

## Type aliases

### QueryType

Ƭ **QueryType**: ``"index"`` \| ``"detail"`` \| ``"select"`` \| ``"tooltip"`` \| ``"search"`` \| ``"deleteCascades"`` \| ``"selectExistingFields"`` \| ``"create"`` \| ``"update"`` \| ``"delete"``

### Queries
*"index"* - index page (all instances of a model) \
*"detail"* - detail page (single instance of a model) \
*"select"* - select field (relationship) \
*"tooltip"* - tooltip (single instance of a model) \
*"search"* - search (all instances of all models) \
*"deleteCascades"* - delete modal (all instances affected by deletion of single instance) \
*"selectExistingFields"* - creatable string select field (all existing field values) \
### Mutations
*"create"* - create page submit (single instance of a model) \
*"update"* - index/detail page save (single instance of a model) \
*"delete"* - index/detail page delete (single instance of a model)

Defined in: [types.ts:15](https://github.com/autoinvent/magql-query/blob/3443b6a/src/types.ts#L15)
