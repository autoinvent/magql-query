# magql-query
![CI](https://github.com/autoinvent/magql-query/workflows/CI/badge.svg?branch=master)

Build GraphQL queries to send to Magql.


# Contributing

First, test package in autoinvent_example repo:

1.) build /lib files with your new changes in magql-query repo;

    npm run build
    
2.) run in magql-query repo

    yalc publish
    
3.) run in autoinvent_example repo

    yalc add @autoinvent/magql-query 
    
4.) for every new change in magql-query, to test out and reload, simply repeat step 1 and run in magql-query repo:

    yalc push