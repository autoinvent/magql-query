import * as R from 'ramda'

/*
create
edit
index
select
detail
tooltip
check_delete
delete
search
 */

const shouldQueryForAction = {
  index: (field, required) => !(field.showIndex || field.queryIndex || R.includes(field.fieldName, required)),
  detail: (field, required) => !(field.showDetail || field.queryDetail || R.includes(field.fieldName, required))
}


const getTypeFields = (schema, action, modelName) => {
    const required = schema[modelName].queryRequired

    return R.map(field => {
      if (R.path(action, shouldQueryForAction, () => false)(field, required))
      if (!(field.showIndex || field.queryIndex || R.includes(field.fieldName, required)) {
        return false
      }
      if (R.is(String, field.type)) {
        return true
      }
      return getTypeFields(schema, action, field.type.target)
    }, schema[modelName].fields)
}


export const make_query_builder = (schema) => {
  return (action, modelName, {id, data, sort, filter} = null) => {
    const modelSchema = schema[modelName]
    const queryName = modelScheme.queryAllName

    R.pipe(
      R.values,
      R.filter(field => field.showIndex || field.queryIndex),
      R.map(field => field.fieldName)
    )(modelSchema.fields)

    const query = {
      query: {
        people: {
          id: true,
          name: true,
          awards: {

          }
        }
      }
    }
  }
}

const build_query = make_query_builder({})
let createPromise = build_query('select', 'User', {data: {}})
