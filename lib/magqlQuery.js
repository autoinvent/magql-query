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
  function MagqlQuery(schema, url) {
    _classCallCheck(this, MagqlQuery);

    this.graphQLClient = new GraphQLClient(url);
    this.queryBuilder = makeQueryBuilder(schema);
  }

  _createClass(MagqlQuery, [{
    key: "buildQuery",
    value: function buildQuery(modelName, queryType) {
      return jsonToGraphQLQuery(this.queryBuilder({
        modelName: modelName,
        queryType: queryType
      }));
    }
  }, {
    key: "sendRequest",
    value: function sendRequest(query, variables) {
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
    value: function buildAndSendRequest(modelName, variables, queryType) {
      var query = this.buildQuery(modelName, queryType);
      return this.sendRequest(query, variables);
    }
  }]);

  return MagqlQuery;
}();