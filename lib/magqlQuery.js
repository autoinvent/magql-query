import _classCallCheck from "@babel/runtime-corejs3/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime-corejs3/helpers/esm/createClass";
import { makeQueryBuilder } from './queryBuilder';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { GraphQLClient } from 'graphql-request';
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

export var MagqlQuery =
/*#__PURE__*/
function () {
  function MagqlQuery(_ref) {
    var schema = _ref.schema,
        url = _ref.url;

    _classCallCheck(this, MagqlQuery);

    this.graphQLClient = new GraphQLClient(url);
    this.queryBuilder = makeQueryBuilder(schema);
  }

  _createClass(MagqlQuery, [{
    key: "buildQuery",
    value: function buildQuery(_ref2) {
      var modelName = _ref2.modelName,
          queryType = _ref2.queryType;
      return jsonToGraphQLQuery(this.queryBuilder({
        modelName: modelName,
        queryType: queryType
      }));
    }
  }, {
    key: "sendRequest",
    value: function sendRequest(_ref3) {
      var query = _ref3.query,
          variables = _ref3.variables;
      return this.graphQLClient.request(query, variables).then(function (data) {
        return {
          data: data,
          error: false
        };
      })["catch"](function (err) {
        return {
          data: null,
          error: err
        };
      });
    }
  }, {
    key: "buildAndSendRequest",
    value: function buildAndSendRequest(_ref4) {
      var modelName = _ref4.modelName,
          variables = _ref4.variables,
          queryType = _ref4.queryType;
      var query = this.buildQuery({
        modelName: modelName,
        queryType: queryType
      });
      return this.sendRequest({
        query: query,
        variables: variables
      });
    }
  }]);

  return MagqlQuery;
}();