import * as R from 'ramda'
import * as RE from 'remeda'
import { VariableType } from 'json-to-graphql-query'
import { SchemaBuilder } from '@autoinvent/conveyor-schema'
import { jsonToGraphQLQuery } from 'json-to-graphql-query'
import {
  FieldTypeObject,
  isFieldTypeObject,
  Schema
} from '@autoinvent/conveyor-schema/lib/schemaJson'
import { QueryType, QueryVariables, RelFieldQueryType } from './types'
interface QueryObject {
  [k: string]: string | boolean | QueryObject
}

const getRequiredFields = (model: Schema): string[] =>
  R.union(['__typeName', 'id'], R.pathOr([], ['queryRequired'], model))

const getRelTableFields = ({
  fieldName,
  model
}: {
  fieldName: string
  model: Schema
}): string[] => {
  const fieldType = model.fields?.[fieldName]?.type as FieldTypeObject
  return fieldType?.tableFields ?? []
}

const getQueryName = ({
  schema,
  modelName,
  queryType
}: {
  schema: SchemaBuilder
  modelName: string | undefined
  queryType: QueryType
}): string | undefined => {
  if (!modelName) return queryType

  const model = schema.getModel(modelName)
  switch (queryType) {
    case 'index':
    case 'select':
      return model.queryAllName
    case 'detail':
    case 'tooltip':
      return model.queryName
    case 'create':
    case 'update':
    case 'delete':
      return model.queryName
    default:
      return queryType
  }
}

const getVariables = ({
  modelName,
  queryType
}: {
  modelName: string | undefined
  queryType: QueryType
}): QueryVariables => {
  switch (queryType) {
    case 'index':
      return {
        filter: `${modelName}Filter`,
        sort: `[${modelName}Sort!]`,
        page: 'Page'
      }
    case 'delete':
    case 'detail':
    case 'tooltip':
      return { id: 'ID!' }
    case 'select':
      return { sort: `[${modelName}Sort!]` }
    case 'search':
      return { queryString: 'String!' }
    case 'create':
      return { input: `${modelName}InputRequired!` }
    case 'update':
      return { input: `${modelName}Input!`, id: 'ID!' }
    case 'deleteCascades':
      return { modelName: 'String!', id: 'ID!' }
    case 'selectExistingFields':
      return {}
    default:
      console.error(`Invalid queryType: ${queryType}`)
      return {}
  }
}

interface QueryArgs {
  filter?: VariableType
  sort?: VariableType
  page?: VariableType
  id?: VariableType
  queryString?: VariableType
  input?: VariableType
  tableName?: VariableType
}

const getArgs = (queryType: QueryType): QueryArgs => {
  switch (queryType) {
    case 'index':
      return {
        filter: new VariableType('filter'),
        sort: new VariableType('sort'),
        page: new VariableType('page')
      }
    case 'delete':
    case 'detail':
    case 'tooltip':
      return { id: new VariableType('id') }
    case 'select':
      return { sort: new VariableType('sort') }
    case 'search':
      return { queryString: new VariableType('queryString') }
    case 'create':
      return { input: new VariableType('input') }
    case 'update':
      return { input: new VariableType('input'), id: new VariableType('id') }
    case 'deleteCascades':
      return {
        tableName: new VariableType('modelName'),
        id: new VariableType('id')
      }
    default:
      console.error(`Invalid queryType: ${queryType}`)
      return {}
  }
}

const getFieldQueryType = (
  queryType: QueryType | RelFieldQueryType
): QueryType | RelFieldQueryType => {
  switch (queryType) {
    case 'index':
      return 'indexRelationship'
    case 'detail':
      return 'detailRelationship'
    case 'select':
      return 'selectRelationship'
    default:
      return queryType
  }
}

const getQueryIndexFields = (
  schema: SchemaBuilder,
  modelName: string
): Record<string, boolean> => {
  const indexFields = schema.getIndexFields({
    modelName,
    customProps: {}
  })
  const fields = RE.pipe(
    schema.getModel(modelName),
    RE.prop('fields'),
    RE.mapValues(
      (field) => indexFields.includes(field.fieldName) || field.queryIndex
    )
  )
  return R.pickBy(Boolean, fields)
}

const getQueryDetailFields = (
  schema: SchemaBuilder,
  modelName: string
): Record<string, boolean | string> => {
  const fields = R.filter(
    (field) =>
      Boolean(
        ((field.showDetail ?? true) || field.queryDetail) && !field.virtualField
      ),
    schema.getFields(modelName)
  )
  const model = schema.getModel(modelName)
  return R.mapObjIndexed((val, key) => {
    const show =
      R.pathOr(true, ['fields', key, 'showDetail'], model) ||
      R.path(['fields', key, 'queryDetail'], model)
    return R.pathOr(show, ['fields', key, 'type', 'type'], model)
  }, fields)
}
// needs to be removed?
const makeRelayNodeConnection = (nodeQueryObj: QueryObject): QueryObject => ({
  __typename: true,
  ...nodeQueryObj
})

const getRelFieldObject = ({
  schema,
  modelName,
  fieldName
}: {
  schema: SchemaBuilder
  modelName: string
  fieldName: string
}): QueryObject => {
  const relFieldObject: QueryObject = {
    id: true
  }
  const targetModelFieldType = schema.getField(modelName, fieldName)?.type

  if (!isFieldTypeObject(targetModelFieldType)) {
    console.error(`${fieldName} is not a relationship field`)
    return relFieldObject
  }

  const targetModel = targetModelFieldType?.target

  if (!targetModel) {
    console.error(
      `Target model not found for relationship field ${fieldName} of model ${modelName}`
    )
    return relFieldObject
  }

  const targetModelDisplayField =
    schema.getModel(targetModel).displayField ?? 'name'

  if (typeof targetModelDisplayField === 'string') {
    relFieldObject[targetModelDisplayField] = true
  }
  return relFieldObject
}

const buildTooltipFieldsObject = ({
  schema,
  modelName
}: {
  schema: SchemaBuilder
  modelName: string
}): Record<string, unknown> => {
  // todo: insert customProps from outside application
  const fields = schema.getTooltipFields({
    modelName,
    customProps: {}
  })
  return R.reduce(
    (accumulator, fieldName: string) => {
      const type = schema.getType(modelName, fieldName)
      if (type && type.includes('ToMany')) {
        return R.assoc(
          fieldName,
          makeRelayNodeConnection(
            getRelFieldObject({ schema, modelName, fieldName })
          ),
          accumulator
        )
      } else if (type && type.includes('ToOne')) {
        return R.assoc(
          fieldName,
          getRelFieldObject({ schema, modelName, fieldName }),
          accumulator
        )
      } else {
        return R.assoc(fieldName, true, accumulator)
      }
    },
    {},
    fields
  )
}

const pickFields = (
  arr: string[],
  fields: Record<string, boolean | string>
): Record<string, boolean | string> =>
  R.pickBy((_val, key) => arr.includes(key), fields)

const buildFieldsObject = ({
  schema,
  queryType,
  modelName,
  queryFields = []
}: {
  schema: SchemaBuilder
  queryType: QueryType | RelFieldQueryType
  modelName: string | undefined
  queryFields?: string[]
}): Record<string, unknown> => {
  if (!modelName) {
    console.error('No model supplied to build fields object for query!')
    return {}
  }

  const model = schema.getModel(modelName)
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  if (queryType === 'tooltip') {
    return buildTooltipFieldsObject({ schema, modelName })
  }

  let fields = ((): Record<string, unknown> => {
    switch (queryType) {
      case 'index':
        return getQueryIndexFields(schema, modelName)
      case 'detail':
        return getQueryDetailFields(schema, modelName)
      case 'detailRelationship':
        return pickFields(queryFields, getQueryDetailFields(schema, modelName))
      default:
        return {}
    }
  })()
  fields = R.mergeDeepLeft(requiredObj, fields)
  // replace with query object when fieldName is Relationship type
  fields = R.mapObjIndexed((val, key) => {
    const field = schema.getField(modelName, key)
    if (!schema.isRel(modelName, key)) {
      return val
    }

    return buildFieldsObject({
      schema,
      queryType: getFieldQueryType(queryType),
      modelName: R.path(['type', 'target'], field) as string,
      queryFields: getRelTableFields({ model, fieldName: key })
    })
  }, fields)

  return fields
}

const buildSearchFieldsObject = (
  schema: SchemaBuilder,
  model: Schema
): QueryObject => {
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  let fields: QueryObject = {}
  fields.id = true
  if (typeof model.displayField === 'string') {
    fields[model.displayField] = true
  }

  fields = R.mergeDeepLeft(requiredObj, fields)

  fields.__typeName = model.modelName

  fields = R.mapObjIndexed((val, key) => {
    const field = schema.getField(model.modelName, key)
    if (!schema.isRel(model.modelName, key) || !field) {
      return val
    }

    const fieldType = field.type as FieldTypeObject

    return buildSearchFieldsObject(
      schema,
      schema.getModel(fieldType.target ?? '')
    )
  }, fields)

  return fields
}

const buildSearchFieldsArray = (schema: SchemaBuilder): QueryObject[] => {
  const fieldsArray: QueryObject[] = []
  R.forEachObjIndexed((model) => {
    if (schema.getSearchable(model.modelName)) {
      fieldsArray.push(buildSearchFieldsObject(schema, model))
    }
  }, schema.schemaJSON)
  return fieldsArray
}

const buildCascadesObject = (
  schema: SchemaBuilder,
  model: Schema
): QueryObject => {
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  let cascades: QueryObject = {}
  cascades.__typename = true
  cascades.id = true
  if (typeof model.displayField === 'string') {
    cascades[model.displayField] = true
  }

  cascades = R.mergeDeepLeft(requiredObj, cascades)

  cascades.__typeName = model.modelName

  cascades = R.mapObjIndexed((val, key) => {
    const field = schema.getField(model.modelName, key)
    if (!schema.isRel(model.modelName, key) || !field) {
      return val
    }

    const fieldType = field.type as FieldTypeObject

    return buildCascadesObject(schema, schema.getModel(fieldType.target ?? ''))
  }, cascades)

  return cascades
}

const buildDeleteCascadesArray = (schema: SchemaBuilder): QueryObject[] => {
  const cascadesArray: QueryObject[] = []
  R.forEachObjIndexed((model) => {
    if (model.showDeleteModal !== false)
      cascadesArray.push(buildCascadesObject(schema, model))
  }, schema.schemaJSON)
  return cascadesArray
}

const generatePrepopulatedQuery = ({
  modelName,
  fieldName
}: {
  fieldName: string | undefined
  modelName: string | undefined
}): string => {
  if (!fieldName || !modelName) {
    console.error(
      'No field name or model name provided for SELECT_EXISTING_FIELDS query'
    )
    return ''
  }
  return `{ result: existingFieldValues(modelName: "${modelName}", fieldName: "${fieldName}") }`
}

const makeQueryBuilder = (schema: SchemaBuilder) => {
  return ({
    modelName,
    fieldName,
    queryType = 'index'
  }: {
    modelName?: string
    fieldName?: string
    queryType: QueryType
  }): string => {
    const queryName = getQueryName({ schema, modelName, queryType })
    const queryVariables = getVariables({ modelName, queryType })

    // queryName should not be null/undefined
    if (!queryName) {
      console.error(
        `queryName for ${modelName}'s ${queryType} query was null or undefined`
      )
      return ''
    }

    switch (queryType) {
      case 'index':
      case 'detail':
      case 'select':
      case 'tooltip':
        return jsonToGraphQLQuery({
          query: {
            __variables: queryVariables,
            [queryName]: {
              __args: getArgs(queryType),
              result: {
                ...buildFieldsObject({ schema, modelName, queryType })
              },
              errors: true,
              count: queryType === 'index'
            }
          }
        })
      case 'search':
        return jsonToGraphQLQuery({
          query: {
            __variables: queryVariables,
            search: {
              __args: getArgs(queryType),
              __typename: true,
              __on: buildSearchFieldsArray(schema)
            }
          }
        })
      case 'create':
      case 'update':
      case 'delete':
        return jsonToGraphQLQuery({
          mutation: {
            __variables: queryVariables,
            [`${queryType}${modelName}`]: {
              __args: getArgs(queryType),
              result: {
                __typename: true,
                id: true
              },
              errors: true
            }
          }
        })
      case 'deleteCascades':
        return jsonToGraphQLQuery({
          query: {
            __variables: queryVariables,
            checkDelete: {
              __args: getArgs(queryType),
              __on: buildDeleteCascadesArray(schema)
            }
          }
        })
      case 'selectExistingFields':
        return generatePrepopulatedQuery({ modelName, fieldName })
      default:
        console.error(`Invalid queryType: ${queryType}`)
        return ''
    }
  }
}

export default makeQueryBuilder
